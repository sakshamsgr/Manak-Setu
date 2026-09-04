import os
import psycopg2
from pgvector.psycopg2 import register_vector
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
import random
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
import hashlib

# Load environment variables from .env file
load_dotenv()

# Initialize Gemini Client once
client = genai.Client()

# --- 1. Setup ---
app = FastAPI(title="BIS Multimodal RAG Assistant API")

# Enable CORS for local PWA & Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Session Pooler URI
DB_URI = os.getenv("DB_URI", "postgresql://postgres.ndpfmlkhxjphooyzvdxk:sih_2026_sssddr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres")

# In-memory session store
chat_sessions = {}

# Security Contexts
JWT_SECRET = os.getenv("JWT_SECRET", "fallback-dev-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

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
            model='gemini-3.6-flash',
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
            model='gemini-3.6-flash',
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

# --- 5. SECURE AUTHENTICATION SYSTEM ---

# Schemas
class SignupRequest(BaseModel):
    full_name: str
    dob: str
    email: str
    password: str

class VerifySignupRequest(BaseModel):
    email: str
    otp: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

# Helpers
def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def send_secure_otp(email: str, purpose: str):
    clean_email = email.lower().strip()
    otp_code = str(random.randint(100000, 999999))
    hashed = hash_otp(otp_code)
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    # ALWAYS print to terminal for easy local testing
    print(f"\n==========================================")
    print(f"🔑 {purpose.upper()} OTP FOR {clean_email}: {otp_code}")
    print(f"==========================================\n")

    conn = psycopg2.connect(DB_URI)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = %s", (clean_email, purpose))
    cursor.execute(
        "INSERT INTO auth_otps (email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s)",
        (clean_email, hashed, purpose, expires)
    )
    conn.commit()
    cursor.close()
    conn.close()

    sender_email = os.getenv("SMTP_USERNAME") 
    sender_password = os.getenv("SMTP_PASSWORD") 
    
    if not sender_email or not sender_password:
        return
        
    msg = MIMEText(f"Your BIS AI Assistant verification code is: {otp_code}\n\nThis code will expire in 5 minutes.")
    msg['Subject'] = 'BIS Portal Security Code'
    msg['From'] = os.getenv("SMTP_FROM_EMAIL", sender_email)
    msg['To'] = clean_email

    try:
        with smtplib.SMTP_SSL(os.getenv("SMTP_HOST", "smtp.gmail.com"), int(os.getenv("SMTP_PORT", 465))) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
    except Exception as e:
        print(f"SMTP Email Error: {e}")

# Endpoints
@app.post("/auth/signup")
async def signup(req: SignupRequest):
    clean_email = req.email.lower().strip()
    conn = psycopg2.connect(DB_URI)
    cursor = conn.cursor()
    cursor.execute("SELECT is_verified FROM users WHERE email = %s", (clean_email,))
    user = cursor.fetchone()
    
    if user:
        cursor.close()
        conn.close()
        if user[0]:
            raise HTTPException(status_code=400, detail="An account with this email already exists. Please Login.")
        else:
            send_secure_otp(clean_email, "signup")
            return {"message": "OTP sent to email"}

    hashed_password = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute(
        "INSERT INTO users (full_name, dob, email, password_hash) VALUES (%s, %s, %s, %s)",
        (req.full_name, req.dob, clean_email, hashed_password)
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    send_secure_otp(clean_email, "signup")
    return {"message": "Account created. Please verify OTP."}

@app.post("/auth/signup/verify-otp")
async def verify_signup(req: VerifySignupRequest, response: Response):
    clean_email = req.email.lower().strip()
    hashed_input = hash_otp(req.otp.strip())
    
    conn = psycopg2.connect(DB_URI)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, expires_at FROM auth_otps WHERE email = %s AND purpose = 'signup' ORDER BY created_at DESC LIMIT 1",
        (clean_email,)
    )
    otp_record = cursor.fetchone()
    
    if not otp_record:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new one.")
        
    if otp_record[1] < datetime.now(timezone.utc):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    cursor.execute(
        "SELECT 1 FROM auth_otps WHERE email = %s AND otp_hash = %s AND purpose = 'signup'",
        (clean_email, hashed_input)
    )
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # FETCH DOB HERE
    cursor.execute("UPDATE users SET is_verified = TRUE WHERE email = %s RETURNING id, full_name, dob", (clean_email,))
    user = cursor.fetchone()
    
    cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = 'signup'", (clean_email,))
    conn.commit()
    cursor.close()
    conn.close()

    # ADD DOB TO JWT COOKIE
    dob_str = str(user[2]) if user[2] else ""
    access_token = create_access_token(
        data={"sub": clean_email, "name": user[1], "dob": dob_str}, 
        expires_delta=timedelta(minutes=float(os.getenv("JWT_EXPIRATION_MINUTES", 1440)))
    )
    
    response.set_cookie(key="bis_session", value=access_token, httponly=True, samesite="lax", secure=False)
    return {"message": "Verification successful", "user": {"email": clean_email, "name": user[1], "dob": dob_str}}


@app.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    clean_email = req.email.lower().strip()
    conn = psycopg2.connect(DB_URI)
    cursor = conn.cursor()
    # FETCH DOB HERE
    cursor.execute("SELECT password_hash, full_name, is_verified, dob FROM users WHERE email = %s", (clean_email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user[0].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not user[2]:
        raise HTTPException(status_code=403, detail="Email not verified. Please complete signup verification.")

    # ADD DOB TO JWT COOKIE
    dob_str = str(user[3]) if user[3] else ""
    access_token = create_access_token(
        data={"sub": clean_email, "name": user[1], "dob": dob_str}, 
        expires_delta=timedelta(minutes=float(os.getenv("JWT_EXPIRATION_MINUTES", 1440)))
    )
    response.set_cookie(key="bis_session", value=access_token, httponly=True, samesite="lax", secure=False)
    return {"message": "Login successful", "user": {"email": clean_email, "name": user[1], "dob": dob_str}}

@app.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    clean_email = req.email.lower().strip()
    conn = psycopg2.connect(DB_URI)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = %s AND is_verified = TRUE", (clean_email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        send_secure_otp(clean_email, "reset")
        
    return {"message": "If the email is registered, a password reset code has been sent."}

@app.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    clean_email = req.email.lower().strip()
    hashed_input = hash_otp(req.otp.strip())
    
    conn = psycopg2.connect(DB_URI)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT expires_at FROM auth_otps WHERE email = %s AND purpose = 'reset' ORDER BY created_at DESC LIMIT 1",
        (clean_email,)
    )
    otp_record = cursor.fetchone()
    
    if not otp_record or otp_record[0] < datetime.now(timezone.utc):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    cursor.execute(
        "SELECT 1 FROM auth_otps WHERE email = %s AND otp_hash = %s AND purpose = 'reset'",
        (clean_email, hashed_input)
    )
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    new_hashed_password = bcrypt.hashpw(req.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (new_hashed_password, clean_email))
    cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = 'reset'", (clean_email,))
    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "Password successfully reset. You can now log in."}

@app.get("/auth/me")
async def get_me(request: Request):
    token = request.cookies.get("bis_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        # RETURN DOB TO FRONTEND
        return {"email": payload.get("sub"), "name": payload.get("name"), "dob": payload.get("dob")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")

@app.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("bis_session", httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)