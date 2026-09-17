import os
import json
from rank_bm25 import BM25Okapi
import chromadb
import groq
from dotenv import load_dotenv

# Load environment variables (.env)
load_dotenv()

# 1. Initialize Groq Client for fast, reliable answer generation
# Make sure GROQ_API_KEY is set in your .env or system environment
groq_client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))

# 2. Connect to ChromaDB for Vector Search
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_collection(name="bis_standards")

# 3. Load chunks for BM25 Keyword Search
with open("output/bis_chunks_ocr.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

corpus = [c["text"] for c in chunks]
tokenized_corpus = [doc.lower().split() for doc in corpus]
bm25 = BM25Okapi(tokenized_corpus)

def hybrid_search(query, top_k=3):
    """Performs Hybrid Search combining BM25 Keywords and ChromaDB Vectors"""
    
    # A. Keyword Search (BM25)
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)
    
    # Get top BM25 indices
    top_bm25_indices = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:top_k]
    
    # B. Vector Semantic Search (ChromaDB)
    vector_results = collection.query(
        query_texts=[query],
        n_results=top_k
    )
    
    # C. Combine and Deduplicate Results
    combined_docs = []
    seen_texts = set()
    
    # Add vector results first
    if vector_results and "documents" in vector_results:
        for doc, meta in zip(vector_results["documents"][0], vector_results["metadatas"][0]):
            if doc not in seen_texts:
                seen_texts.add(doc)
                combined_docs.append({"text": doc, "meta": meta, "source": "Vector (Semantic)"})
                
    # Add keyword results
    for idx in top_bm25_indices:
        doc_text = corpus[idx]
        if doc_text not in seen_texts:
            seen_texts.add(doc_text)
            meta = {"standard_id": chunks[idx]["standard_id"], "page_number": chunks[idx]["page_number"]}
            combined_docs.append({"text": doc_text, "meta": meta, "source": "Keyword (BM25)"})
            
    return combined_docs[:top_k]

def ask_bis_assistant(user_question):
    print(f"\nUser Query: '{user_question}'")
    print("Running Hybrid Search (Vector + Keyword)...")
    
    retrieved_chunks = hybrid_search(user_question, top_k=3)
    
    # Build context block for the LLM
    context_text = ""
    citations = []
    for i, item in enumerate(retrieved_chunks):
        context_text += f"\n--- Source Chunk {i+1} ({item['meta']['standard_id']}, Page {item['meta']['page_number']}) ---\n{item['text']}\n"
        citations.append(f"{item['meta']['standard_id']} (Page {item['meta']['page_number']})")
        
    system_instruction = (
        "You are an expert regulatory compliance assistant specializing in Indian Standards (BIS). "
        "Answer the user's question using ONLY the provided context below. If the answer cannot be found "
        "in the context, state clearly that the standard document does not contain this information. "
        "Always cite the standard ID and page number."
    )

    user_content = f"Context:\n{context_text}\n\nUser Question: {user_question}"
    
    print("Generating answer with Groq (Llama-3.3-70b-versatile)...")
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ],
        temperature=0.0
    )
    
    response_text = completion.choices[0].message.content
    
    print("\n=== AI Assistant Response ===")
    print(response_text)
    print(f"\nCitations used: {list(set(citations))}")

# Test the script out!
if __name__ == "__main__":
    ask_bis_assistant("What does the standard say about the scope and what is excluded?")