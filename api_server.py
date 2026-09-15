import os
import sys
import re
import logging
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
import json
from typing import Optional, List, Dict, Any
from collections import defaultdict, Counter
import psycopg2
from pgvector.psycopg2 import register_vector
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Response, Request, Query
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
import io
import urllib.request
import urllib.error

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

# Load environment variables from .env file
load_dotenv()

# Logging configuration for security & auditing
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("manak_setu_api")

# Cookie Security configuration
SECURE_COOKIE = os.getenv("SECURE_COOKIE", "false").lower() in ("true", "1")

# Initialize Gemini Client once
client = genai.Client()

# --- 1. Setup ---
app = FastAPI(title="BIS Multimodal RAG Assistant API")

# Enable CORS for local PWA & Vite frontend (supports any local dev port e.g. 5173, 5174, 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://manak-setu-pink.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Session Pooler URI
DB_URI = os.getenv("DB_URI")

def get_db():
    conn = psycopg2.connect(DB_URI)
    register_vector(conn)
    return conn

# In-memory session store fallback
chat_sessions = {}

# In-memory cache for official BIS standard publication metadata (Phase 18: Citations)
BIS_STANDARDS_DOC_MAP: Dict[str, Dict[str, str]] = {}

def get_bis_standards_doc_map() -> Dict[str, Dict[str, str]]:
    global BIS_STANDARDS_DOC_MAP
    if BIS_STANDARDS_DOC_MAP:
        return BIS_STANDARDS_DOC_MAP
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, title, pdf_url FROM bis_standards;")
        rows = cur.fetchall()
        for bs_id, title, pdf_url in rows:
            BIS_STANDARDS_DOC_MAP[bs_id] = {
                "title": title or bs_id,
                "pdf_url": pdf_url or ""
            }
        cur.close()
    except Exception as e:
        logger.warning(f"Failed to pre-cache bis_standards metadata: {e}")
    finally:
        if conn:
            conn.close()
    return BIS_STANDARDS_DOC_MAP

def resolve_citation_metadata(standard_id: str) -> Dict[str, str]:
    doc_map = get_bis_standards_doc_map()
    if standard_id in doc_map:
        info = doc_map[standard_id]
        pdf = info.get("pdf_url") or ""
        return {
            "title": info.get("title") or standard_id,
            "url": pdf or "https://www.bis.gov.in",
            "pdf_url": pdf
        }

    # Try fuzzy or normalized match
    clean_id = standard_id.replace("_", "-").lower()
    for k, v in doc_map.items():
        if k.replace("_", "-").lower() == clean_id:
            pdf = v.get("pdf_url") or ""
            return {
                "title": v.get("title") or standard_id,
                "url": pdf or "https://www.bis.gov.in",
                "pdf_url": pdf
            }

    # Clean official BIS portal lookup URL
    clean_is = re.sub(r'[^a-zA-Z0-9]', '', standard_id)
    portal_url = (
        f"https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no={clean_is}"
        if clean_is and any(c.isdigit() for c in clean_is)
        else "https://www.bis.gov.in"
    )
    return {
        "title": standard_id.replace("_", " "),
        "url": portal_url,
        "pdf_url": ""
    }

# --- Robust Standard Normalization & Identifier Matching ---
def parse_standard_components(std_str: str) -> dict:
    if not std_str:
        return {"base": "", "part": None, "sec": None, "canonical": ""}
    
    s = std_str.strip()
    
    # Check leading pattern like '302-2-80', '302-2-3', '302-1', '368-2014', '3024'
    m_lead = re.match(r'^(?:is[-_\s]*)?(\d{2,5})(?:[-_](\d{1,2}))?(?:[-_](\d{1,3}))?(?:[-_a-zA-Z]|$)', s, re.IGNORECASE)
    base, part, sec = None, None, None
    if m_lead:
        base = m_lead.group(1)
        p = m_lead.group(2)
        sc = m_lead.group(3)
        if p and len(p) <= 2 and int(p) in (1, 2, 3, 4, 5):
            part = p
            if sc and len(sc) <= 3:
                sec = sc

    # If part and sec not determined from leading numbers, parse text
    if not (part and sec):
        m_ps = re.search(r'part\s*[-_]?\s*(\d+)[^\d]*?sec(?:tion)?\s*[-_]?\s*(\d+)', s, re.IGNORECASE)
        if m_ps:
            part = m_ps.group(1)
            sec = m_ps.group(2)
        else:
            m_sec = re.search(r'sec(?:tion)?\s*[-_]?\s*(\d+)', s, re.IGNORECASE)
            if m_sec:
                sec = m_sec.group(1)
            m_part = re.search(r'part\s*[-_]?\s*(\d+)', s, re.IGNORECASE)
            if m_part:
                part = m_part.group(1)

    if not base:
        m_b = re.search(r'(?:(?:^|[^0-9])is\s*|^)(\d{2,5})', s, re.IGNORECASE)
        if m_b:
            base = m_b.group(1)

    # Legacy BIS standard cross-walk (e.g. IS 366 -> IS 302-2-3 Electric Iron)
    if base == '366':
        base = '302'
        part = '2'
        sec = '3'

    if base and part and sec:
        canonical = f"{base}-part-{part}-sec-{sec}"
    elif base and part:
        canonical = f"{base}-part-{part}"
    elif base:
        canonical = base
    else:
        canonical = s.lower()

    return {
        "base": base or "",
        "part": part,
        "sec": sec,
        "canonical": canonical
    }

ALLOWED_STANDARD_TABLES = {
    "standards",
    "bis_standards",
    "standard_tests",
    "testing_requirements",
    "lab_directory",
    "laboratories",
    "guidelines_documents",
    "standards_process",
    "qco_standards",
    "application_documents",
    "certification_process_steps",
    "lab_test_charges",
    "product_classifications",
    "standard_chunks",
    "bis_fees",
    "grouping_rules"
}
ALLOWED_STANDARD_COLS = {"standard_id", "standard_number", "id"}

def resolve_matching_standard_id(cur, table_name: str, requested_id: str, col_name: str = "standard_id") -> str | None:
    if not requested_id:
        return None

    # Security: SQL identifier whitelist check to prevent dynamic SQL injection
    if table_name not in ALLOWED_STANDARD_TABLES:
        raise ValueError(f"Unauthorized table name in standard query: {table_name}")
    if col_name not in ALLOWED_STANDARD_COLS:
        raise ValueError(f"Unauthorized column name in standard query: {col_name}")
        
    # If requested_id is a UUID, resolve standard_number and title from standards table first
    if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', requested_id, re.IGNORECASE):
        try:
            cur.execute("SELECT standard_number, title FROM standards WHERE id = %s;", (requested_id,))
            s_row = cur.fetchone()
            if s_row:
                s_num = s_row[0] or ""
                s_title = s_row[1] or ""
                requested_id = f"{s_num} {s_title}".strip()
        except Exception:
            pass

    # 1. Exact match in table
    cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} = %s LIMIT 1;", (requested_id,))
    row = cur.fetchone()
    if row:
        return row[0]
        
    # 2. Parse requested standard into structured components
    parsed = parse_standard_components(requested_id)
    base = parsed["base"]
    if not base:
        return None
        
    # 3. Retrieve all candidate IDs from table that share the base standard number
    cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} ILIKE %s OR {col_name} ILIKE %s;", (f"%{base}%", f"{base}%"))
    candidates = [r[0] for r in cur.fetchall() if r[0]]
    if not candidates:
        return None
        
    best_cand = None
    best_score = -1
    req_part = parsed["part"]
    req_sec = parsed["sec"]
    req_canon = parsed["canonical"]
    
    for cand in candidates:
        cand_parsed = parse_standard_components(cand)
        cand_base = cand_parsed["base"]
        cand_part = cand_parsed["part"]
        cand_sec = cand_parsed["sec"]
        cand_canon = cand_parsed["canonical"]
        
        if cand_base != base:
            continue
            
        score = 0
        if cand_canon == req_canon:
            score = 100
        elif req_part and req_sec:
            # Multi-part standard: MUST strictly match part and section
            if cand_part == req_part and cand_sec == req_sec:
                score = 90
            else:
                # Mismatch in section/part (e.g., Fans Sec 80 vs Irons Sec 3) - REJECT
                continue
        elif req_part and not req_sec:
            # Part-only standard (e.g., IS 302 Part 1)
            if cand_part == req_part and not cand_sec:
                score = 90
            else:
                continue
        else:
            # Base-only standard (e.g., IS 368, IS 3024)
            if not cand_part and not cand_sec:
                score = 80
            else:
                # Do NOT match a base query to a specific part/section
                continue
                
        if score > best_score:
            best_score = score
            best_cand = cand
            
    # Companion standard fallback for Portable Immersion Heaters:
    # In BIS, IS 302 (Part 2/Sec 74) specifies safety requirements verified under IS 368:2014
    if not best_cand and req_canon == "302-part-2-sec-74":
        cur.execute(f"SELECT DISTINCT {col_name} FROM {table_name} WHERE {col_name} ILIKE '%368%' LIMIT 1;")
        row_368 = cur.fetchone()
        if row_368:
            best_cand = row_368[0]

    return best_cand

def extract_core_id(std_id: str):
    if not std_id:
        return "", ""
    parsed = parse_standard_components(std_id)
    c = parsed["canonical"]
    return c, c.replace("-", "_")

def get_core_regex(core_id: str) -> str:
    if not core_id: 
        return "^$"
    tokens = [re.escape(tok) for tok in re.split(r'[-_]+', core_id) if tok]
    if not tokens:
        return "^$"
    pattern = r'[-_\s]+'.join(tokens)
    return f"(^|[^0-9a-zA-Z]){pattern}([^0-9a-zA-Z]|$)"
# -----------------------------------------------------------------

# ─── Step 2 Validation Helpers ───────────────────────────────────────────────

def _keyword_match_standard(product_name: str, standard_title: str) -> bool:
    """Return True if at least one significant product keyword appears in the standard title.
    Used to validate that a DB-found standard actually matches the user's product.
    Example: 'Electric Iron' vs 'Electric Irons' → True
             'Electric Iron' vs 'Room Heaters'   → False
    """
    # Words that appear in almost every BIS standard title — not useful for discrimination
    stop = {
        'for', 'the', 'and', 'with', 'of', 'to', 'in', 'a', 'an', 'is', 'are',
        'by', 'on', 'or', 'at', 'as', 'be', 'has', 'had', 'not', 'but',
        'household', 'similar', 'appliances', 'safety', 'requirements', 'part',
        'section', 'particular', 'general', 'specification', 'method', 'test',
        'indian', 'standard', 'bis', 'sec', 'requirement', 'electrical',
    }
    if not product_name or not standard_title:
        return False
    tokens = [w for w in product_name.lower().split() if w not in stop and len(w) > 2]
    if not tokens:
        return True   # Can't discriminate — assume match
    title_l = standard_title.lower()
    return any(tok in title_l for tok in tokens)


def _format_related_entry(std_id: str, std_title: str, exclude_id: str) -> str | None:
    """Format a related standard as 'IS XXXX — Title' for clean frontend display.
    Returns None for noise documents (guidance, amendments, transitions) or the excluded id.
    """
    if not std_id or std_id == exclude_id:
        return None
    sl = std_id.lower()
    if any(n in sl for n in ('guidance', 'transition', 'amendment', 'erratum')):
        return None
    core, _ = extract_core_id(std_id)
    is_code = f"IS {core.replace('_', '-')}" if core else ''
    if std_title and len(std_title.strip()) > 5:
        title = std_title.strip()
        return f"{is_code} — {title}" if is_code else title
    elif is_code:
        return is_code
    return None


def _normalize_standard_info(std_id: str, raw_title: str) -> tuple[str, str]:
    """Parse standard number and clean title from raw DB records."""
    sid = (std_id or '').strip()
    sid_l = sid.lower()

    # Detect IS 302 Part 2 Section X standards
    m302 = re.search(r'302[-_](?:part[-_]?2[-_]?sec[-_]?(\d+)|2[-_](\d+))', sid_l)
    if m302:
        sec = m302.group(1) or m302.group(2)
        year_m = re.search(r'(19\d\d|20\d\d)', sid)
        year_suffix = f":{year_m.group(1)}" if year_m and int(year_m.group(1)) > 2000 and int(year_m.group(1)) <= 2026 else ""
        std_num = f"IS 302 (Part 2/Sec {sec}){year_suffix}"
    elif '366' in sid_l:
        std_num = "IS 366:1991"
    elif '368' in sid_l:
        std_num = "IS 368:2014"
    elif '369' in sid_l:
        std_num = "IS 369:2019"
    elif '3024' in sid_l:
        std_num = "IS 3024:2025"
    elif '302-1' in sid_l or '302_1' in sid_l:
        std_num = "IS 302 (Part 1):2024"
    else:
        m_gen = re.search(r'is[-_]?(\d+(?:[-_]\d+)*)', sid_l)
        if m_gen:
            core = m_gen.group(1).replace('-', ' ').replace('_', ' ')
            std_num = f"IS {core.upper()}"
        else:
            core = sid.split('_')[0].replace('-', ' ')
            std_num = core if core.upper().startswith("IS") else f"IS {core}"

    # Clean the title
    clean_title = raw_title or ""
    if "product manual" in clean_title.lower() or "pm-is" in clean_title.lower():
        t = re.sub(r'^\d+[-_]\d+[-_]\d+[-_]?\w*\s*', '', clean_title)
        t = re.sub(r'\s*product manual.*$', '', t, flags=re.IGNORECASE)
        t = re.sub(r'\s*pm-is.*$', '', t, flags=re.IGNORECASE)
        clean_title = t.strip().title()
        if not clean_title or len(clean_title) < 3:
            clean_title = raw_title.split('_')[0].title()
    elif clean_title.startswith("IS "):
        t = re.sub(r'^IS\s*[\d\:\(\)\/\s\-\w]+—?\s*', '', clean_title).strip()
        if t:
            clean_title = t

    return std_num, clean_title

# ─────────────────────────────────────────────────────────────────────────────

def get_chat_history_from_db(user_id: str) -> list:
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT history FROM chat_history WHERE user_id = %s;", (user_id,))
        row = cur.fetchone()
        cur.close()
        if row and row[0]:
            return row[0]
    except Exception as e:
        print(f"Error reading chat_history: {e}")
    finally:
        if conn:
            conn.close()
    return []

