import os
import psycopg2
from pgvector.psycopg2 import register_vector
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from google import genai
from google.genai import types

# --- 1. Setup ---
app = FastAPI(title="BIS Multimodal RAG Assistant API")
client = genai.Client()

# --- REPLACE THIS WITH YOUR SESSION POOLER URI ---
DB_URI = "postgresql://postgres.ndpfmlkhxjphooyzvdxk:sih_2026_sssddr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# In-memory session store
chat_sessions = {}

# --- 2. Supabase Cloud Vector Search Helper ---
def supabase_vector_search(query: str, top_k: int = 3):
    # 1. Generate the 768-dimensional embedding for the user's question
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=query,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    query_embedding = response.embeddings[0].values
    
    # 2. Connect to Supabase and execute Cosine Distance search (<=>)
    conn = psycopg2.connect(DB_URI)
    register_vector(conn)
    cursor = conn.cursor()
    
    # This SQL query finds the closest vector matches natively in the cloud
    cursor.execute("""
        SELECT standard_id, page_number, content, embedding <=> %s::vector AS distance
        FROM standard_chunks
        ORDER BY distance ASC
        LIMIT %s;
    """, (query_embedding, top_k))
    
    results = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # 3. Format the results for the LLM
    combined_docs = []
    for row in results:
        standard_id, page_number, content, distance = row
        meta = {"standard_id": standard_id, "page_number": page_number, "distance": distance}
        combined_docs.append({"text": content, "meta": meta})
        
    return combined_docs

# --- 3. Text Chat Endpoint ---
class ChatRequest(BaseModel):
    session_id: str
    message: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if req.session_id not in chat_sessions:
        chat_sessions[req.session_id] = []
        
    history = chat_sessions[req.session_id]
    
    # Search Supabase Database instead of local ChromaDB
    retrieved_chunks = supabase_vector_search(req.message)
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

    # Search Supabase Database based on user's accompanying message
    retrieved_chunks = supabase_vector_search(message)
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