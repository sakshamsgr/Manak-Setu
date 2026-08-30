import os
import json
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from rank_bm25 import BM25Okapi
import chromadb
from google import genai
from google.genai import types

# --- 1. Setup ---
app = FastAPI(title="BIS Multimodal RAG Assistant API")
client = genai.Client()

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_collection(name="bis_standards")

with open("output/bis_chunks_ocr.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

corpus = [c["text"] for c in chunks]
tokenized_corpus = [doc.lower().split() for doc in corpus]
bm25 = BM25Okapi(tokenized_corpus)

# In-memory session store
chat_sessions = {}

# --- 2. Hybrid Search Helper ---
def hybrid_search(query: str, top_k: int = 3):
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)
    top_bm25_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:top_k]
    
    vector_results = collection.query(query_texts=[query], n_results=top_k)
    
    combined_docs = []
    seen_texts = set()
    
    if vector_results and "documents" in vector_results:
        for doc, meta in zip(vector_results["documents"][0], vector_results["metadatas"][0]):
            if doc not in seen_texts:
                seen_texts.add(doc)
                combined_docs.append({"text": doc, "meta": meta})
                
    for idx in top_bm25_indices:
        doc_text = corpus[idx]
        if doc_text not in seen_texts:
            seen_texts.add(doc_text)
            meta = {"standard_id": chunks[idx]["standard_id"], "page_number": chunks[idx]["page_number"]}
            combined_docs.append({"text": doc_text, "meta": meta})
            
    return combined_docs[:top_k]

# --- 3. Text Chat Endpoint ---
class ChatRequest(BaseModel):
    session_id: str
    message: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if req.session_id not in chat_sessions:
        chat_sessions[req.session_id] = []
        
    history = chat_sessions[req.session_id]
    retrieved_chunks = hybrid_search(req.message)
    context_text = "\n".join([f"- {item['text']} (Page {item['meta']['page_number']})" for item in retrieved_chunks])

    system_instruction = f"""You are an expert Indian Standards (BIS) assistant. 
    Use the following retrieved context to answer the user's question accurately.
    Context:\n{context_text}"""

    gemini_history = []
    for msg in history:
        gemini_history.append(types.Content(role=msg["role"], parts=[types.Part.from_text(text=msg["text"])]))

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=gemini_history + [
                types.Content(role="user", parts=[types.Part.from_text(text=req.message)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2
            )
        )
        
        history.append({"role": "user", "text": req.message})
        history.append({"role": "model", "text": response.text})
        
        return {"response": response.text, "citations": [c['meta'] for c in retrieved_chunks]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. Multimodal Endpoint (Image/Audio/Doc Upload) ---
@app.post("/chat/multimodal")
async def multimodal_chat_endpoint(
    session_id: str = Form(...),
    message: str = Form("Analyze this attachment in accordance with Indian Standards (BIS)."),
    file: UploadFile = File(...)
):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
        
    history = chat_sessions[session_id]
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # 1. Search knowledge base using the accompanying text message
    retrieved_chunks = hybrid_search(message)
    context_text = "\n".join([f"- {item['text']} (Page {item['meta']['page_number']})" for item in retrieved_chunks])

    system_instruction = f"""You are an expert Indian Standards (BIS) compliance auditor.
    Analyze the uploaded media (image, audio, or document) and compare it against the Indian Standards context provided below.
    Identify compliance issues, verify markings/packaging requirements, and cite standard clauses and page numbers where applicable.
    
    Context:\n{context_text}"""

    media_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    text_part = types.Part.from_text(text=message)

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[types.Content(role="user", parts=[media_part, text_part])],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2
            )
        )
        
        history.append({"role": "user", "text": f"[Uploaded {file.filename}]: {message}"})
        history.append({"role": "model", "text": response.text})

        return {
            "filename": file.filename,
            "response": response.text,
            "citations": [c['meta'] for c in retrieved_chunks]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)