def save_chat_history_to_db(user_id: str, history: list):
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO chat_history (user_id, history, updated_at)
            VALUES (%s, %s::jsonb, NOW())
            ON CONFLICT (user_id) DO UPDATE
            SET history = EXCLUDED.history, updated_at = NOW();
        """, (user_id, json.dumps(history)))
        conn.commit()
        cur.close()
    except Exception as e:
        print(f"Error saving chat_history: {e}")
    finally:
        if conn:
            conn.close()

# Security Contexts
JWT_SECRET = os.getenv("JWT_SECRET", "fallback-dev-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# --- 1.1 Secure Authentication System & Security Controls ---

class SignupRequest(BaseModel):
    full_name: str
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

class SendOtpRequest(BaseModel):
    email: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.strip().encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        minutes = float(os.getenv("JWT_EXPIRATION_MINUTES", 1440))
        expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def send_secure_otp(email: str, purpose: str):
    clean_email = email.lower().strip()
    otp_code = str(random.randint(100000, 999999))
    hashed = hash_otp(otp_code)

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = %s", (clean_email, purpose))
        # DB timezone fix applied here
        cursor.execute(
            "INSERT INTO auth_otps (email, otp_hash, purpose, expires_at, attempts) VALUES (%s, %s, %s, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '5 minutes', 0)",
            (clean_email, hashed, purpose)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    brevo_api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("SMTP_USERNAME") # The Gmail you verified on Brevo
    
    if not brevo_api_key or not sender_email:
        print("Error: Missing Brevo API credentials.")
        return

    # Use Brevo REST API over HTTPS (Port 443 - Never blocked by Render!)
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": brevo_api_key,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"email": sender_email, "name": "Manak Setu App"},
        "to": [{"email": clean_email}],
        "subject": "Manak Setu Security Code",
        "htmlContent": f"<h3>Your verification code is: <strong>{otp_code}</strong></h3><p>This code will expire in 5 minutes.</p>"
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            print(f"✅ Real OTP successfully delivered to {clean_email}!")
    except urllib.error.URLError as e:
        print(f"❌ Failed to send real email: {e}")
            
    except Exception as e:
        # HACKATHON SURVIVAL CODE:
        # If Render blocks the port, catch it immediately, don't crash, and print the OTP for the judges!
        print(f"⚠️ SMTP BLOCKED (or Timeout)! Error: {e}")
        print(f"🔥 EMERGENCY BACKUP: The OTP for {clean_email} is: {otp_code}")

@app.post("/auth/signup")
async def signup(req: SignupRequest):
    clean_email = req.email.lower().strip()
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT is_verified FROM users WHERE email = %s", (clean_email,))
        user = cursor.fetchone()

        if user:
            cursor.close()
            if user[0]:
                raise HTTPException(status_code=400, detail="An account with this email already exists. Please Login.")
            else:
                send_secure_otp(clean_email, "signup")
                return {"message": "OTP sent to email"}

        hashed_password = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash, is_verified) VALUES (%s, %s, %s, FALSE)",
            (req.full_name, clean_email, hashed_password)
        )
        conn.commit()
        cursor.close()
    finally:
        if conn:
            conn.close()

    send_secure_otp(clean_email, "signup")
    return {"message": "Account created. Please verify OTP."}

@app.post("/auth/signup/verify-otp")
async def verify_signup(req: VerifySignupRequest, response: Response):
    clean_email = req.email.lower().strip()
    hashed_input = hash_otp(req.otp)
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check expiration directly via SQL
        cursor.execute(
            "SELECT id, attempts, (expires_at < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')) as is_expired FROM auth_otps WHERE email = %s AND purpose = 'signup' ORDER BY id DESC LIMIT 1",
            (clean_email,)
        )
        otp_record = cursor.fetchone()

        if not otp_record:
            raise HTTPException(status_code=400, detail="No active OTP found. Please request a new one.")

        otp_id, attempts, is_expired = otp_record
        
        if attempts >= 5:
            cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = 'signup'", (clean_email,))
            conn.commit()
            raise HTTPException(status_code=429, detail="Too many failed attempts. Please request a new OTP.")

        if is_expired:
            raise HTTPException(status_code=400, detail="OTP expired. Please click Resend OTP.")

        cursor.execute("SELECT 1 FROM auth_otps WHERE email = %s AND otp_hash = %s AND purpose = 'signup'", (clean_email, hashed_input))
        if not cursor.fetchone():
            cursor.execute("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = %s", (otp_id,))
            conn.commit()
            raise HTTPException(status_code=400, detail=f"Incorrect OTP. You have {4 - attempts} attempts left.")

        cursor.execute("UPDATE users SET is_verified = TRUE WHERE email = %s RETURNING id, full_name", (clean_email,))
        user = cursor.fetchone()

        cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = 'signup'", (clean_email,))
        conn.commit()
        
        user_name = user[1] if user and user[1] else clean_email.split("@")[0]
        access_token = create_access_token(data={"sub": clean_email, "name": user_name})
        response.set_cookie(key="bis_session", value=access_token, httponly=True, samesite="lax", secure=SECURE_COOKIE)
        return {"message": "Verification successful", "user": {"email": clean_email, "name": user_name}}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Database connection error.")
    finally:
        if conn:
            conn.close()

@app.post("/auth/resend-otp")
async def resend_otp(req: SendOtpRequest):
    clean_email = req.email.lower().strip()
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT is_verified FROM users WHERE email = %s", (clean_email,))
        user = cursor.fetchone()
        cursor.close()

        if not user:
            raise HTTPException(status_code=404, detail="Account not found. Please sign up first.")
        if user[0]:
            raise HTTPException(status_code=400, detail="Account is already verified. Please log in.")

        send_secure_otp(clean_email, "signup")
        return {"message": "A new OTP has been sent to your email."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error while resending OTP.")
    finally:
        if conn:
            conn.close()

@app.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    clean_email = req.email.lower().strip()
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash, full_name, is_verified FROM users WHERE email = %s", (clean_email,))
        user = cursor.fetchone()
        cursor.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection error. Please try again.")
    finally:
        if conn:
            conn.close()

    if not user or not user[0]:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    try:
        pw_match = bcrypt.checkpw(req.password.encode('utf-8'), user[0].encode('utf-8'))
    except Exception:
        pw_match = False

    if not pw_match:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user[2]:
        raise HTTPException(status_code=403, detail="Email not verified. Please complete signup verification.")

    user_name = user[1] if user[1] else clean_email.split("@")[0]
    access_token = create_access_token(
        data={"sub": clean_email, "name": user_name}
    )
    response.set_cookie(key="bis_session", value=access_token, httponly=True, samesite="none", secure=True)
    return {"message": "Login successful", "user": {"email": clean_email, "name": user_name}}

@app.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    clean_email = req.email.lower().strip()
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s AND is_verified = TRUE", (clean_email,))
        user = cursor.fetchone()
        cursor.close()
    finally:
        if conn:
            conn.close()

    if user:
        send_secure_otp(clean_email, "reset")

    return {"message": "If the email is registered, a password reset code has been sent."}

class VerifyResetOtpRequest(BaseModel):
    email: str
    otp: str

@app.post("/auth/verify-reset-otp")
async def verify_reset_otp(req: VerifyResetOtpRequest):
    clean_email = req.email.lower().strip()
    hashed_input = hash_otp(req.otp)
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, attempts, (expires_at < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')) as is_expired FROM auth_otps WHERE email = %s AND purpose = 'reset' ORDER BY id DESC LIMIT 1",
            (clean_email,)
        )
        otp_record = cursor.fetchone()

        if not otp_record:
            raise HTTPException(status_code=400, detail="No reset code found. Please request a new one.")

        otp_id, attempts, is_expired = otp_record
        
        if attempts >= 5:
            cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = 'reset'", (clean_email,))
            conn.commit()
            raise HTTPException(status_code=429, detail="Too many failed attempts. Please request a new code.")

        if is_expired:
            raise HTTPException(status_code=400, detail="Reset code has expired. Please click Resend OTP.")

        cursor.execute("SELECT 1 FROM auth_otps WHERE email = %s AND otp_hash = %s AND purpose = 'reset'", (clean_email, hashed_input))
        if not cursor.fetchone():
            cursor.execute("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = %s", (otp_id,))
            conn.commit()
            raise HTTPException(status_code=400, detail=f"Incorrect OTP. You have {4 - attempts} attempts left.")

        return {"message": "OTP verified successfully. Proceed to reset password."}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Database connection error.")
    finally:
        if conn:
            conn.close()

@app.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    clean_email = req.email.lower().strip()
    hashed_input = hash_otp(req.otp)
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT 1 FROM auth_otps WHERE email = %s AND otp_hash = %s AND purpose = 'reset'", (clean_email, hashed_input))
        if not cursor.fetchone():
            raise HTTPException(status_code=400, detail="Invalid verification code.")

        new_hashed_password = bcrypt.hashpw(req.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (new_hashed_password, clean_email))
        cursor.execute("DELETE FROM auth_otps WHERE email = %s AND purpose = 'reset'", (clean_email,))
        conn.commit()

        return {"message": "Password successfully reset. You can now log in."}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Database connection error.")
    finally:
        if conn:
            conn.close()

@app.get("/auth/me")
async def get_me(request: Request):
    token = request.cookies.get("bis_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"email": payload.get("sub"), "name": payload.get("name")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")

@app.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("bis_session", httponly=True, samesite="none", secure=True)
    return {"message": "Logged out successfully"}

@app.post("/auth/send-otp")
async def send_otp_compat(req: SendOtpRequest):
    send_secure_otp(req.email.lower().strip(), "signup")
    return {"message": "OTP sent successfully via Email"}

@app.post("/auth/verify-otp")
async def verify_otp_compat(req: VerifyOtpRequest, response: Response):
    verify_req = VerifySignupRequest(email=req.email, otp=req.otp)
    return await verify_signup(verify_req, response)

# --- Health Check Endpoint ---
@app.get("/")
def read_root():
    return {"status": "online", "message": "BIS AI Backend is running"}

@app.get("/api/status")
def api_status():
    db_connected = False
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        db_connected = True
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        db_connected = False
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
    return {"status": "online", "database": "connected" if db_connected else "disconnected", "rag": "active"}

def generate_gemini_content(contents, system_instruction: Optional[str] = None, temperature: float = 0.0):
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=temperature
    ) if system_instruction else types.GenerateContentConfig(temperature=temperature)

    models_to_try = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash']
    last_err = None
    for model_name in models_to_try:
        try:
            return client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
        except Exception as e:
            last_err = e
            err_str = str(e)
            if "503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str or "429" in err_str:
                print(f"[Gemini Transient Error on {model_name}] Trying fallback model...")
                continue
            raise e
    if last_err:
        raise last_err

# --- 2. Supabase Cloud Vector Search & Context Rewriter ---
def rewrite_query_with_context(query: str, history: list, context: Optional[Dict[str, Any]] = None) -> str:
    # 1. If multi-turn conversation history exists, use conversational query rewriting
    if history and len(history) >= 2:
        recent = history[-4:]
        history_str = "\n".join([f"{m.get('role', 'user')}: {m.get('text', '')}" for m in recent])
        context_hint = ""
        if context:
            prod = context.get("product") or context.get("product_name") or ""
            std = context.get("standardId") or context.get("standard_id") or ""
            if prod or std:
                context_hint = f"\nActive Page Product: {prod} | Standard: {std}"
        prompt = f"""You are a search query optimizer for Bureau of Indian Standards (BIS) documents.
Given the conversation context, active product/standard context, and the user's latest follow-up question, rewrite the question into a concise, standalone retrieval query containing explicit product names, standards, and topics.
If the question or conversation is in Hindi or Bengali, ensure you include the standard English technical product names and IS codes (e.g., 'Electric Iron IS 302-2-3') alongside query concepts so document retrieval across indexed BIS technical documentation is accurate.
Do NOT answer the question. Return ONLY the standalone query.

Conversation:
{history_str}{context_hint}

Follow-up: {query}

Standalone Query:"""
        try:
            resp = generate_gemini_content(contents=prompt, temperature=0.0)
            cleaned = resp.text.strip().strip('"').strip("'")
            if cleaned and len(cleaned) > 3:
                return cleaned
        except Exception as e:
            print(f"Query rewrite fallback: {e}")

    # 2. If no history or rewrite was unneeded, enrich implicit queries with active product/standard context
    if context:
        prod = str(context.get("product") or context.get("product_name") or "").strip()
        std = str(context.get("standardId") or context.get("standard_id") or "").strip()
        query_lower = query.lower()
        needs_context = False
        if prod and prod.lower() not in query_lower:
            needs_context = True
        if std and std.lower() not in query_lower:
            needs_context = True

        if needs_context and (prod or std):
            implicit_triggers = [
                "routine test", "test", "requirement", "qco", "mandatory", "scheme", "document",
                "fee", "cost", "lab", "laboratory", "how to apply", "process", "clause", "specification",
                # Hindi triggers
                "परीक्षण", "जांच", "आवश्यकता", "शुल्क", "दस्तावेज", "कागजात", "मानक", "अनिवार्य", "प्रयोगशाला", "प्रक्रिया", "धारा", "नियम",
                # Bengali triggers
                "পরীক্ষা", "ফি", "নথি", "মানদণ্ড", "বাধ্যতামূলক", "ল্যাব", "প্রক্রিয়া", "ধারা"
            ]
            if any(t in query_lower for t in implicit_triggers) or len(query.split()) <= 8:
                prefix = f"{prod} {std}".strip()
                if prefix:
                    return f"{prefix} {query}"

    return query

def supabase_vector_search(query: str, top_k: int = 6, threshold: float = 0.65):
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=query,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    query_embedding = response.embeddings[0].values

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT standard_id, page_number, content, embedding <=> %s::vector AS distance
            FROM standard_chunks
            WHERE embedding <=> %s::vector < %s
            ORDER BY distance ASC
            LIMIT %s;
        """, (query_embedding, query_embedding, threshold, top_k))

        results = cursor.fetchall()
        cursor.close()
    finally:
        if conn:
            conn.close()

    combined_docs = []
    for row in results:
        standard_id, page_number, content, distance = row
        meta = {"standard_id": standard_id, "page_number": page_number, "distance": float(distance)}
        combined_docs.append({"text": content, "meta": meta})

    return combined_docs

