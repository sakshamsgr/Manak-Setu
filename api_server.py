import os
import psycopg2
from pgvector.psycopg2 import register_vector
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
import random

# Load environment variables from .env file
load_dotenv()

# Initialize Gemini Client once
client = genai.Client()

# --- 1. Setup ---
app = FastAPI(title="BIS Multimodal RAG Assistant API")

# Enable CORS for local PWA & Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Session Pooler URI
DB_URI = "postgresql://postgres.ndpfmlkhxjphooyzvdxk:sih_2026_sssddr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# In-memory session store
chat_sessions = {}

# --- Health Check Endpoint ---
@app.get("/")
def read_root():
    return {"status": "online", "message": "BIS AI Backend is running"}

# --- 2. Supabase Cloud Vector Search Helper ---
def supabase_vector_search(query: str, top_k: int = 4, threshold: float = 0.5):
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=query,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    query_embedding = response.embeddings[0].values

    conn = psycopg2.connect(DB_URI)
    register_vector(conn)
    cursor = conn.cursor()

    # ADDED STRICT THRESHOLD: Only return chunks that actually match the query
    cursor.execute("""
        SELECT standard_id, page_number, content, embedding <=> %s::vector AS distance
        FROM standard_chunks
        WHERE embedding <=> %s::vector < %s
        ORDER BY distance ASC
        LIMIT %s;
    """, (query_embedding, query_embedding, threshold, top_k))

    results = cursor.fetchall()
    cursor.close()
    conn.close()

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
    language: str = "en"

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if req.session_id not in chat_sessions:
        chat_sessions[req.session_id] = []

    history = chat_sessions[req.session_id]
    retrieved_chunks = supabase_vector_search(req.message)
    
    # Language Directive
    lang_directive = ""
    if req.language == "hi":
        lang_directive = "\n- IMPORTANT: Provide your entire response strictly in Hindi (हिन्दी) using Devanagari script."
    elif req.language == "bn":
        lang_directive = "\n- IMPORTANT: Provide your entire response strictly in Bengali (বাংলা) using Bengali script."
    else:
        lang_directive = "\n- IMPORTANT: Provide your response in English."

    # --- Similarity / Content Guard ---
    if not retrieved_chunks or len(retrieved_chunks) == 0:
        fallback_msg = "This information is not present in the indexed BIS standard documentation."
        if req.language == "hi":
            fallback_msg = "यह जानकारी अनुक्रमित बीआईएस मानक दस्तावेज़ों में उपलब्ध नहीं है।"
        elif req.language == "bn":
            fallback_msg = "এই তথ্যটি সূচিবদ্ধ বিআইএস মানক নথিতে উপলব্ধ নেই।"
        return {
            "response": fallback_msg,
            "citations": []
        }
    # ----------------------------------------

    context_text = "\n".join([f"- {item['text']} (Page {item['meta']['page_number']})" for item in retrieved_chunks])

    system_instruction = f"""You are a strict Bureau of Indian Standards (BIS) verification agent.
    CRITICAL RULE: Answer the query SOLELY using the facts directly stated in the Context below.
    - Do NOT extrapolate, assume, or use any prior training knowledge.
    - If the Context does not explicitly contain the answer, reply EXACTLY with:
    "This information is not present in the indexed BIS standard documentation."
    - Always include the document name and page number when citing facts.{lang_directive}

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
                temperature=0.0
            )
        )

        history.append({"role": "user", "text": req.message})
        history.append({"role": "model", "text": response.text})

        return {"response": response.text, "citations": [c['meta'] for c in retrieved_chunks]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. Multimodal Endpoint ---
@app.post("/chat/multimodal")
async def multimodal_chat_endpoint(
    session_id: str = Form(...),
    message: str = Form("Analyze this attachment in accordance with Indian Standards (BIS)."),
    file: UploadFile = File(...),
    language: str = Form("en")
):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []

    history = chat_sessions[session_id]
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    retrieved_chunks = supabase_vector_search(message)
    
    # Language Directive
    lang_directive = ""
    if language == "hi":
        lang_directive = "\n- IMPORTANT: Provide your entire response strictly in Hindi (हिन्दी) using Devanagari script."
    elif language == "bn":
        lang_directive = "\n- IMPORTANT: Provide your entire response strictly in Bengali (বাংলা) using Bengali script."
    else:
        lang_directive = "\n- IMPORTANT: Provide your response in English."

    # --- Similarity / Content Guard ---
    if not retrieved_chunks or len(retrieved_chunks) == 0:
        fallback_msg = "This information is not present in the indexed BIS standard documentation."
        if language == "hi":
            fallback_msg = "यह जानकारी अनुक्रमित बीआईएस मानक दस्तावेज़ों में उपलब्ध नहीं है।"
        elif language == "bn":
            fallback_msg = "এই তথ্যটি সূচিবদ্ধ বিআইএস মানক নথিতে উপলব্ধ নেই।"
        return {
            "filename": file.filename,
            "response": fallback_msg,
            "citations": []
        }
    # ----------------------------------------

    context_text = "\n".join([f"- {item['text']} (Page {item['meta']['page_number']})" for item in retrieved_chunks])

    system_instruction = f"""You are a strict Bureau of Indian Standards (BIS) compliance auditor.
    CRITICAL RULE: Analyze the uploaded media and answer the query SOLELY using the facts directly stated in the Context below.
    - Do NOT extrapolate, assume, or use any prior training knowledge.
    - If the Context does not explicitly contain the answer, reply EXACTLY with:
    "This information is not present in the indexed BIS standard documentation."{lang_directive}

    Context:\n{context_text}"""

    media_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    text_part = types.Part.from_text(text=message)

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[types.Content(role="user", parts=[media_part, text_part])],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.0
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

# --- 5. Authentication & OTP Endpoints ---
otp_storage = {}

class OTPRequest(BaseModel):
    email: str

@app.post("/auth/send-otp")
async def send_otp(req: OTPRequest):
    otp_code = str(random.randint(100000, 999999))
    otp_storage[req.email] = otp_code
    
    sender_email = os.getenv("SENDER_EMAIL") 
    sender_password = os.getenv("SENDER_PASSWORD") 
    
    if not sender_email or not sender_password:
        print(f"\n[SECURITY] SIMULATED OTP FOR {req.email}: {otp_code}\n")
        return {"message": "Simulated OTP sent to terminal"}

    msg = MIMEText(f"Your official BIS AI Assistant verification code is: {otp_code}\n\nThis code will expire shortly.")
    msg['Subject'] = 'BIS Portal Login Verification'
    msg['From'] = sender_email
    msg['To'] = req.email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        return {"message": "OTP sent successfully via Email"}
    except Exception as e:
        print(f"Email Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email. Check your SMTP credentials.")

class VerifyRequest(BaseModel):
    email: str
    otp: str

@app.post("/auth/verify-otp")
async def verify_otp(req: VerifyRequest):
    stored_otp = otp_storage.get(req.email)
    
    if not stored_otp or stored_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
    
    del otp_storage[req.email]
    return {"message": "Authentication successful!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