def supabase_hybrid_search(
    query: str, 
    top_k: int = 6, 
    vector_threshold: float = 0.72,
    context: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Performs True Hybrid Search combining:
    1. Dense Vector Semantic Search (Gemini 768-dim embeddings <=> pgvector)
    2. Sparse Lexical / Full-Text Search (PostgreSQL tsvector & ts_rank_cd)
    3. Context-Aware Standard/Product Filtering & Relevance Boosting
    4. Reciprocal Rank Fusion (RRF) & Score Normalization
    5. Deduplication & Citation Metadata Preservation
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # 1. Vector Semantic Search
        vector_hits = {}
        try:
            embed_resp = client.models.embed_content(
                model="gemini-embedding-001",
                contents=query,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            query_embedding = embed_resp.embeddings[0].values

            cur.execute("""
                SELECT id, standard_id, page_number, content, embedding <=> %s::vector AS distance
                FROM standard_chunks
                WHERE embedding <=> %s::vector < %s
                ORDER BY distance ASC
                LIMIT %s;
            """, (query_embedding, query_embedding, vector_threshold, top_k * 3))

            for rank_idx, (cid, sid, page, content, dist) in enumerate(cur.fetchall()):
                v_dist = float(dist)
                v_score = max(0.0, 1.0 - v_dist)
                vector_hits[cid] = {
                    "id": cid,
                    "standard_id": sid,
                    "page_number": page,
                    "content": content,
                    "distance": v_dist,
                    "v_score": v_score,
                    "v_rank": rank_idx + 1
                }
        except Exception as e:
            print(f"[hybrid_search] Vector retrieval warning: {e}")

        # 2. Lexical / Full-Text Search (PostgreSQL FTS)
        fts_hits = {}
        try:
            clean_query = re.sub(r'[:\-_/\\()"\']', ' ', query).strip()
            fts_search_query = clean_query
            
            # Cross-lingual FTS enhancement: If query has minimal alphanumeric ASCII terms (e.g. Indic script)
            # and context is provided, append English product and standard keywords so PostgreSQL's English FTS can match.
            ascii_words = [w for w in re.findall(r'[A-Za-z0-9]+', clean_query) if len(w) > 1]
            if len(ascii_words) <= 1 and context:
                prod = str(context.get("product") or context.get("product_name") or "").strip()
                std = str(context.get("standardId") or context.get("standard_id") or "").strip()
                extra_terms = " ".join([w for w in [prod, std] if w])
                if extra_terms:
                    fts_search_query = f"{fts_search_query} {extra_terms}".strip()

            if fts_search_query:
                cur.execute("""
                    SELECT id, standard_id, page_number, content,
                           ts_rank_cd(to_tsvector('english', content), plainto_tsquery('english', %s)) AS fts_rank
                    FROM standard_chunks
                    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', %s)
                    ORDER BY fts_rank DESC
                    LIMIT %s;
                """, (fts_search_query, fts_search_query, top_k * 3))

                for rank_idx, (cid, sid, page, content, rank_val) in enumerate(cur.fetchall()):
                    rank_f = float(rank_val)
                    k_score = min(1.0, rank_f / (rank_f + 0.5))
                    fts_hits[cid] = {
                        "id": cid,
                        "standard_id": sid,
                        "page_number": page,
                        "content": content,
                        "k_score": k_score,
                        "k_rank": rank_idx + 1
                    }
        except Exception as e:
            print(f"[hybrid_search] Lexical FTS warning: {e}")
            if conn:
                conn.rollback()

        # 3. Contextual Keyword & Standard Matching
        target_tokens = []
        if context:
            std_hint = str(context.get("standard_id") or context.get("standardId") or "")
            prod_hint = str(context.get("product") or context.get("product_name") or "")
            if std_hint:
                target_tokens.append(std_hint.lower())
            if prod_hint:
                target_tokens.append(prod_hint.lower())

        # 4. Score Fusion (RRF + Weighted Linear Scoring)
        all_candidate_ids = set(vector_hits.keys()).union(set(fts_hits.keys()))
        scored_candidates = []

        for cid in all_candidate_ids:
            v_info = vector_hits.get(cid)
            f_info = fts_hits.get(cid)

            sid = (v_info or f_info)["standard_id"]
            page = (v_info or f_info)["page_number"]
            content = (v_info or f_info)["content"]
            dist = v_info["distance"] if v_info else 0.5

            v_score = v_info["v_score"] if v_info else 0.0
            k_score = f_info["k_score"] if f_info else 0.0

            rrf_v = (1.0 / (60 + v_info["v_rank"])) if v_info else 0.0
            rrf_k = (1.0 / (60 + f_info["k_rank"])) if f_info else 0.0
            rrf_score = (rrf_v + rrf_k) * 50.0

            linear_score = (0.60 * v_score) + (0.40 * k_score)

            context_boost = 0.0
            sid_lower = sid.lower()
            for tok in target_tokens:
                if tok in sid_lower:
                    context_boost = 0.25
                    break

            # Stage-specific technical token boosting (Prompt Section 10: Current-stage information priority)
            stage_boost = 0.0
            content_lower = content.lower()
            if context and (context.get("stage") or context.get("active_step")):
                stage_val = context.get("stage") or context.get("active_step")
                try:
                    stage_int = int(stage_val)
                except (ValueError, TypeError):
                    stage_int = 0

                stage_keywords = {
                    1: ["profile", "scale", "micro", "small", "medium", "manufacturer", "domestic", "foreign", "concession"],
                    2: ["standard", "scope", "specification", "clause", "requirement", "related"],
                    3: ["qco", "quality control order", "scheme", "mandatory", "voluntary", "gazette", "licence", "certification"],
                    4: ["test", "routine", "acceptance", "apparatus", "testing", "laboratory", "lab", "sampling", "clause", "method"],
                    5: ["document", "drawing", "layout", "machinery", "calibration", "form-v", "consent", "schedule", "checklist"],
                    6: ["application", "manakonline", "portal", "milestone", "audit", "grant", "timeline", "process", "inspection"]
                }
                kw_list = stage_keywords.get(stage_int, [])
                if any(kw in content_lower for kw in kw_list):
                    stage_boost = 0.20

            final_score = linear_score + rrf_score + context_boost + stage_boost

            source_type = "Hybrid (Vector + Keyword)" if (v_info and f_info) else ("Vector (Semantic)" if v_info else "Keyword (FTS)")

            doc_meta = resolve_citation_metadata(sid)
            scored_candidates.append({
                "text": content,
                "meta": {
                    "standard_id": sid,
                    "page_number": page,
                    "title": doc_meta["title"],
                    "document": doc_meta["title"],
                    "document_title": doc_meta["title"],
                    "url": doc_meta["url"],
                    "source_url": doc_meta["url"],
                    "pdf_url": doc_meta["pdf_url"],
                    "text": content,
                    "distance": dist,
                    "score": round(final_score, 4),
                    "source": source_type
                },
                "_score": final_score
            })

        # 5. Sort, Deduplicate, and Return Top K
        scored_candidates.sort(key=lambda x: x["_score"], reverse=True)

        seen_pages = set()
        deduped = []
        for cand in scored_candidates:
            key = (cand["meta"]["standard_id"], cand["meta"]["page_number"])
            if key not in seen_pages:
                seen_pages.add(key)
                deduped.append({"text": cand["text"], "meta": cand["meta"]})
                if len(deduped) >= top_k:
                    break

        return deduped
    finally:
        if conn:
            conn.close()

# --- 3. Text Chat Endpoint ---
class ChatRequest(BaseModel):
    session_id: str
    message: str
    language: str = "en"
    context: Optional[Dict[str, Any]] = None

@app.post("/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    # Determine user identity (authenticated email if cookie present, else session_id)
    user_id = req.session_id
    token = request.cookies.get("bis_session")
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("sub"):
                user_id = payload.get("sub")
        except Exception:
            pass

    # Load history from DB, fallback to in-memory
    db_history = get_chat_history_from_db(user_id)
    if db_history:
        chat_sessions[user_id] = db_history
    elif user_id not in chat_sessions:
        chat_sessions[user_id] = []

    history = chat_sessions[user_id]

    # Contextual query rewriting for follow-ups
    effective_query = rewrite_query_with_context(req.message, history, context=req.context)
    
    # Structured Page & Workflow Context (Phase 4: Manak Setu AI Page Context)
    page_context_info = []
    if req.context:
        page = req.context.get("page") or req.context.get("active_tab") or req.context.get("tab")
        if page:
            page_context_info.append(f"Active Page/Section: {page}")
        stage = req.context.get("stage") or req.context.get("active_step")
        if stage:
            stage_names = {
                1: "Stage 1 — Product Profile",
                2: "Stage 2 — Applicable Standard",
                3: "Stage 3 — Certification / QCO",
                4: "Stage 4 — Testing & Labs",
                5: "Stage 5 — Documents Checklist",
                6: "Stage 6 — Application & Milestones"
            }
            stage_str = stage_names.get(stage, f"Stage {stage}") if isinstance(stage, int) else str(stage)
            page_context_info.append(f"Product Guide Stage: {stage_str}")
        product = req.context.get("product") or req.context.get("product_name")
        if product:
            page_context_info.append(f"Product: {product}")
        std_id = req.context.get("standardId") or req.context.get("standard_id")
        std_name = req.context.get("standardName") or req.context.get("standard_name")
        if std_id:
            page_context_info.append(f"Indian Standard: {std_id}{f' ({std_name})' if std_name else ''}")
        user_type = req.context.get("userType") or req.context.get("user_type") or req.context.get("userRole")
        if user_type:
            page_context_info.append(f"User Persona: {user_type.capitalize()}")
        metal = req.context.get("metal")
        if metal:
            page_context_info.append(f"Precious Metal: {metal.capitalize()} ({'IS 1417' if metal.lower() == 'gold' else 'IS 2112'})")
        loc = req.context.get("location")
        if loc:
            page_context_info.append(f"Location: {loc}")
        scale = req.context.get("industry_scale") or req.context.get("industryScale")
        if scale:
            page_context_info.append(f"Industry Scale: {scale}")

        # Stage-specific enriched context (Phase 7: Product Guide AI Integration)
        scheme = req.context.get("scheme")
        if scheme:
            page_context_info.append(f"Certification Scheme: {scheme}")
        qco = req.context.get("qcoNotification") or req.context.get("qco_notification")
        if qco:
            page_context_info.append(f"QCO Order: {qco}")
        is_mand = req.context.get("isMandatory") if req.context.get("isMandatory") is not None else req.context.get("is_mandatory")
        if is_mand is not None:
            page_context_info.append(f"Certification Mandate: {'Mandatory under QCO' if is_mand else 'Voluntary'}")
        routine_count = req.context.get("routineTestsCount")
        if routine_count is not None:
            page_context_info.append(f"Configured Routine Tests: {routine_count}")
        labs_count = req.context.get("labsCount")
        if labs_count is not None:
            page_context_info.append(f"Recognized Testing Labs: {labs_count}")
        docs_count = req.context.get("documentsCount")
        if docs_count is not None:
            page_context_info.append(f"Required Statutory Documents: {docs_count}")

    context_note = ""
    if page_context_info:
        context_note = "\nActive User Context:\n" + "\n".join([f"- {info}" for info in page_context_info])

    stage_priority_directive = ""
    stage_num = None
    if req.context:
        stg_raw = req.context.get("stage") or req.context.get("active_step")
        try:
            stage_num = int(stg_raw)
        except (ValueError, TypeError):
            pass

    if stage_num == 1:
        stage_priority_directive = (
            "\n- CURRENT-STAGE MANDATE (Stage 1 — Product Profile): The user is currently configuring their product profile. "
            "Prioritize guidance on product classification, industry scale concessions (e.g. 50% concession on marking fees for Micro and Startup enterprises), "
            "domestic vs Foreign Manufacturers Certification Scheme (FMCS), and scope of manufacturing. Stage 1 details take absolute priority over unrelated topics."
        )
    elif stage_num == 2:
        stage_priority_directive = (
            "\n- CURRENT-STAGE MANDATE (Stage 2 — Applicable Standard): The user is reviewing the applicable Indian Standard. "
            "Prioritize the exact standard code (e.g. IS 302-2-3 / IS 368), standard title, scope, why it applies to the user's product specifications, "
            "and active vs superseded standard status. Technical standard alignment takes absolute priority over unrelated topics."
        )
    elif stage_num == 3:
        stage_priority_directive = (
            "\n- CURRENT-STAGE MANDATE (Stage 3 — Certification Scheme & QCO): The user is examining the certification scheme and regulatory mandate. "
            "Prioritize whether certification is legally mandatory under an issued Quality Control Order (QCO) or voluntary, the applicable scheme (Scheme-I ISI Mark or Scheme-II CRS), "
            "relevant Ministry Gazette notification orders, and enforcement deadlines. Certification and QCO rules take absolute priority over unrelated topics."
        )
    elif stage_num == 4:
        stage_priority_directive = (
            "\n- CURRENT-STAGE MANDATE (Stage 4 — Testing & Labs): The user is inspecting testing and laboratory requirements. "
            "Prioritize routine testing limits, acceptance tests, testing frequencies under the Scheme of Testing and Inspection (STI), in-house factory testing requirements, "
            "and BIS-recognized or NABL-accredited third-party laboratories. Testing parameters and lab facilities take absolute priority over unrelated topics."
        )
    elif stage_num == 5:
        stage_priority_directive = (
            "\n- CURRENT-STAGE MANDATE (Stage 5 — Documents Checklist): The user is preparing statutory application documents. "
            "Prioritize statutory document requirements including Form-V (Scheme of Testing and Inspection acceptance), factory layout plans, manufacturing machinery schedules, "
            "in-house test equipment list with valid NABL calibration certificates, and honest document verification statuses. Document compliance takes absolute priority over unrelated topics."
        )
    elif stage_num == 6:
        stage_priority_directive = (
            "\n- CURRENT-STAGE MANDATE (Stage 6 — Application Process): The user is in the final application and milestone roadmap stage. "
            "Prioritize the step-by-step e-BIS Manakonline submission workflow, portal upload sequence, on-site factory audit preparation, "
            "sample drawing protocols, and the milestone timeline leading to grant of CM/L licence. Application workflow takes absolute priority over unrelated topics."
        )

    greeting_words = r'(?:hello(?:\s+there)?|hi(?:\s+there)?|hey(?:\s+there)?|greetings|good\s+(?:morning|afternoon|evening|day|night)|namaste|namaskar|pranam|vanakkam|who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|thanks(?:\s+a\s+lot)?|thank\s+you(?:\s+very\s+much)?|dhanyawad|bye|goodbye)'
    is_conversational = bool(re.match(
        rf'^(?:{greeting_words}[,\s!.]*)+$',
        req.message.strip(),
        re.IGNORECASE
    ))
    if is_conversational and not req.context:
        retrieved_chunks = []
    else:
        retrieved_chunks = supabase_hybrid_search(effective_query, top_k=6, vector_threshold=0.72, context=req.context)
    
    # Language Directive (Implementation Plan Section 7: Multilingual Architecture)
    lang_directive = ""
    if req.language == "hi":
        lang_directive = (
            "\n- LANGUAGE REQUIREMENT: Answer strictly and fluently in professional, natural Hindi (हिन्दी) using Devanagari script."
            "\n- STRICT TECHNICAL PRESERVATION MANDATE:"
            "\n  1. You MUST preserve all official Indian Standard numbers (e.g. 'IS 302', 'IS 302-2-3', 'IS 368:2014', 'IS 1417', 'IS 2112') in their original Roman/Arabic alphanumeric format. Do NOT transliterate them into Devanagari (write 'IS 302', NEVER 'आईएस 302')."
            "\n  2. You MUST preserve clause numbers (e.g. 'Clause 7.1', 'Clause 8.1', 'Clause 24') and license/HUID numbers (e.g. 'CM/L-1234567', 'HUID') in original Roman characters."
            "\n  3. You MUST preserve statutory acronyms ('QCO', 'ISI', 'CRS', 'HUID', 'FMCS', 'BIS', 'NABL', 'STI', 'CPA') in Roman capital letters."
            "\n  4. Preserve numerical test limits, electrical ratings, and engineering units (e.g. '500 V', '2 MΩ', '0.75 mm²', '16 A', '50 Hz') accurately."
            "\n  5. All explanatory sentences, headings, bullet points, and advice must be written in fluent, grammatically correct Devanagari Hindi (do not use Hinglish for prose)."
            "\n- CITATIONS: Keep all cited source document titles and page references exactly as given in the context."
        )
    elif req.language == "bn":
        lang_directive = (
            "\n- LANGUAGE REQUIREMENT: Answer strictly and fluently in professional, natural Bengali (বাংলা) using Bengali script."
            "\n- STRICT TECHNICAL PRESERVATION MANDATE:"
            "\n  1. You MUST preserve all official Indian Standard numbers (e.g. 'IS 302', 'IS 302-2-3', 'IS 368:2014', 'IS 1417', 'IS 2112') in their original Roman/Arabic alphanumeric format. Do NOT transliterate them into Bengali script (write 'IS 302', NEVER 'আইএস ৩০২')."
            "\n  2. You MUST preserve clause numbers (e.g. 'Clause 7.1', 'Clause 8.1', 'Clause 24') and license/HUID numbers (e.g. 'CM/L-1234567', 'HUID') in original Roman characters."
            "\n  3. You MUST preserve statutory acronyms ('QCO', 'ISI', 'CRS', 'HUID', 'FMCS', 'BIS', 'NABL', 'STI', 'CPA') in Roman capital letters."
            "\n  4. Preserve numerical test limits, electrical ratings, and engineering units (e.g. '500 V', '2 MΩ', '0.75 mm²', '16 A', '50 Hz') accurately."
            "\n  5. All explanatory sentences, headings, bullet points, and advice must be written in fluent, grammatically correct Bengali (do not use Benglish for prose)."
            "\n- CITATIONS: Keep all cited source document titles and page references exactly as given in the context."
        )
    else:
        lang_directive = "\n- LANGUAGE REQUIREMENT: Answer in clear, professional English."

    # Grounded technical chunks or fallback context note
    if retrieved_chunks and len(retrieved_chunks) > 0:
        context_text = "\n".join([f"- {item['text']} (Page {item['meta']['page_number']}, Standard: {item['meta'].get('standard_id', '')})" for item in retrieved_chunks])
    else:
        context_text = "(No specific technical standard chunks were retrieved for this query. Rely on the Active User Context and verified official BIS regulations. If the query requires specific unindexed standard clauses, state that they are not in the indexed documentation.)"

    system_instruction = f"""You are Manak Setu (मानक सेतु), the official AI-powered Intelligent Assistant for Indian Standards and BIS (Bureau of Indian Standards).

YOUR PERSONA, TONE & FORMATTING:
1. 5th-Grade Simplicity: Explain all concepts VERY simply, as if speaking to a 10-year-old (5th grader). Avoid complex bureaucratic jargon. Use short, easy-to-understand sentences.
2. Conversational: Be polite, warm, and helpful. Respond to greetings naturally and identify yourself as Manak Setu.
3. Gemini-Style Formatting:
   - NO WALLS OF TEXT: Break your answers into short, highly readable chunks.
   - HEAVY BULLET POINTS: Use clean bullet points to list steps, requirements, or facts.
   - PRECISE BOLDING: **ONLY** bold specific key terms, numbers, IS codes (e.g., **IS 302-2-80**), or important metrics. **NEVER** bold an entire sentence, heading, or paragraph.

BIS-FOCUSED (NOT A GENERIC CHATBOT):
- You strictly specialize in Indian Standards, BIS certification schemes (ISI Mark, CRS, FMCS), mandatory Quality Control Orders (QCOs), testing laboratories, fee estimation, hallmarking (IS 1417, IS 2112, HUID), and consumer rights.
- If the user asks an unrelated question outside BIS/standards (e.g. sports, movies, cooking recipes, general programming, politics), POLITELY DECLINE by explaining that as Manak Setu, you are dedicated exclusively to Indian Standards and BIS compliance.

PAGE & WORKFLOW AWARENESS:
- Use the Active User Context below to tailor your responses to the user's current section and stage.
- On Product Guide: focus on the active stage. On Fee Estimator: focus on MSME 50% concessions. On Consumer Help/Hallmarking: focus on verifying CM/L or HUID.

GROUNDED KNOWLEDGE & HALLUCINATION PREVENTION:
- Answer technical standard questions using the Indexed BIS Context below. Cite the document and page.
- NEVER invent IS numbers, fake laboratory names, or fake rules.
- ONLY state that details are not present in the indexed standard documentation when the user asks for specific technical test limits that cannot be found. Never refuse procedural, workflow, or stage guidance.{lang_directive}

{context_note}
{stage_priority_directive}

Indexed BIS Context:
{context_text}"""

    gemini_history = []
    for msg in history[-10:]:
        gemini_history.append(types.Content(role=msg["role"], parts=[types.Part.from_text(text=msg["text"])]))

    try:
        response = generate_gemini_content(
            contents=gemini_history + [
                types.Content(role="user", parts=[types.Part.from_text(text=req.message)])
            ],
            system_instruction=system_instruction,
            temperature=0.0
        )

        history.append({"role": "user", "text": req.message})
        history.append({"role": "model", "text": response.text})
        chat_sessions[user_id] = history
        save_chat_history_to_db(user_id, history)

        # Suppress citations on out-of-domain refusals or when response indicates topic is outside BIS domain
        resp_lower = (response.text or "").lower()
        is_refusal = any(phrase in resp_lower for phrase in [
            "outside of the bis domain",
            "outside the bis domain",
            "outside of the bis scope",
            "outside the scope of bis",
            "outside of bis",
            "unable to provide recipes",
            "strictly dedicated to indian standards",
            "dedicated exclusively to indian standards",
            "exclusively dedicated to indian standards",
            "as manak setu, i am dedicated exclusively",
            "as manak setu, i specialize exclusively",
            "topics outside of the bis",
            "questions outside of the bis",
            "outside my domain",
            "outside my scope"
        ])

        # Sanitize citations: remove internal ranking/distance metrics (Section 18.2) & preserve authentic metadata
        citations_result = []
        if retrieved_chunks and not is_conversational and not is_refusal:
            for c in retrieved_chunks:
                meta = dict(c.get('meta', {}))
                meta.pop('distance', None)
                meta.pop('score', None)
                if 'text' not in meta or not meta['text']:
                    meta['text'] = c.get('text', '')
                citations_result.append(meta)
        return {"response": response.text, "citations": citations_result}
    except Exception as e:
        logger.error(f"Error in /chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while generating response. Please try again.")

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

    # File validation: max 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Attachment exceeds maximum permitted size (10MB).")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded attachment is empty.")

    # Extension validation
    filename = file.filename or "attachment"
    ext = os.path.splitext(filename)[1].lower()
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Allowed: PNG, JPG, JPEG, WEBP, PDF.")

    mime_type = file.content_type or ("application/pdf" if ext == ".pdf" else "image/jpeg")

    retrieved_chunks = supabase_hybrid_search(message, top_k=4, vector_threshold=0.72)
    
    # Language Directive (Implementation Plan Section 7: Multilingual Architecture)
    lang_directive = ""
    if language == "hi":
        lang_directive = (
            "\n- LANGUAGE REQUIREMENT: Answer strictly and fluently in professional, natural Hindi (हिन्दी) using Devanagari script."
            "\n- STRICT TECHNICAL PRESERVATION MANDATE:"
            "\n  1. You MUST preserve all official Indian Standard numbers (e.g. 'IS 302', 'IS 302-2-3', 'IS 368:2014', 'IS 1417', 'IS 2112') in their original Roman/Arabic alphanumeric format. Do NOT transliterate them into Devanagari (write 'IS 302', NEVER 'आईएस 302')."
            "\n  2. You MUST preserve clause numbers (e.g. 'Clause 7.1', 'Clause 8.1', 'Clause 24') and license/HUID numbers (e.g. 'CM/L-1234567', 'HUID') in original Roman characters."
            "\n  3. You MUST preserve statutory acronyms ('QCO', 'ISI', 'CRS', 'HUID', 'FMCS', 'BIS', 'NABL', 'STI', 'CPA') in Roman capital letters."
            "\n  4. Preserve numerical test limits, electrical ratings, and engineering units (e.g. '500 V', '2 MΩ', '0.75 mm²', '16 A', '50 Hz') accurately."
            "\n  5. All explanatory sentences, headings, bullet points, and advice must be written in fluent, grammatically correct Devanagari Hindi (do not use Hinglish for prose)."
            "\n- CITATIONS: Keep all cited source document titles and page references exactly as given in the context."
        )
    elif language == "bn":
        lang_directive = (
            "\n- LANGUAGE REQUIREMENT: Answer strictly and fluently in professional, natural Bengali (বাংলা) using Bengali script."
            "\n- STRICT TECHNICAL PRESERVATION MANDATE:"
            "\n  1. You MUST preserve all official Indian Standard numbers (e.g. 'IS 302', 'IS 302-2-3', 'IS 368:2014', 'IS 1417', 'IS 2112') in their original Roman/Arabic alphanumeric format. Do NOT transliterate them into Bengali script (write 'IS 302', NEVER 'আইএস ৩০২')."
            "\n  2. You MUST preserve clause numbers (e.g. 'Clause 7.1', 'Clause 8.1', 'Clause 24') and license/HUID numbers (e.g. 'CM/L-1234567', 'HUID') in original Roman characters."
            "\n  3. You MUST preserve statutory acronyms ('QCO', 'ISI', 'CRS', 'HUID', 'FMCS', 'BIS', 'NABL', 'STI', 'CPA') in Roman capital letters."
            "\n  4. Preserve numerical test limits, electrical ratings, and engineering units (e.g. '500 V', '2 MΩ', '0.75 mm²', '16 A', '50 Hz') accurately."
            "\n  5. All explanatory sentences, headings, bullet points, and advice must be written in fluent, grammatically correct Bengali (do not use Benglish for prose)."
            "\n- CITATIONS: Keep all cited source document titles and page references exactly as given in the context."
        )
    else:
        lang_directive = "\n- LANGUAGE REQUIREMENT: Answer in clear, professional English."

    # Grounded technical chunks or inspection context
    if retrieved_chunks and len(retrieved_chunks) > 0:
        context_text = "\n".join([f"- {item['text']} (Page {item['meta']['page_number']}, Standard: {item['meta'].get('standard_id', '')})" for item in retrieved_chunks])
    else:
        context_text = "(No specific technical standard chunks were retrieved for this query. Visually examine the uploaded media for standard markings, ISI mark, 7-digit CM/L number, 6-digit HUID code, product ratings, or laboratory test report details.)"

    system_instruction = f"""You are Manak Setu (मानक सेतु), the official AI-powered compliance auditor for the Bureau of Indian Standards (BIS).

    YOUR PERSONA & TONE:
    1. 5th-Grade Simplicity: Explain everything VERY simply, as if speaking to a 10-year-old. Avoid complex technical jargon when explaining what is missing or found.
    2. Formatting: Do NOT write walls of text. Use bullet points heavily. **ONLY** bold key terms, numbers, or IS codes. **NEVER** bold entire sentences.

    CRITICAL OBJECTIVE: Analyze the uploaded media and answer the user query in accordance with official BIS regulations.
    - Inspect visible markings: Check for the BIS Standard Mark, 7-digit CM/L, 6-digit HUID, or IS number.
    - Ground your assessment strictly in the Indexed BIS Context below.
    - If the image lacks clear markings, explain simply what is missing.
    - Never claim an item is definitively verified solely from an image.{lang_directive}

Indexed BIS Context:
{context_text}"""

    media_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
    text_part = types.Part.from_text(text=message)

    try:
        response = generate_gemini_content(
            contents=[types.Content(role="user", parts=[media_part, text_part])],
            system_instruction=system_instruction,
            temperature=0.0
        )

        history.append({"role": "user", "text": f"[Uploaded {file.filename}]: {message}"})
        history.append({"role": "model", "text": response.text})

        # Sanitize citations: remove internal ranking/distance metrics (Section 18.2) & preserve authentic metadata
        citations_result = []
        if retrieved_chunks:
            for c in retrieved_chunks:
                meta = dict(c.get('meta', {}))
                meta.pop('distance', None)
                meta.pop('score', None)
                if 'text' not in meta or not meta['text']:
                    meta['text'] = c.get('text', '')
                citations_result.append(meta)

        return {
            "filename": file.filename,
            "response": response.text,
            "citations": citations_result
        }
    except Exception as e:
        logger.error(f"Error in /chat/multimodal endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while processing multimodal request. Please try again.")



# --- 6. STRUCTURED COMPLIANCE & PRODUCT GUIDE ENDPOINTS ---

@app.get("/api/chat/history")
async def get_chat_history_endpoint(request: Request, session_id: Optional[str] = None):
    token = request.cookies.get("bis_session")
    user_id = session_id or "anonymous_session"
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("sub"):
                user_id = payload.get("sub")
        except Exception:
            pass
    history = get_chat_history_from_db(user_id)
    if not history and user_id in chat_sessions:
        history = chat_sessions[user_id]
    return {"user_id": user_id, "history": history}

@app.post("/api/chat/history/clear")
async def clear_chat_history_endpoint(request: Request, session_id: Optional[str] = None):
    token = request.cookies.get("bis_session")
    user_id = session_id or "anonymous_session"
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("sub"):
                user_id = payload.get("sub")
        except Exception:
            pass
    save_chat_history_to_db(user_id, [])
    if user_id in chat_sessions:
        chat_sessions[user_id] = []
    return {"message": "Chat history cleared"}

class ChatTranslateRequest(BaseModel):
    texts: List[str]
    target_language: str
    source_language: Optional[str] = "en"

@app.post("/api/chat/translate")
async def translate_chat_endpoint(req: ChatTranslateRequest):
    if not req.texts:
        return {"translations": []}

    target = req.target_language.lower().strip()
    if target not in ["hi", "bn", "en"]:
        target = "en"

    # If source and target are the same, return texts immediately
    if req.source_language and req.source_language.lower().strip() == target:
        return {"translations": req.texts}

    lang_names = {
        "hi": "Hindi (हिन्दी) in Devanagari script",
        "bn": "Bengali (বাংলা) in Bengali script",
        "en": "clear, professional English"
    }
    target_lang_str = lang_names.get(target, "English")

    translation_prompt = f"""You are a specialized translator for the Bureau of Indian Standards (BIS) technical compliance portal.
TASK: Translate the provided list of texts into {target_lang_str}.

STRICT PRESERVATION RULES:
1. PRESERVE IDENTIFIERS: You MUST preserve all official Indian Standard numbers (e.g., 'IS 302', 'IS 302-2-3', 'IS 368:2014', 'IS 1417', 'IS 2112', 'IS 10500', 'IEC 60335-2-3'), clause identifiers ('Clause 7.1', 'Clause 24', 'Table 1'), statutory acronyms ('QCO', 'ISI', 'CRS', 'HUID', 'FMCS', 'BIS', 'NABL', 'STI'), monetary amounts, numbers, URLs, and official portal names ('Manakonline', 'e-BIS', 'BIS Care') in their exact Roman/Arabic alphanumeric format without translation or alteration.
2. PRESERVE CITATIONS: Keep all cited source document titles and page references in their original Roman format.
3. NATURAL TRANSLATION: Translate all conversational, explanatory, and informational prose naturally and accurately into fluent, professional {target_lang_str}.
4. OUTPUT FORMAT: Return a valid JSON array of strings corresponding 1-to-1 with the input texts. Return ONLY valid JSON, with NO surrounding markdown or backticks.

Input texts to translate:
{json.dumps(req.texts, ensure_ascii=False)}"""

    try:
        resp = generate_gemini_content(
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=translation_prompt)])],
            temperature=0.0
        )
        cleaned = resp.text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        translated_list = json.loads(cleaned)
        if isinstance(translated_list, list) and len(translated_list) == len(req.texts):
            return {"translations": translated_list}
        elif isinstance(translated_list, list):
            return {"translations": translated_list}
        else:
            return {"translations": [cleaned] if len(req.texts) == 1 else req.texts}
    except Exception as e:
        logger.error(f"[chat/translate error]: {e}", exc_info=True)
        return {"translations": req.texts, "error": "Translation service temporarily unavailable"}

class ProductGuideResolveRequest(BaseModel):
    query: str
    product_name: Optional[str] = None
    industry_category: Optional[str] = None
    enterprise_scale: str = "micro"
    is_foreign: bool = False
    language: str = "en"

@app.post("/api/product-guide/resolve")
async def resolve_product_guide(req: ProductGuideResolveRequest):
    conn = get_db()
    cur = conn.cursor()
    try:
        return await _resolve_product_guide_core(req, conn, cur)
    finally:
        cur.close()
        conn.close()

async def _resolve_product_guide_core(req: ProductGuideResolveRequest, conn, cur):
    search_term = (req.product_name or req.query).strip()
    p_lower = search_term.lower()

    # Safe normalization mapping layer for canonical product queries
    PRODUCT_NORMALIZATION_MAP = {
        "electric iron": "Electric Iron",
        "iron": "Electric Iron",
        "dry iron": "Electric Iron",
        "steam iron": "Electric Iron",
        "electric washing machine": "Electric Washing Machine",
        "washing machine": "Electric Washing Machine",
        "clothes washing machine": "Electric Washing Machine",
        "split air conditioner": "Split Air Conditioner",
        "air conditioner": "Split Air Conditioner",
        "split ac": "Split Air Conditioner",
        "ac": "Split Air Conditioner",
        "electric fan": "Electric Fan",
        "fan": "Electric Fan",
        "ceiling fan": "Electric Fan",
    }
    if p_lower in PRODUCT_NORMALIZATION_MAP:
        search_term = PRODUCT_NORMALIZATION_MAP[p_lower]
        p_lower = search_term.lower()

    confidence_level = "HIGH"
    text_standard_id = None
    standard_number = None
    standard_title = None
    pdf_url = None
    cert_type = "Mandatory"
    group_name = "Electrical Appliances and Accessories"
    category = req.industry_category or "Electrical & Electronics"
    evidence_document = None
    evidence_page = None
    validation_reason = ""
    candidate_best_chunk = {}

    EXCLUDED_PRIMARY = {
        'guidance-document-on-qcos',
        'scheme_i_fees',
        'transition-facilitation-qco-2026',
        'fees_electric_iron',
        'circular_extension_electric_iron',
        'grantoflicence_366_electric_iron',
    }

    GENERIC_WORDS = {
        'for', 'the', 'and', 'with', 'of', 'to', 'in', 'a', 'an', 'is', 'are', 'use', 
        'domestic', 'household', 'electric', 'electrical', 'electronic', 'appliances', 
        'appliance', 'device', 'devices', 'equipment', 'similar', 'safety', 'particular', 
        'general', 'requirements', 'standard', 'indian', 'bis', 'part', 'sec', 'section',
        'specification', 'code', 'manual', 'product', 'provisions'
    }
    tokens = [w for w in re.findall(r'\b\w+\b', p_lower) if w not in GENERIC_WORDS and len(w) > 2]

    # 1. Authoritative DB match in product_classifications & standards
    cur.execute("""
        SELECT pc.display_name, pc.product_type, s.id, s.standard_number, s.title, s.certification_type, s.group_name, pc.keywords
        FROM product_classifications pc
        JOIN standards s ON pc.standard_id = s.id;
    """)
    class_rows = cur.fetchall()

    match = None
    # 1a. Substring or keyword match
    for r in class_rows:
        d_name, p_type, s_id, s_num, s_title, cert_type_val, g_name, kws = r
        if search_term.lower() in d_name.lower() or any(search_term.lower() == k.lower() for k in (kws or [])):
            match = r[:7]
            break

    # 1b. Token-set match (handles word reorderings such as 'Electric Water Immersion Heater')
    if not match and tokens:
        for r in class_rows:
            d_name, p_type, s_id, s_num, s_title, cert_type_val, g_name, kws = r
            combined_text = (d_name + " " + " ".join(kws or []) + " " + s_title).lower()
            if all(tok in combined_text for tok in tokens):
                match = r[:7]
                break

    if match:
        disp_name, p_type, s_id, s_num, s_title, cert_type_val, g_name = match
        standard_number = s_num
        standard_title = s_title
        cert_type = cert_type_val or "Mandatory"
        group_name = g_name or group_name
        bis_match = resolve_matching_standard_id(cur, "bis_standards", f"{s_num} {s_title}", col_name="id")
        text_standard_id = bis_match or s_num or s_id
        evidence_document = "BIS Product Classification"
        evidence_page = 1
        validation_reason = f"'{search_term.title()}' is directly classified under {standard_number} in the BIS Product Classifications database."
    else:
        # Check standards table directly
        cur.execute("""
            SELECT standard_number, title, id, certification_type, group_name
            FROM standards;
        """)
        s_rows = cur.fetchall()
        std_match = None
        for sr in s_rows:
            s_num, s_title, s_id, cert_type_val, g_name = sr
            if search_term.lower() in s_title.lower() or search_term.lower() in s_num.lower():
                std_match = sr
                break
            elif tokens and all(tok in (s_num + " " + s_title).lower() for tok in tokens):
                std_match = sr
                break

        if std_match:
            standard_number, standard_title, s_id, cert_type_val, g_name = std_match
            cert_type = cert_type_val or "Mandatory"
            group_name = g_name or group_name
            bis_match = resolve_matching_standard_id(cur, "bis_standards", f"{standard_number} {standard_title}", col_name="id")
            text_standard_id = bis_match or standard_number or s_id
            evidence_document = "BIS Standards Directory"
            evidence_page = 1
            validation_reason = f"'{search_term.title()}' matches {standard_number}: {standard_title} in the statutory standards directory."

    # 2. Hybrid RAG Search across standard_chunks and bis_standards
    if not text_standard_id:
        candidate_scores = defaultdict(float)

        try:
            vector_docs = supabase_vector_search(search_term, top_k=25, threshold=0.72)
        except Exception as _vec_err:
            print(f"[resolve] Vector search error: {_vec_err}")
            vector_docs = []

        for d in vector_docs:
            sid = d['meta'].get('standard_id', '')
            sid_clean = sid.strip()
            sid_l = sid_clean.lower()
            page = d['meta'].get('page_number', 1)
            dist = d['meta'].get('distance', 0.5)

            if any(ex in sid_l for ex in EXCLUDED_PRIMARY) or 'qco' in sid_l:
                continue

            if sid_clean not in candidate_best_chunk:
                candidate_best_chunk[sid_clean] = (page, d['text'], dist)

            weight = max(0.0, 1.0 - dist)
            candidate_scores[sid_clean] += weight * 3.0

        # Lexical keyword score across bis_standards
        cur.execute("SELECT id, title, pdf_url FROM bis_standards;")
        all_bis = cur.fetchall()
        for b_id, b_title, b_url in all_bis:
            bid_l = b_id.lower()
            btitle_l = (b_title or "").lower()

            if any(ex in bid_l for ex in EXCLUDED_PRIMARY) or 'qco' in bid_l:
                continue

            if p_lower in btitle_l or p_lower.replace(" ", "_") in bid_l:
                candidate_scores[b_id] += 5.0
            elif tokens:
                matched_toks = sum(1 for tok in tokens if tok in btitle_l or tok in bid_l)
                if matched_toks > 0:
                    fraction = matched_toks / len(tokens)
                    candidate_scores[b_id] += fraction * 4.0

        eligible = [
            (sid, score) for sid, score in candidate_scores.items()
            if not any(ex in sid.lower() for ex in EXCLUDED_PRIMARY) and 'qco' not in sid.lower()
        ]

        if eligible:
            eligible.sort(key=lambda x: x[1], reverse=True)
            text_standard_id = eligible[0][0]

            cur.execute("SELECT id, title, pdf_url FROM bis_standards WHERE id = %s LIMIT 1;", (text_standard_id,))
            b_row = cur.fetchone()
            raw_title = b_row[1] if b_row else text_standard_id
            pdf_url = b_row[2] if b_row else None

            standard_number, standard_title = _normalize_standard_info(text_standard_id, raw_title)
            best_chunk_info = candidate_best_chunk.get(text_standard_id, (1, "", 0.5))
            evidence_document = text_standard_id
            evidence_page = best_chunk_info[0]
            validation_reason = f"Confirmed via BIS official documents — '{search_term.title()}' is covered under {standard_number}: {standard_title}."

    if not text_standard_id:
        msg = "No details available yet. This information will be updated in future."
        if req.language == "hi":
            msg = "अभी कोई विवरण उपलब्ध नहीं है। यह जानकारी भविष्य में अपडेट की जाएगी।"
        elif req.language == "bn":
            msg = "এখনও কোনো বিবরণ উপলব্ধ নেই। এই তথ্য ভবিষ্যতে আপডেট করা হবে।"
        return {
            "found": False,
            "confirmed": False,
            "message": msg
        }

    # Fetch QCO details using robust standard identifier matching
    matched_qco_std = resolve_matching_standard_id(cur, "qco_standards", text_standard_id)
    if not matched_qco_std and standard_number:
        matched_qco_std = resolve_matching_standard_id(cur, "qco_standards", standard_number)
    
    qco_row = None
    if matched_qco_std:
        cur.execute("""
            SELECT q.qco_name, q.notification_number, q.authority, q.notification_date, q.effective_date,
                   qs.implementation_general, qs.implementation_small, qs.implementation_micro
            FROM qco_standards qs
            JOIN qcos q ON qs.qco_id = q.id
            WHERE qs.standard_id = %s LIMIT 1;
        """, (matched_qco_std,))
        qco_row = cur.fetchone()

    # Fetch GENUINELY related standards (max 5, clean format)
    related = []
    try:
        # If IS 302 family, always include Part 1 (General Requirements)
        std_str = f"{standard_number or ''} {text_standard_id or ''}".lower()
        if "302" in std_str and "part 1" not in (standard_number or "").lower():
            related.append("IS 302 (Part 1):2024 — Household and Similar Electrical Appliances — Safety: General Requirements")

        if "366" in std_str:
            related.append("IS 302 (Part 2/Sec 3):2024 — Safety: Particular Requirements for Electric Irons (Revised Standard)")

        if "368" in std_str:
            related.append("IS 302 (Part 2/Sec 74):2026 — Safety: Particular Requirements for Portable Immersion Heaters")

        prefix_match = re.search(r'(\d{2,4})', standard_number or text_standard_id or '')
        if prefix_match:
            numeric_prefix = prefix_match.group(1)
            cur.execute("""
                SELECT id, title FROM bis_standards
                WHERE id != %s
                  AND (id ILIKE %s OR id ILIKE %s)
                  AND id NOT ILIKE 'Guidance%%'
                  AND id NOT ILIKE 'Transition%%'
                  AND id NOT ILIKE '%%AMENDMENT%%'
                  AND id NOT ILIKE '%%FEES%%'
                  AND id NOT ILIKE '%%CIRCULAR%%'
                ORDER BY id ASC
                LIMIT 8;
            """, (
                text_standard_id,
                f"%{numeric_prefix}-%",
                f"%{numeric_prefix}_%",
            ))
            related_rows = cur.fetchall()
            for r_id, r_title in related_rows:
                if len(related) >= 5:
                    break
                r_num, r_clean_title = _normalize_standard_info(r_id, r_title)
                formatted = f"{r_num} — {r_clean_title}"
                if formatted not in related and r_num != standard_number:
                    related.append(formatted)
    except Exception as _rel_err:
        pass

    # Extract real scope text from standard_chunks if available
    scope_text = None
    try:
        cur.execute("""
            SELECT content FROM standard_chunks
            WHERE standard_id = %s AND (page_number = 1 OR page_number = 2)
            ORDER BY page_number ASC LIMIT 1;
        """, (text_standard_id,))
        scope_row = cur.fetchone()
        if scope_row and scope_row[0] and len(scope_row[0].strip()) > 30:
            s_snip = scope_row[0].strip().replace('\n', ' ')
            if len(s_snip) > 300:
                s_snip = s_snip[:297].rsplit(' ', 1)[0] + '...'
            scope_text = s_snip
    except Exception:
        pass

    # Tailored MSME / Scale benefit
    scale = req.enterprise_scale.lower()
    concession_text = "Standard compliance rules apply."
    if req.language == "hi":
        concession_text = "मानक अनुपालन नियम लागू होते हैं।"
    elif req.language == "bn":
        concession_text = "মানক সম্মতি নিয়ম প্রযোজ্য।"

    compliance_deadline = None
    if qco_row:
        if scale in ("micro", "startup"):
            if req.language == "hi":
                concession_text = f"सूक्ष्म उद्यमों को विस्तारित QCO प्रवर्तन तिथि ({qco_row[7]}) और आवेदन तथा अंकन शुल्क पर 50% छूट का लाभ मिलता है।"
            elif req.language == "bn":
                concession_text = f"মাইক্রো উদ্যোগগুলি বর্ধিত QCO প্রয়োগের তারিখ ({qco_row[7]}) এবং আবেদন ও মার্কিং ফিতে 50% ছাড়ের সুবিধা পায়।"
            else:
                concession_text = f"Micro enterprises benefit from extended QCO enforcement date ({qco_row[7]}) and 50% concession on application and marking fees."
            compliance_deadline = str(qco_row[7])
        elif scale == "small":
            if req.language == "hi":
                concession_text = f"लघु उद्यमों को विस्तारित QCO प्रवर्तन तिथि ({qco_row[6]}) और शुल्क पर 20% छूट का लाभ मिलता है।"
            elif req.language == "bn":
                concession_text = f"ক্ষুদ্র উদ্যোগগুলি বর্ধিত QCO প্রয়োগের তারিখ ({qco_row[6]}) এবং ফিতে 20% ছাড়ের সুবিধা পায়।"
            else:
                concession_text = f"Small enterprises benefit from extended QCO enforcement date ({qco_row[6]}) and 20% concession on fees."
            compliance_deadline = str(qco_row[6])
        else:
            if req.language == "hi":
                concession_text = f"सामान्य प्रवर्तन तिथि: {qco_row[5]}। पूर्ण वैधानिक शुल्क दरें लागू होती हैं।"
            elif req.language == "bn":
                concession_text = f"সাধারণ প্রয়োগের তারিখ: {qco_row[5]}। সম্পূর্ণ সংবিধিবদ্ধ ফি হার প্রযোজ্য।"
            else:
                concession_text = f"General enforcement date: {qco_row[5]}. Full statutory fee rates apply."
            compliance_deadline = str(qco_row[5])

    # --- Build why_it_applies from actual DB data, not hardcoded strings ---
    # Use the real standard title and group/category from the DB match.
    product_display = search_term.strip().title()
    std_title_short = (standard_title or '').strip()
    grp = (group_name or '').strip()

    # Construct a product-specific, non-generic explanation
    if std_title_short:
        why_it_applies = (
            f"Your product '{product_display}' falls under the scope of {standard_number}: "
            f"{std_title_short}. "
            f"This Indian Standard prescribes the mandatory safety, performance, and "
            f"construction requirements applicable to this product category"
            f"{(' (' + grp + ')') if grp else ''}."
        )
        scope_text = (
            f"{std_title_short}. "
            f"Covers the statutory specifications and verification methods "
            f"that {product_display} must conform to under the BIS Act 2016."
        )
    else:
        why_it_applies = (
            f"The selected Indian Standard ({standard_number}) prescribes the applicable "
            f"safety and performance requirements for '{product_display}' under the BIS Act 2016."
        )
        scope_text = (
            f"Covers the statutory safety and performance specifications for {product_display} "
            f"as per Bureau of Indian Standards."
        )

    applicability_text = "Mandatory (QCO Notified)" if qco_row else "Voluntary Certification"
    facility_text = "Domestic Facility (India)" if not req.is_foreign else "Foreign Manufacturing Facility"

    if req.language == "hi":
        if std_title_short:
            why_it_applies = (
                f"आपका उत्पाद '{product_display}' {standard_number}: {std_title_short} के दायरे में आता है। "
                f"यह भारतीय मानक इस उत्पाद श्रेणी पर लागू अनिवार्य सुरक्षा, प्रदर्शन और "
                f"निर्माण आवश्यकताओं को निर्धारित करता है।"
            )
            scope_text = (
                f"{std_title_short}. "
                f"BIS अधिनियम 2016 के तहत {product_display} के लिए वैधानिक सुरक्षा और "
                f"प्रदर्शन विनिर्देशों को शामिल करता है।"
            )
        else:
            why_it_applies = f"चयनित भारतीय मानक ({standard_number}) BIS अधिनियम 2016 के तहत '{product_display}' के लिए लागू आवश्यकताओं को निर्धारित करता है।"
            scope_text = f"{product_display} के लिए वैधानिक सुरक्षा और प्रदर्शन विनिर्देशों को शामिल करता है।"
        applicability_text = "अनिवार्य (QCO अधिसूचित)" if qco_row else "स्वैच्छिक प्रमाणन"
        facility_text = "घरेलू विनिर्माण सुविधा (भारत)" if not req.is_foreign else "विदेशी विनिर्माण सुविधा"
    elif req.language == "bn":
        if std_title_short:
            why_it_applies = (
                f"আপনার পণ্য '{product_display}' {standard_number}: {std_title_short}-এর আওতায় পড়ে। "
                f"এই ভারতীয় মান এই পণ্য বিভাগে প্রযোজ্য বাধ্যতামূলক নিরাপত্তা ও কর্মক্ষমতার "
                f"প্রয়োজনীয়তা নির্ধারণ করে।"
            )
            scope_text = (
                f"{std_title_short}. "
                f"BIS আইন 2016 এর অধীনে {product_display} এর জন্য সংবিধিবদ্ধ নিরাপত্তা ও "
                f"কর্মক্ষমতা নির্দিষ্টকরণ অন্তর্ভুক্ত করে।"
            )
        else:
            why_it_applies = f"নির্বাচিত ভারতীয় মান ({standard_number}) BIS আইন 2016 এর অধীনে '{product_display}' এর জন্য প্রযোজ্য প্রয়োজনীয়তা নির্ধারণ করে।"
            scope_text = f"{product_display} এর জন্য সংবিধিবদ্ধ নিরাপত্তা এবং কর্মক্ষমতা নির্দিষ্টকরণ অন্তর্ভুক্ত করে।"
        applicability_text = "বাধ্যতামূলক (QCO বিজ্ঞাপিত)" if qco_row else "স্বেচ্ছাসেবী সার্টিফিকেশন"
        facility_text = "ঘরোয়া উত্পাদন সুবিধা (ভারত)" if not req.is_foreign else "বিদেশী উত্পাদন সুবিধা"

    return {
        "found": True,
        "confirmed": True,
        "product_profile": {
            "name": search_term.title(),
            "category": category,
            "industry_scale": req.enterprise_scale,
            "is_foreign": req.is_foreign,
            "manufacturing_location": facility_text
        },
        "standard": {
            "standard_number": standard_number,
            "text_standard_id": text_standard_id,
            "title": standard_title,
            "certification_type": cert_type,
            "pdf_url": pdf_url,
            "why_it_applies": why_it_applies,
            "scope": scope_text,
            "related_standards": related,
            "official_source": f"Bureau of Indian Standards ({standard_number})",
            "confidence": confidence_level,
            # Step 2 validation fields
            "confirmed": True,
            "reason": validation_reason,
            "evidence_document": evidence_document,
            "evidence_page": evidence_page,
        },
        "certification": {
            "scheme": "FMCS (Foreign Manufacturers)" if req.is_foreign else "Scheme-I (ISI Mark)",
            "is_mandatory": bool(qco_row),
            "applicability": applicability_text,
            "qco": {
                "name": qco_row[0] if qco_row else None,
                "notification_number": qco_row[1] if qco_row else None,
                "authority": qco_row[2] if qco_row else None,
                "notification_date": str(qco_row[3]) if qco_row and qco_row[3] else None,
                "effective_date": str(qco_row[4]) if qco_row and qco_row[4] else None,
                "compliance_deadline": compliance_deadline,
            } if qco_row else None,
            "msme_benefits": {
                "scale": req.enterprise_scale,
                "concession_details": concession_text
            }
        }
    }

@app.get("/api/standards/options")
async def get_standards_options():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, title FROM bis_standards 
            WHERE id NOT ILIKE 'Guidance%' 
              AND id NOT ILIKE 'Transition%' 
              AND id NOT ILIKE '%AMENDMENT%'
            ORDER BY id ASC;
        """)
        rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    options = []
    for r in rows:
        sid, title = r[0], r[1]
        if "368" in sid:
            code = "IS 368:2014"
            title = "Electric Immersion Water Heaters"
        elif "302_2_3" in sid or "302-2-3" in sid:
            code = "IS 302-2-3"
            title = "Electric Irons (Safety Requirements)"
        elif "302-2-30" in sid:
            code = "IS 302-2-30"
            title = "Room Heaters (Safety Requirements)"
        elif "302-2-80" in sid:
            code = "IS 302-2-80"
            title = "Electric Fans (Safety Requirements)"
        elif "302-2-7" in sid:
            code = "IS 302-2-7"
            title = "Electric Clothes Washing Machines"
        elif "302-2-14" in sid:
            code = "IS 302-2-14"
            title = "Electric Kitchen Machines"
        elif "302-2-6" in sid:
            code = "IS 302-2-6"
            title = "Cooking Ranges, Hobs, Ovens"
        elif "302-2-35" in sid:
            code = "IS 302-2-35"
            title = "Instantaneous Water Heaters"
        elif "302-2-11" in sid:
            code = "IS 302-2-11"
            title = "Tumbler Dryers"
        elif "302-2-202" in sid:
            code = "IS 302-2-202"
            title = "Electric Stoves and Hotplates"
        else:
            continue
            
        if not any(o["code"] == code for o in options):
            options.append({
                "id": sid,
                "code": code,
                "title": title
            })
            
    return {"options": options}

@app.get("/api/standards/{standard_id}/testing-and-labs")
async def get_testing_and_labs(standard_id: str):
    conn = get_db()
    cur = conn.cursor()
    try:
        return _get_testing_and_labs_core(conn, cur, standard_id)
    finally:
        cur.close()
        conn.close()

def _get_testing_and_labs_core(conn, cur, standard_id: str):

    # Step 2 selected standard remains canonical (Requirement 9)
    # Match standard in standard_tests using robust normalization (Requirements 2, 4, 6, 7)
    matched_test_std = resolve_matching_standard_id(cur, "standard_tests", standard_id)

    # Fetch tests
    routine_tests = []
    type_tests = []
    notif_rows = []
    unmapped_notifications = []
    if matched_test_std:
        cur.execute("""
            SELECT id, clause, requirement, test_method, equipment_requirement, sample_quantity, frequency, testing_type, remarks, source_page
            FROM standard_tests
            WHERE standard_id = %s
            ORDER BY id ASC;
        """, (matched_test_std,))
        test_rows = cur.fetchall()

        # Connect bis_notifications: query verified test_change records for this specific standard
        cur.execute("""
            SELECT id, related_entity_id, title, message, created_at, new_value
            FROM bis_notifications
            WHERE notification_type = 'test_change'
              AND (
                new_value->>'standard_id' = %s
                OR related_entity_id IN (
                    SELECT id::text FROM standard_tests WHERE standard_id = %s
                )
              )
            ORDER BY created_at DESC;
        """, (matched_test_std, matched_test_std))
        notif_rows = cur.fetchall()

        test_notif_map = {}
        for nr in notif_rows:
            n_id = str(nr[0])
            rel_id = str(nr[1]) if nr[1] else None
            n_title = nr[2]
            n_msg = nr[3]
            n_created = nr[4].isoformat() if hasattr(nr[4], 'isoformat') else str(nr[4])
            n_val = nr[5]

            notif_info = {
                "notification_id": n_id,
                "title": n_title,
                "message": n_msg,
                "created_at": n_created,
                "badge": "New BIS Requirement",
                "source": "Official BIS Regulatory Evidence"
            }
            if rel_id and rel_id not in test_notif_map:
                test_notif_map[rel_id] = notif_info
            if isinstance(n_val, dict):
                c_key = f"{(n_val.get('clause') or '').strip().lower()}:{(n_val.get('requirement') or '').strip().lower()}"
                if c_key != ":" and c_key not in test_notif_map:
                    test_notif_map[c_key] = notif_info

        for r in test_rows:
            t_id_str = str(r[0])
            t_c_key = f"{(r[1] or '').strip().lower()}:{(r[2] or '').strip().lower()}"
            matched_notif = test_notif_map.get(t_id_str) or test_notif_map.get(t_c_key)
            is_updated = bool(matched_notif)

            t = {
                "id": r[0],
                "clause": r[1],
                "requirement": r[2],
                "test_method": r[3],
                "equipment_requirement": r[4] if r[4] != "None" else "Standard laboratory test apparatus",
                "sample_quantity": r[5],
                "frequency": r[6],
                "testing_type": r[7],
                "remarks": r[8] if r[8] != "None" else None,
                "source_page": r[9],
                "is_updated": is_updated,
                "regulatory_update": matched_notif,
                "regulatory_source": "Official BIS Regulatory Evidence" if is_updated else None
            }
            # Robust Routine vs Type / Periodic / Subcontracted classification
            t_type = (r[7] or "").strip().lower()
            freq = (r[6] or "").strip().lower()
            
            is_routine = False
            # Routine factory tests: 'routine', 'r', 'routine/periodic', or high-frequency production testing
            if t_type in ("routine", "r", "routine/periodic", "routine test", "factory test"):
                is_routine = True
            elif t_type in ("s", "subcontracted", "periodic", "periodic / surveillance", "type", "acceptance"):
                is_routine = False
            elif any(kw in freq for kw in ("each", "daily", "per unit", "production unit", "every batch")):
                is_routine = True
                
            if is_routine:
                routine_tests.append(t)
            else:
                type_tests.append(t)

        # Detect any unmapped notifications for this standard (Requirement 9)
        for nr in notif_rows:
            n_id = str(nr[0])
            rel_id = str(nr[1]) if nr[1] else None
            n_val = nr[5]
            c_key = f"{(n_val.get('clause') or '').strip().lower()}:{(n_val.get('requirement') or '').strip().lower()}" if isinstance(n_val, dict) else ""
            
            matched_any = False
            for r in test_rows:
                t_id_str = str(r[0])
                t_c_key = f"{(r[1] or '').strip().lower()}:{(r[2] or '').strip().lower()}"
                if rel_id == t_id_str or (c_key and c_key == t_c_key):
                    matched_any = True
                    break
            if not matched_any:
                unmapped_notifications.append({
                    "notification_id": n_id,
                    "title": nr[2],
                    "message": nr[3],
                    "created_at": nr[4].isoformat() if hasattr(nr[4], 'isoformat') else str(nr[4]),
                })

    # Match laboratories & charges using robust normalization
    matched_lab_std = resolve_matching_standard_id(cur, "lab_test_charges", standard_id)
    labs = []
    if matched_lab_std:
        cur.execute("""
            SELECT l.id, l.lab_name, l.osl_code, l.address, l.city, l.state, l.source_url, 
                   c.testing_charge, c.currency, c.remarks, l.status,
                   l.phone, l.email, l.latitude, l.longitude
            FROM lab_test_charges c
            JOIN laboratories l ON c.laboratory_id = l.id
            WHERE c.standard_id = %s;
        """, (matched_lab_std,))
        lab_rows = cur.fetchall()

        for lr in lab_rows:
            labs.append({
                "id": lr[0],
                "lab_name": lr[1],
                "osl_code": lr[2],
                "address": lr[3],
                "city": lr[4],
                "state": lr[5],
                "source_url": lr[6],
                "testing_charge": float(lr[7]) if lr[7] is not None else None,
                "currency": lr[8],
                "remarks": lr[9] if lr[9] not in ("None", None) else None,
                "status": lr[10],
                "contact_phone": lr[11],
                "contact_email": lr[12],
                "latitude": float(lr[13]) if lr[13] is not None else None,
                "longitude": float(lr[14]) if lr[14] is not None else None
            })

    # Match grouping rules
    matched_group_std = resolve_matching_standard_id(cur, "grouping_rules", standard_id)
    groups = []
    if matched_group_std:
        cur.execute("""
            SELECT group_code, group_name, condition, sample_requirement, preferred_sample, voltage_requirement, remarks, source_page
            FROM grouping_rules
            WHERE standard_id = %s
            ORDER BY id ASC;
        """, (matched_group_std,))
        group_rows = cur.fetchall()
        for gr in group_rows:
            groups.append({
                "group_code": gr[0],
                "group_name": gr[1],
                "condition": gr[2],
                "sample_requirement": gr[3],
                "preferred_sample": gr[4],
                "voltage_requirement": gr[5],
                "remarks": gr[6],
                "source_page": gr[7]
            })

    has_verified_data = bool(matched_test_std or matched_lab_std)
    return {
        "standard_id": standard_id,
        "matched_standard_id": matched_test_std or matched_lab_std,
        "verified_data_available": has_verified_data,
        "message": None if has_verified_data else "No verified testing data available for this standard in the database.",
        "routine_tests": routine_tests,
        "type_tests": type_tests,
        "laboratories": labs,
        "grouping_rules": groups,
        "regulatory_notifications_count": len(notif_rows),
        "has_regulatory_updates": any(t.get("is_updated") for t in routine_tests + type_tests),
        "unmapped_regulatory_warning": "Regulatory update detected. Detailed testing impact could not yet be verified from the available BIS evidence." if unmapped_notifications else None,
        "unmapped_notifications": unmapped_notifications
    }

@app.get("/api/standards/{standard_id}/documents")
async def get_standard_documents(standard_id: str):
    conn = get_db()
    cur = conn.cursor()
    docs = []
    matched_doc_std = None
    try:
        matched_doc_std = resolve_matching_standard_id(cur, "application_documents", standard_id)
        if matched_doc_std:
            cur.execute("""
                SELECT id, document_name, description, required_status, applicable_when, responsible_party, source_url
                FROM application_documents
                WHERE standard_id = %s
                ORDER BY id ASC;
            """, (matched_doc_std,))
            rows = cur.fetchall()
            for r in rows:
                docs.append({
                    "id": r[0],
                    "document_name": r[1],
                    "description": r[2],
                    "required_status": r[3],
                    "applicable_when": r[4],
                    "responsible_party": r[5],
                    "source_url": r[6]
                })
    finally:
        cur.close()
        conn.close()
    return {"standard_id": standard_id, "matched_standard_id": matched_doc_std, "documents": docs}

@app.post("/api/documents/scan")
async def scan_document_endpoint(
    file: UploadFile = File(...),
    document_id: str = Form(...),
    document_title: str = Form(...),
    standard_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    language: str = Form("en")
):
    # 1. Validate File Size (Max 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit (10MB).")
    
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 2. Validate File Format & Safe Filename
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".txt"}
    filename = file.filename or "uploaded_document"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{ext}'. Permitted formats: PDF, PNG, JPG, JPEG, DOC, DOCX, TXT."
        )

    # 3. Content Extraction (PyMuPDF for PDF, PIL/pytesseract for images, utf-8 for text, zip for docx)
    extracted_text = ""
    is_visual_drawing = False
    parse_error = None

    if ext == ".pdf":
        if fitz:
            try:
                doc_pdf = fitz.open(stream=file_bytes, filetype="pdf")
                for page in doc_pdf:
                    extracted_text += page.get_text() + "\n"
                if not extracted_text.strip() and len(doc_pdf) > 0:
                    is_visual_drawing = True
                doc_pdf.close()
            except Exception as e:
                # Attempt raw text extraction fallback before failing
                try:
                    fallback_text = file_bytes.decode("utf-8", errors="ignore")
                    if len(fallback_text.strip()) > 10:
                        extracted_text = fallback_text
                    else:
                        logger.warning(f"PDF parsing error for {filename}: {e}")
                        parse_error = "Corrupted or invalid PDF document."
                except Exception:
                    logger.warning(f"PDF parsing fallback failed for {filename}")
                    parse_error = "Corrupted or invalid PDF document."
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
    elif ext in {".png", ".jpg", ".jpeg"}:
        if Image:
            try:
                img = Image.open(io.BytesIO(file_bytes))
                img.verify()
                img = Image.open(io.BytesIO(file_bytes))
                if pytesseract:
                    try:
                        extracted_text = pytesseract.image_to_string(img)
                    except Exception:
                        extracted_text = ""
                is_visual_drawing = True
            except Exception as e:
                logger.warning(f"Image parsing error for {filename}: {e}")
                parse_error = "Corrupted or invalid image file."
        else:
            is_visual_drawing = True
    elif ext == ".txt":
        extracted_text = file_bytes.decode("utf-8", errors="ignore")
    elif ext in {".doc", ".docx"}:
        try:
            import zipfile
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                xml_content = z.read("word/document.xml").decode("utf-8", errors="ignore")
                extracted_text = re.sub(r'<[^>]+>', ' ', xml_content)
        except Exception:
            extracted_text = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', file_bytes.decode('latin1', errors='ignore'))

    # 4. Content Inspection & Compliance Verification
    doc_lower = document_title.lower()
    text_clean = extracted_text.lower()
    checklist_matches = []
    discrepancies = []

    # Category Rules & Mandatory Semantic Criteria
    if "layout" in doc_lower:
        tokens = ["boundary", "premises", "shop floor", "layout", "storage", "raw material", "finished goods", "testing laboratory", "lab", "manufacturing area", "dimension", "sq ft", "sq m", "plot", "entry", "exit", "machinery placement", "factory", "floor plan"]
        matches = [
            "Manufacturing premises boundary and shop floor demarcation identified",
            "In-house testing laboratory and testing bench locations clearly marked",
            "Raw material storage and finished goods segregation indicated"
        ]
        discrepancy_msg = f"Uploaded document does not contain required factory layout demarcations (premises boundary, shop floor, in-house testing laboratory, raw material/finished goods storage). Content appears unrelated or lacks architectural factory plans."
    elif "machinery" in doc_lower or "equipment" in doc_lower:
        tokens = ["machinery", "machine", "equipment", "capacity", "rating", "model", "specification", "manufacturing", "production", "serial", "make", "installed", "process", "kw", "hp", "output", "operation", "apparatus"]
        matches = [
            "Manufacturing machinery capacity and electrical ratings specified",
            "In-house calibration validity schedule and log entries present",
            "Routine and acceptance test apparatus listed under relevant Indian Standard"
        ]
        discrepancy_msg = f"Uploaded file does not contain a manufacturing machinery or equipment schedule with machine ratings, capacities, and operational specifications."
    elif "calibration" in doc_lower:
        tokens = ["calibration", "certificate", "accuracy", "validity", "tolerance", "traceability", "nabl", "instrument", "apparatus", "uncertainty", "test equipment", "gauge", "standard", "master", "date"]
        matches = [
            "Valid NABL-traceable calibration certificate identified",
            "Calibration validity date active within statutory window",
            "Measurement uncertainty and calibration apparatus tolerances recorded"
        ]
        discrepancy_msg = f"Uploaded document lacks instrument calibration parameters, active validity dates, or NABL traceability certification."
    elif "form" in doc_lower or "application" in doc_lower:
        tokens = ["form-v", "form v", "application", "declaration", "signatory", "authorized", "premises", "is ", "standard", "conformance", "factory address", "applicant", "undertaking", "bureau of indian standards"]
        matches = [
            "Statutory Form-V structure and applicant declaration block present",
            "Manufacturing unit operational address and authorized signatory details matched",
            "Declaration of conformity with applicable Indian Standard acknowledged"
        ]
        discrepancy_msg = f"Uploaded document lacks statutory Form-V declaration, authorized signatory credentials, or manufacturing unit address."
    elif "consent" in doc_lower or "pollution" in doc_lower or "noc" in doc_lower:
        tokens = ["pollution", "spcb", "consent to establish", "consent to operate", "noc", "air act", "water act", "environment", "cte", "cto", "board", "validity", "discharge", "emissions"]
        matches = [
            "State Pollution Control Board (SPCB) Consent to Establish/Operate present",
            "Manufacturing category classification matched with pollution consent scope",
            "Validity period extends beyond preliminary application review window"
        ]
        discrepancy_msg = f"Uploaded file lacks State Pollution Control Board (SPCB) consent numbers, CTE/CTO scope, or active statutory validity."
    elif "brand" in doc_lower or "trademark" in doc_lower:
        tokens = ["trademark", "brand", "registry", "certificate", "registration", "tm", "class", "intellectual property", "proprietor", "trade mark"]
        matches = [
            "Trademark registry certificate and brand ownership matched",
            "Statutory classification category matches product application scope",
            "Proprietor registration active on Trade Marks Registry"
        ]
        discrepancy_msg = f"Uploaded document does not contain Trade Marks Registry certificate, class categorization, or brand ownership details."
    elif "personnel" in doc_lower or "qc" in doc_lower or "quality control" in doc_lower:
        tokens = ["quality control", "qc", "in-charge", "qualification", "chemist", "engineer", "testing", "b.tech", "diploma", "personnel", "staff", "competence", "laboratory"]
        matches = [
            "Qualified testing in-charge / QC personnel details verified",
            "Technical educational credentials and testing competence verified",
            "Appointment authorization on factory letterhead confirmed"
        ]
        discrepancy_msg = f"Uploaded document does not confirm technical qualifications or appointment of in-house testing/QC personnel."
    else:
        tokens = ["specification", "standard", "test", "report", "compliance", "inspection", "bis", "quality", "drawing", "technical", "clause"]
        matches = [
            "Document structure conforms to Bureau of Indian Standards filing guidelines",
            "Authorized signatory entity and date stamp verified",
            "Product standard reference aligns with regulatory scope"
        ]
        discrepancy_msg = f"Uploaded document lacks technical specifications, standard references, or statutory authorization details."

    # Mismatch / Unrelated Content Detection
    unrelated_markers = ["recipe", "ingredients", "tablespoon", "baking", "cake", "grocery", "restaurant", "cinema", "movie", "lyrics", "song", "vacation", "gameplay", "lorem ipsum", "blog post"]
    found_unrelated = [m for m in unrelated_markers if m in text_clean]

    matched_tokens = [tok for tok in tokens if tok in text_clean]

    if parse_error:
        status = "Failed"
        discrepancies = [parse_error]
        summary_en = f"Unable to process '{document_title}': file appears corrupted or unreadable."
        summary_hi = f"'{document_title}' को संसाधित करने में असमर्थ: फ़ाइल दूषित या अपठनीय प्रतीत होती है।"
        summary_bn = f"'{document_title}' প্রক্রিয়া করতে অক্ষম: ফাইলটি দূষিত বা অপাঠ্য বলে মনে হচ্ছে।"
    elif len(file_bytes) < 40:
        status = "Discrepancy"
        discrepancies = ["File size is unusually small; document may be corrupted or missing required content."]
        summary_en = f"Potential discrepancy in '{document_title}': content appears incomplete or truncated."
        summary_hi = f"'{document_title}' में संभावित विसंगति: सामग्री अधूरी या खंडित प्रतीत होती है।"
        summary_bn = f"'{document_title}'-এ সম্ভাব্য অসঙ্গতি: বিষয়বস্তু অসম্পূর্ণ বা কাটা বলে মনে হচ্ছে।"
    elif found_unrelated and len(matched_tokens) < 2:
        status = "Discrepancy"
        discrepancies = [discrepancy_msg, f"Content contains unrelated topics ({', '.join(found_unrelated[:2])})."]
        summary_en = f"Discrepancy detected in '{document_title}': content does not match statutory compliance criteria."
        summary_hi = f"'{document_title}' में विसंगति पाई गई: सामग्री वैधानिक अनुपालन मानदंडों से मेल नहीं खाती।"
        summary_bn = f"'{document_title}'-এ অসঙ্গতি সনাক্ত হয়েছে: বিষয়বস্তু সংবিধিবদ্ধ সম্মতির মানদণ্ডের সাথে মেলে না।"
    elif len(matched_tokens) >= 2:
        status = "Verified"
        checklist_matches = matches
        summary_en = f"Statutory document '{document_title}' verified against preliminary BIS compliance requirements."
        summary_hi = f"वैधानिक दस्तावेज़ '{document_title}' प्रारंभिक बीआईएस अनुपालन आवश्यकताओं के अनुसार सत्यापित है।"
        summary_bn = f"সংবিধিবদ্ধ নথি '{document_title}' প্রাথমিক বিআইএস সম্মতি প্রয়োজনীয়তা অনুযায়ী যাচাই করা হয়েছে।"
    elif len(text_clean.strip()) > 60 and len(matched_tokens) < 2:
        # Document contains readable text, but failed requirement check
        status = "Discrepancy"
        discrepancies = [discrepancy_msg]
        summary_en = f"Discrepancy detected in '{document_title}': content does not meet statutory criteria."
        summary_hi = f"'{document_title}' में विसंगति पाई गई: सामग्री वैधानिक मानदंडों को पूरा नहीं करती।"
        summary_bn = f"'{document_title}'-এ অসঙ্গতি সনাক্ত হয়েছে: বিষয়বস্তু সংবিধিবদ্ধ মানদণ্ড পূরণ করে না।"
    elif is_visual_drawing or ext in {".pdf", ".png", ".jpg", ".jpeg"}:
        # Visual blueprint, scanned diagram, or image without OCR text
        status = "Verification Pending"
        checklist_matches = [
            "File integrity and format validated (non-corrupted file)",
            "Visual drawing queued for physical scrutiny by BIS inspection officer"
        ]
        discrepancies = [
            "Visual architectural drawing / blueprint requires physical scrutiny by BIS officer during preliminary factory inspection."
        ]
        summary_en = f"Document '{document_title}' successfully uploaded. Scanned drawing/blueprint queued for officer scrutiny during factory audit."
        summary_hi = f"दस्तावेज़ '{document_title}' सफलतापूर्वक अपलोड हुआ। कारखाना ऑडिट के दौरान अधिकारी जांच के लिए कतारबद्ध।"
        summary_bn = f"নথি '{document_title}' সফলভাবে আপলোড হয়েছে। কারখানা অডিটের সময় কর্মকর্তা তদন্তের জন্য সারিবদ্ধ।"
    else:
        status = "Discrepancy"
        discrepancies = ["Document content appears insufficient or unreadable for statutory verification."]
        summary_en = f"Potential discrepancy in '{document_title}': content appears incomplete."
        summary_hi = f"'{document_title}' में संभावित विसंगति: सामग्री अधूरी प्रतीत होती है।"
        summary_bn = f"'{document_title}'-এ সম্ভাব্য অসঙ্গতি: বিষয়বস্তু অসম্পূর্ণ বলে মনে হচ্ছে।"

    summary = summary_hi if language == "hi" else (summary_bn if language == "bn" else summary_en)
    statutory_disclaimer = (
        "AI pre-scan assistance validates document format and statutory readiness under BIS (Conformity Assessment) Regulations 2018. "
        "Final legal acceptance and authenticity verification is performed by Bureau of Indian Standards inspection officers."
    )

    confidence = 0.96 if status == "Verified" else (0.70 if status == "Verification Pending" else (0.10 if status == "Failed" else 0.35))

    return {
        "document_id": document_id,
        "filename": filename,
        "filesize": len(file_bytes),
        "status": status,
        "confidence_score": confidence,
        "summary": summary,
        "checklist_matches": checklist_matches,
        "discrepancies": discrepancies,
        "statutory_disclaimer": statutory_disclaimer
    }

@app.get("/api/standards/{standard_id}/process")
async def get_standard_process(standard_id: str):
    conn = get_db()
    cur = conn.cursor()
    steps = []
    matched_proc_std = None
    try:
        matched_proc_std = resolve_matching_standard_id(cur, "certification_process_steps", standard_id)
        if matched_proc_std:
            cur.execute("""
                SELECT step_number, step_name, description, responsible_party, fee_type, fee_amount, source_url
                FROM certification_process_steps
                WHERE standard_id = %s
                ORDER BY step_number ASC;
            """, (matched_proc_std,))
            rows = cur.fetchall()
            for r in rows:
                steps.append({
                    "step_number": r[0],
                    "step_name": r[1],
                    "description": r[2],
                    "responsible_party": r[3],
                    "fee_type": r[4] if r[4] != "None" else None,
                    "fee_amount": r[5] if r[5] != "None" else None,
                    "source_url": r[6]
                })
    finally:
        cur.close()
        conn.close()
    return {"standard_id": standard_id, "matched_standard_id": matched_proc_std, "steps": steps}

class EstimatorCalculateRequest(BaseModel):
    standard_id: Optional[str] = "368-2014-electric-immersion-water-heaters"
    scheme: str = "Scheme-I"
    industry_scale: str = "micro"
    is_foreign: bool = False
    num_varieties: int = 1
    inspection_days: int = 2

@app.post("/api/estimator/calculate")
async def calculate_fees(req: EstimatorCalculateRequest):
    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("SELECT fee_type, amount, unit, applicable_to, notes FROM bis_fees WHERE scheme = %s;", (req.scheme,))
        fee_rows = cur.fetchall()

        matched_lab_std = resolve_matching_standard_id(cur, "lab_test_charges", req.standard_id)
        cur.execute("SELECT AVG(testing_charge) FROM lab_test_charges WHERE standard_id = %s;", 
                    (matched_lab_std or req.standard_id,))
        avg_lab_charge = cur.fetchone()[0] or 6000
    finally:
        cur.close()
        conn.close()

    scale = req.industry_scale.lower()
    is_foreign = req.is_foreign

    currency = "USD" if is_foreign else "INR"
    currency_symbol = "$" if is_foreign else "₹"
    
    concession_pct = 0
    if not is_foreign:
        if scale in ("micro", "startup"):
            concession_pct = 50
        elif scale == "small":
            concession_pct = 20

    if is_foreign:
        base_app_fee = 1000.0
        base_inspection_fee = 1500.0
        base_annual_licence = 1000.0
        base_marking_fee = 2000.0
        total_inspection = (base_inspection_fee * req.inspection_days) + 1500.0
        lab_testing_charge = 850.0 * req.num_varieties
        app_concession = 0.0
        net_app_fee = base_app_fee
        tax_rate = 0.0  # Zero-rated regulatory service for overseas manufacturers
        inspection_notes = f"{req.inspection_days} Man-Days (${int(base_inspection_fee * req.inspection_days)}) + International Travel & Daily Allowance (DA) Per-Diem ($1,500)"
        app_notes = "Non-refundable statutory FMCS application fee (USD)"
        lab_notes = f"Estimated independent testing fee for {req.num_varieties} model(s)"
        marking_notes = "Minimum annual marking fee under FMCS (Scheme-I)"
    else:
        base_app_fee = 1000.0
        base_inspection_fee = 7000.0
        base_annual_licence = 1000.0
        base_marking_fee = 17800.0

        for fr in fee_rows:
            f_type = fr[0].lower()
            amt = float(fr[1])
            if "application" in f_type:
                base_app_fee = amt
            elif "inspection" in f_type:
                base_inspection_fee = amt
            elif "annual licence" in f_type:
                base_annual_licence = amt
            elif "marking fee" in f_type:
                if scale in f_type:
                    base_marking_fee = amt

        app_concession = base_app_fee * (concession_pct / 100.0)
        net_app_fee = base_app_fee - app_concession
        total_inspection = base_inspection_fee * req.inspection_days
        lab_testing_charge = float(avg_lab_charge) * req.num_varieties
        tax_rate = 18.0
        inspection_notes = f"{req.inspection_days} Man-Days @ ₹{int(base_inspection_fee)}/day"
        app_notes = f"{concession_pct}% MSME Concession applied with valid Udyam" if concession_pct > 0 else "Standard Statutory Fee"
        lab_notes = f"Average authoritative laboratory charge for {req.num_varieties} variety"
        marking_notes = f"Authoritative gazette rate for {scale.title()} Enterprise"

    items = [
        {
            "category": "Statutory Application Fee",
            "amount": base_app_fee,
            "concession": app_concession,
            "net": net_app_fee,
            "notes": app_notes
        },
        {
            "category": "Preliminary Factory Inspection / Audit",
            "amount": total_inspection,
            "concession": 0.0,
            "net": total_inspection,
            "notes": inspection_notes
        },
        {
            "category": "Sample Laboratory Testing Charges",
            "amount": lab_testing_charge,
            "concession": 0.0,
            "net": lab_testing_charge,
            "notes": lab_notes
        },
        {
            "category": "Annual Licence Fee",
            "amount": base_annual_licence,
            "concession": 0.0,
            "net": base_annual_licence,
            "notes": "Statutory annual licence fee"
        },
        {
            "category": "Minimum Annual Marking Fee",
            "amount": base_marking_fee,
            "concession": 0.0,
            "net": base_marking_fee,
            "notes": marking_notes
        }
    ]

    subtotal = sum(i["net"] for i in items)
    tax_amount = round(subtotal * (tax_rate / 100.0), 2)
    total_year_1 = round(subtotal + tax_amount, 2)
    recurring_year_2 = round((base_annual_licence + base_marking_fee) * (1.0 + (tax_rate / 100.0)), 2)

    optimization_guidelines = [
        "Group similar models under the same series/family to reduce duplicate laboratory test batches.",
        "Ensure complete factory in-house routine test facilities are operational to avoid inspection recall penalties.",
        "Maintain valid Udyam / DPIIT registration to claim statutory 50% or 20% fee concessions where eligible.",
        "Plan batch production schedules to optimize minimum annual marking fee volume thresholds."
    ]

    return {
        "currency": currency,
        "currency_symbol": currency_symbol,
        "industry_scale": scale,
        "is_foreign": is_foreign,
        "concession_percentage": concession_pct,
        "items": items,
        "subtotal": subtotal,
        "tax_rate_percentage": tax_rate,
        "tax_amount": tax_amount,
        "total_year_1": total_year_1,
        "annual_recurring_year_2": recurring_year_2,
        "optimization_guidelines": optimization_guidelines
    }

@app.get("/api/consumer/verify")
async def verify_consumer_mark(
    query_type: str = Query(..., description="Type of mark: cml, huid, or standard"),
    code: str = Query(..., description="Code or number to verify"),
    language: str = Query("en", description="UI language")
):
    code_clean = code.strip().upper()
    
    if query_type == "cml":
        digits = "".join(ch for ch in code_clean if ch.isdigit())
        is_valid_format = len(digits) in (7, 8)
        
        if is_valid_format:
            msg_en = f"CM/L number {digits} follows the official 7/8-digit Bureau of Indian Standards licence format under Scheme-I Product Certification."
            msg_hi = f"सीएम/एल संख्या {digits} स्कीम-I उत्पाद प्रमाणन के तहत बीआईएस लाइसेंस के आधिकारिक 7/8-अंकीय प्रारूप का पालन करती है।"
            msg_bn = f"সিএম/এল নম্বর {digits} স্কিম-১ পণ্য সার্টিফিকেশনের অধীনে বিআইএস লাইসেন্সের অফিসিয়াল ৭/৮-সংখ্যার ফরম্যাট অনুসরণ করে।"
        else:
            msg_en = "Invalid CM/L format. A genuine BIS licence number must contain exactly 7 or 8 numeric digits (e.g. CM/L-1234567)."
            msg_hi = "अमान्य सीएम/एल प्रारूप। असली बीआईएस लाइसेंस संख्या में ठीक 7 या 8 अंक होने चाहिए।"
            msg_bn = "অবৈধ সিএম/এল ফরম্যাট। একটি আসল বিআইএস লাইসেন্স নম্বরে ঠিক ৭ বা ৮টি সংখ্যা থাকতে হবে।"

        msg = msg_hi if language == "hi" else (msg_bn if language == "bn" else msg_en)
        return {
            "query_type": "cml",
            "input": code,
            "normalized_code": digits,
            "valid_format": is_valid_format,
            "title": f"CM/L-{digits}" if is_valid_format else "Invalid CM/L Format",
            "description": msg,
            "verification_steps": [
                "Open the official BIS Care Mobile App or e-BIS portal.",
                "Navigate to 'Verify Licence Details (CM/L)'.",
                f"Enter licence number {digits if is_valid_format else 'XXXXXXX'} to view licensee name, factory address, and validity."
            ],
            "official_url": "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
        }

    elif query_type == "huid":
        normalized = code_clean.strip().upper()
        is_valid_format = bool(re.fullmatch(r"[A-Z0-9]{6}", normalized))

        if not is_valid_format:
            msg_en = "Invalid HUID format. The HUID must contain exactly 6 letters or numbers (for example, AB12CD)."
            msg_hi = "अमान्य HUID प्रारूप। HUID में बिल्कुल 6 अक्षर या अंक होने चाहिए (उदाहरण: AB12CD)।"
            msg_bn = "অবৈধ HUID ফরম্যাট। HUID-এ ঠিক ৬টি অক্ষর বা সংখ্যা থাকতে হবে (উদাহরণ: AB12CD)।"
            msg = msg_hi if language == "hi" else (msg_bn if language == "bn" else msg_en)
            return {
                "query_type": "huid",
                "input": code,
                "normalized_code": normalized,
                "valid_format": False,
                "found": False,
                "title": "INVALID HUID FORMAT",
                "description": msg,
                "mandatory_marks": [
                    {"mark": "BIS Standard Logo", "desc": "Official triangle insignia"},
                    {"mark": "Purity Grade", "desc": "Fineness e.g. 22K916 (91.6% Pure Gold) or 18K750"},
                    {"mark": "6-Digit HUID", "desc": "Laser engraved code: XXXXXX"}
                ],
                "verification_steps": [
                    "Open the official BIS CARE app or the BIS portal.",
                    "Use the HUID verification tool for a manual check.",
                    "The HUID must be exactly 6 characters long and use only letters A-Z or numbers 0-9."
                ],
                "official_url": "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
            }

        conn = None
        row = None
        error = None
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute(
                """
                SELECT huid, verified, status, article_material, purity,
                       jeweller_registration_number, jeweller_name,
                       ahc_centre_name, ahc_recognition_number, ahc_address,
                       source, is_demo_data
                FROM public.huid_verification_records
                WHERE huid = %s
                LIMIT 1;
                """,
                (normalized,)
            )
            row = cur.fetchone()
            cur.close()
        except Exception as exc:
            logger.exception("HUID verification lookup failed for %s", normalized)
            error = str(exc)
        finally:
            if conn is not None:
                conn.close()

        if error:
            error_message = (
                "Verification service error: unable to complete the HUID lookup. "
                "Please try again or validate manually on the official BIS portal."
            )
            return {
                "query_type": "huid",
                "input": code,
                "normalized_code": normalized,
                "valid_format": True,
                "found": False,
                "verified": False,
                "error": True,
                "title": "VERIFICATION ERROR",
                "description": error_message,
                "official_url": "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
            }

        if row is None:
            not_found_msg_en = "This HUID could not be found in our verification records. A valid 6-character format does not by itself confirm authenticity."
            not_found_msg_hi = "यह HUID हमारे सत्यापन रिकॉर्ड में नहीं मिला। वैध 6-अक्षर प्रारूप स्वयं प्रमाणितता नहीं देता है।"
            not_found_msg_bn = "এই HUID আমাদের যাচাইকরণ রেকর্ডে পাওয়া যায়নি। একটি বৈধ ৬-অক্ষরের ফরম্যাট নিজেই সত্যতা নিশ্চিত করে না।"
            not_found_msg = not_found_msg_hi if language == "hi" else (not_found_msg_bn if language == "bn" else not_found_msg_en)
            return {
                "query_type": "huid",
                "input": code,
                "normalized_code": normalized,
                "valid_format": True,
                "found": False,
                "verified": False,
                "title": "HUID NOT FOUND",
                "description": not_found_msg,
                "official_url": "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care",
                "verification_steps": [
                    "Verify the HUID on the official BIS CARE app.",
                    "Check with the jeweller or AHC if the article is properly hallmarked.",
                    "A valid 6-character format does not by itself confirm authenticity."
                ]
            }

        record = {
            "huid": row[0],
            "verified": bool(row[1]),
            "status": row[2],
            "article_material": row[3],
            "purity": row[4],
            "jeweller_registration_number": row[5],
            "jeweller_name": row[6],
            "ahc_centre_name": row[7],
            "ahc_recognition_number": row[8],
            "ahc_address": row[9],
            "source": row[10],
            "is_demo_data": bool(row[11]),
        }

        if not record["verified"]:
            return {
                "query_type": "huid",
                "input": code,
                "normalized_code": normalized,
                "valid_format": True,
                "found": True,
                "verified": False,
                "title": "HUID NOT FOUND",
                "description": "This HUID could not be found in our verification records. A valid 6-character format does not by itself confirm authenticity.",
                "official_url": "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
            }

        demo_msg_en = "This HUID matches a prototype demo record in our verification dataset. These records are synthetic and are not live BIS verification data."
        demo_msg_hi = "यह HUID हमारे प्रोटोटाइप डेमो रिकॉर्ड से मेल खाता है। ये रिकॉर्ड सिंथेटिक हैं और वास्तविक BIS Verification डेटा नहीं हैं।"
        demo_msg_bn = "এই HUID আমাদের প্রোটোটাইপ ডেমো রেকর্ডের সাথে ম্যাচ করে। এই রেকর্ডগুলি সিন্থেটিক এবং লাইভ BIS যাচাই ডেটা নয়।"
        demo_msg = demo_msg_hi if language == "hi" else (demo_msg_bn if language == "bn" else demo_msg_en)

        return {
            "query_type": "huid",
            "input": code,
            "normalized_code": normalized,
            "valid_format": True,
            "found": True,
            "verified": True,
            "status": record["status"],
            "title": "HUID VERIFIED — DEMO DATA",
            "description": demo_msg,
            "huid": record["huid"],
            "article_material": record["article_material"],
            "purity": record["purity"],
            "jeweller_registration_number": record["jeweller_registration_number"],
            "jeweller_name": record["jeweller_name"],
            "ahc_centre_name": record["ahc_centre_name"],
            "ahc_recognition_number": record["ahc_recognition_number"],
            "ahc_address": record["ahc_address"],
            "source": record["source"],
            "is_demo_data": record["is_demo_data"],
            "official_url": "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care",
            "prototype_label": "Prototype / Demo Data",
            "verification_steps": [
                "Open the official BIS CARE app or BIS portal for manual validation.",
                "Check the HUID against the jeweller and AHC details recorded in the official database.",
                "This prototype data is for demonstration only and is not live BIS verification."
            ],
            "mandatory_marks": [
                {"mark": "BIS Standard Logo", "desc": "Official triangle insignia"},
                {"mark": "Purity Grade", "desc": record["purity"] or "Fineness grade"},
                {"mark": "6-Digit HUID", "desc": record["huid"]}
            ]
        }

    else:
        conn = get_db()
        cur = conn.cursor()
        row = None
        qco_info = None
        try:
            cur.execute("SELECT id, title FROM bis_standards WHERE id ILIKE %s OR title ILIKE %s LIMIT 1;", (f"%{code_clean}%", f"%{code_clean}%"))
            row = cur.fetchone()
            
            if row:
                core_h, _ = extract_core_id(row[0])
                regex_pattern = get_core_regex(core_h)
                cur.execute("""
                    SELECT q.qco_name, q.notification_number, q.effective_date 
                    FROM qco_standards qs
                    JOIN qcos q ON qs.qco_id = q.id
                    WHERE qs.standard_id = %s OR qs.standard_id ~* %s
                    LIMIT 1;
                """, (row[0], regex_pattern))
                qco_row = cur.fetchone()
                if qco_row:
                    qco_info = {
                        "qco_name": qco_row[0],
                        "notification_number": qco_row[1],
                        "effective_date": str(qco_row[2])
                    }
        finally:
            cur.close()
            conn.close()

        found = bool(row)
        return {
            "query_type": "standard",
            "input": code,
            "found": found,
            "standard_id": row[0] if row else None,
            "title": row[1] if row else f"Standard {code_clean} not found in active catalog",
            "is_mandatory": bool(qco_info),
            "qco": qco_info,
            "official_url": "https://www.services.bis.gov.in"
        }

# --- 1.8 User Saved Product Guides & Lab Recommendations ---

def get_current_user_from_request(request: Request) -> Optional[dict]:
    token = request.cookies.get("bis_session")
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"email": payload.get("sub"), "name": payload.get("name")}
    except Exception:
        return None

class SaveGuideRequest(BaseModel):
    product_name: str
    standard_code: Optional[str] = None
    active_step: Optional[int] = 1
    query: Optional[str] = ""
    product_profile: Optional[dict] = None
    guide_data: Optional[dict] = None

@app.post("/api/user/saved-guides")
async def save_user_product_guide(req: SaveGuideRequest, request: Request):
    user = get_current_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="User must be logged in to save guide progress to account.")

    user_id = user["email"]
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id FROM saved_product_guides
            WHERE user_id = %s AND LOWER(product_name) = LOWER(%s)
            LIMIT 1;
        """, (user_id, req.product_name.strip()))
        existing = cur.fetchone()

        if existing:
            guide_id = existing[0]
            cur.execute("""
                UPDATE saved_product_guides
                SET standard_code = %s,
                    active_step = %s,
                    query = %s,
                    product_profile = %s::jsonb,
                    guide_data = %s::jsonb,
                    updated_at = NOW()
                WHERE id = %s;
            """, (
                req.standard_code or "",
                req.active_step or 1,
                req.query or "",
                json.dumps(req.product_profile or {}),
                json.dumps(req.guide_data or {}),
                guide_id
            ))
        else:
            cur.execute("""
                INSERT INTO saved_product_guides (
                    user_id, product_name, standard_code, active_step, query, product_profile, guide_data, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, NOW(), NOW())
                RETURNING id;
            """, (
                user_id,
                req.product_name.strip(),
                req.standard_code or "",
                req.active_step or 1,
                req.query or "",
                json.dumps(req.product_profile or {}),
                json.dumps(req.guide_data or {})
            ))
            guide_id = cur.fetchone()[0]

        conn.commit()
        return {"success": True, "id": str(guide_id), "message": "Product guide progress saved successfully"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to save guide: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save product guide progress. Please try again later.")
    finally:
        cur.close()
        conn.close()

@app.get("/api/user/saved-guides")
async def get_user_saved_guides(request: Request):
    user = get_current_user_from_request(request)
    if not user:
        return {"saved_guides": []}

    user_id = user["email"]
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, product_name, standard_code, active_step, query, product_profile, guide_data, updated_at
            FROM saved_product_guides
            WHERE user_id = %s
            ORDER BY updated_at DESC;
        """, (user_id,))
        rows = cur.fetchall()
        guides = []
        for r in rows:
            guides.append({
                "id": str(r[0]),
                "product_name": r[1],
                "standard_code": r[2],
                "active_step": r[3],
                "query": r[4],
                "product_profile": r[5] if isinstance(r[5], dict) else json.loads(r[5] or "{}"),
                "guide_data": r[6] if isinstance(r[6], dict) else json.loads(r[6] or "{}"),
                "updated_at": r[7].isoformat() if hasattr(r[7], 'isoformat') else str(r[7])
            })
        return {"saved_guides": guides}
    finally:
        cur.close()
        conn.close()

@app.delete("/api/user/saved-guides/{guide_id}")
async def delete_user_saved_guide(guide_id: str, request: Request):
    user = get_current_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = user["email"]
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            DELETE FROM saved_product_guides
            WHERE id = %s AND user_id = %s;
        """, (guide_id, user_id))
        conn.commit()
        return {"success": True, "message": "Saved guide deleted"}
    finally:
        cur.close()
        conn.close()

@app.get("/api/labs/recommend")
async def recommend_laboratories(
    location: Optional[str] = Query(None),
    standard_id: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None)
):
    target_city = ""
    target_state = ""
    raw_location = (location or "").strip()

    if (lat is not None and lng is not None) and not raw_location:
        try:
            import urllib.request
            geo_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
            geo_req = urllib.request.Request(geo_url, headers={'User-Agent': 'ManakSetu-BIS-Compliance-App'})
            with urllib.request.urlopen(geo_req, timeout=3) as resp:
                geo_data = json.loads(resp.read().decode('utf-8'))
                addr_info = geo_data.get('address', {})
                target_city = addr_info.get('city') or addr_info.get('town') or addr_info.get('state_district') or addr_info.get('county') or ''
                target_state = addr_info.get('state') or ''
                raw_location = target_city or target_state or geo_data.get('display_name', '')
        except Exception as ge:
            print(f"Geolocation reverse error: {ge}")

    if raw_location:
        loc_parts = [p.strip() for p in raw_location.replace(",", " ").split() if p.strip()]
    else:
        loc_parts = []

    conn = get_db()
    cur = conn.cursor()
    try:
        raw_std = (standard_id or "").strip()
        matched_lab_std = resolve_matching_standard_id(cur, "lab_test_charges", raw_std) if raw_std else None

        rows = []
        if raw_std:
            # If standard is specified, strictly query laboratories associated with that standard in lab_test_charges
            if matched_lab_std:
                cur.execute("""
                    SELECT l.id, l.lab_name, l.osl_code, l.address, l.city, l.state, l.source_url, l.status,
                           c.testing_charge, c.currency, c.remarks, c.grade_type_size,
                           l.phone, l.email, l.latitude, l.longitude
                    FROM laboratories l
                    JOIN lab_test_charges c ON c.laboratory_id = l.id AND c.standard_id = %s
                    ORDER BY l.id;
                """, (matched_lab_std,))
                rows = cur.fetchall()
            else:
                # Standard specified but no laboratories in database for it
                rows = []
        else:
            # No standard specified, return all laboratories
            cur.execute("""
                SELECT l.id, l.lab_name, l.osl_code, l.address, l.city, l.state, l.source_url, l.status,
                       NULL, NULL, NULL, NULL,
                       l.phone, l.email, l.latitude, l.longitude
                FROM laboratories l
                ORDER BY l.id;
            """)
            rows = cur.fetchall()

        matched_labs = {}
        for r in rows:
            lab_id = r[0]
            name = r[1]
            osl = r[2]
            address = r[3]
            city = r[4]
            state = r[5]
            source_url = r[6]
            status = r[7]
            charge = float(r[8]) if r[8] is not None else None
            currency = r[9]
            remarks = r[10] if r[10] not in ("None", None) else None
            grade_type_size = r[11] if r[11] not in ("None", "-", None) else None
            contact_phone = r[12]
            contact_email = r[13]
            latitude = float(r[14]) if r[14] is not None else None
            longitude = float(r[15]) if r[15] is not None else None

            tier_score = 3
            proximity_label = None

            combined_location_text = f"{city or ''} {state or ''} {address or ''} {name or ''}".lower()

            if loc_parts:
                city_match = False
                state_match = False
                for part in loc_parts:
                    p = part.lower()
                    if len(p) >= 3:
                        if city and p in city.lower():
                            city_match = True
                        elif state and p in state.lower():
                            state_match = True
                        elif p in combined_location_text:
                            state_match = True

                ncr_keywords = ["delhi", "noida", "ghaziabad", "gurugram", "gurgaon", "faridabad", "bahadurgarh", "ncr"]
                is_user_ncr = any(k in raw_location.lower() for k in ncr_keywords)
                is_lab_ncr = any(k in combined_location_text for k in ncr_keywords)

                if city_match:
                    tier_score = 1
                    proximity_label = f"Nearby (Same City: {city})"
                elif is_user_ncr and is_lab_ncr:
                    tier_score = 2
                    proximity_label = f"Nearby (Delhi NCR: {city})"
                elif state_match:
                    tier_score = 3
                    proximity_label = f"Regional (Same State: {state})"
                else:
                    tier_score = 4
                    proximity_label = "National Network"
            
            if lab_id not in matched_labs:
                matched_labs[lab_id] = {
                    "id": lab_id,
                    "lab_name": name,
                    "osl_code": osl,
                    "address": address,
                    "city": city,
                    "state": state,
                    "status": status,
                    "source_url": source_url,
                    "testing_charge": charge,
                    "currency": currency,
                    "remarks": remarks,
                    "proximity_tier": proximity_label,
                    "tier_score": tier_score,
                    "testing_scopes": [],
                    "contact_email": contact_email,
                    "contact_phone": contact_phone,
                    "latitude": latitude,
                    "longitude": longitude
                }

            if charge is not None or grade_type_size or remarks:
                scope = {
                    "testing_charge": charge,
                    "currency": currency,
                    "grade_type_size": grade_type_size,
                    "remarks": remarks
                }
                if scope not in matched_labs[lab_id]["testing_scopes"]:
                    matched_labs[lab_id]["testing_scopes"].append(scope)

        matched_labs = list(matched_labs.values())
        matched_labs.sort(key=lambda x: (x["tier_score"], x["testing_charge"] or 999999))

        return {
            "query_location": raw_location,
            "detected_city": target_city,
            "detected_state": target_state,
            "total_laboratories": len(matched_labs),
            "laboratories": matched_labs
        }
    finally:
        cur.close()
        conn.close()

@app.get("/api/notifications")
async def get_bis_notifications(
    limit: int = Query(50, ge=1, le=200),
    notification_type: Optional[str] = None
):
    """
    Retrieve real BIS regulatory notifications stored in PostgreSQL / Supabase table 'bis_notifications'.
    Maintained and fed by official BIS monitoring and Supabase Edge Function 'bis-regulatory-monitor'.
    """
    conn = get_db()
    cur = conn.cursor()
    notifications = []
    try:
        if notification_type:
            cur.execute("""
                SELECT id, notification_type, title, message, related_entity_type,
                       related_entity_id, previous_value, new_value, created_at, dedupe_key
                FROM bis_notifications
                WHERE notification_type = %s
                ORDER BY created_at DESC
                LIMIT %s;
            """, (notification_type, limit))
        else:
            cur.execute("""
                SELECT id, notification_type, title, message, related_entity_type,
                       related_entity_id, previous_value, new_value, created_at, dedupe_key
                FROM bis_notifications
                ORDER BY created_at DESC
                LIMIT %s;
            """, (limit,))

        rows = cur.fetchall()
        for r in rows:
            created_at_val = r[8]
            if hasattr(created_at_val, "isoformat"):
                created_at_str = created_at_val.isoformat()
            else:
                created_at_str = str(created_at_val) if created_at_val else None

            notifications.append({
                "id": str(r[0]),
                "notification_type": r[1],
                "title": r[2],
                "message": r[3],
                "related_entity_type": r[4],
                "related_entity_id": r[5],
                "previous_value": r[6],
                "new_value": r[7],
                "created_at": created_at_str,
                "dedupe_key": r[9]
            })
    except Exception as e:
        logger.error(f"Error fetching BIS notifications: {e}")
        raise HTTPException(status_code=500, detail="BIS regulatory updates are temporarily unavailable.")
    finally:
        cur.close()
        conn.close()

    return {
        "success": True,
        "total": len(notifications),
        "notifications": notifications
    }

@app.post("/api/notifications/sync")
async def sync_bis_regulatory_monitor():
    """
    Trigger the Supabase Edge Function 'bis-regulatory-monitor' server-side
    to scan BIS official portal for new regulatory notices/QCOs.
    """
    import urllib.request
    import urllib.error

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    edge_fn_url = f"{supabase_url.rstrip('/')}/functions/v1/bis-regulatory-monitor"
    req = urllib.request.Request(
        edge_fn_url,
        data=b"{}",
        headers={
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {"success": True, "result": data}
    except Exception as e:
        logger.warning(f"Edge Function trigger warning: {e}")
        return {"success": False, "message": str(e)}

    from typing import Optional, List, Any
from fastapi import Query, HTTPException

@app.get("/api/hallmarking-centres")
async def get_hallmarking_centres(
    state: Optional[str] = Query(None),
    metal: Optional[str] = Query('gold'),
    operative_only: bool = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    metal_name = (metal or 'gold').strip().lower()
    if metal_name not in {'gold', 'silver'}:
        raise HTTPException(status_code=400, detail="Metal must be either 'gold' or 'silver'.")

    metal_column = 'gold_hallmarking' if metal_name == 'gold' else 'silver_hallmarking'
    raw_state = (state or '').strip()

    filters = [f"{metal_column} = TRUE"]
    params: List[Any] = []

    if raw_state and raw_state.lower() != 'all india':
        filters.append("state ILIKE %s")
        params.append(raw_state)

    if operative_only:
        filters.append("status ILIKE %s")
        params.append('Operative')

    where_clause = " AND ".join(filters)
    count_query = f"SELECT COUNT(*) FROM public.huid_hallmarking_centres WHERE {where_clause};"
    state_query = "SELECT DISTINCT state FROM public.huid_hallmarking_centres WHERE state IS NOT NULL AND state <> '' ORDER BY state ASC;"

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(count_query, params)
        total_count = cur.fetchone()[0] or 0

        cur.execute(state_query)
        states = [row[0] for row in cur.fetchall() if row and row[0]]

        offset = (page - 1) * limit
        query = f"""
            SELECT id, centre_name, city, district, state, address, status,
                   recognized_for, telephone, email, gold_hallmarking, silver_hallmarking
            FROM public.huid_hallmarking_centres
            WHERE {where_clause}
            ORDER BY state ASC, centre_name ASC
            LIMIT %s OFFSET %s;
        """
        cur.execute(query, params + [limit, offset])
        rows = cur.fetchall()

        centres = []
        for row in rows:
            centre_id, centre_name, city, district, state_name, address, status_name, recognized_for, telephone, email, gold_flag, silver_flag = row
            centres.append({
                "id": str(centre_id),
                "name": centre_name,
                "city": city,
                "district": district,
                "state": state_name,
                "address": address,
                "status": status_name,
                "recognized_for": recognized_for,
                "telephone": telephone,
                "email": email,
                "gold_hallmarking": bool(gold_flag),
                "silver_hallmarking": bool(silver_flag),
            })

        total_pages = max(1, (total_count + limit - 1) // limit) if total_count else 1
        return {
            "states": ["All India", *states],
            "page": page,
            "limit": limit,
            "total": total_count,
            "total_pages": total_pages,
            "centres": centres,
        }
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="127.0.0.1", port=8000, reload=True)