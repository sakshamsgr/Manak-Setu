#!/usr/bin/env python3
"""Dry-run A&H city/district resolution for BIS centres.

This script keeps the original BIS address untouched, validates districts against a
local administrative reference, groups by state+pincode, and creates a review CSV
without modifying Supabase.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path=str(Path(__file__).resolve().parents[1] / ".env"))

TABLE_NAME = "public.huid_hallmarking_centres"
ROOT_DIR = Path(__file__).resolve().parents[1]
REVIEW_CSV_PATH = ROOT_DIR / "ahc_location_review_v2.csv"
SUMMARY_CSV_PATH = ROOT_DIR / "ahc_location_summary_v2.csv"
PINCODE_CACHE_PATH = ROOT_DIR / "ahc_pincode_cache.json"

DB_URI = os.getenv("DB_URI") or os.getenv("DATABASE_URL") or (
    "postgresql://postgres.ndpfmlkhxjphooyzvdxk:sih_2026_sssddr@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
)

STATE_ALIASES = {
    "ANDHRA PRADESH": {"ANDHRA PRADESH", "ANDHRA", "AP", "A.P."},
    "ARUNACHAL PRADESH": {"ARUNACHAL PRADESH", "ARUNACHAL", "AR"},
    "ASSAM": {"ASSAM", "AS"},
    "BIHAR": {"BIHAR", "BR"},
    "CHHATTISGARH": {"CHHATTISGARH", "CG"},
    "DELHI": {"DELHI", "DL"},
    "GOA": {"GOA", "GA"},
    "GUJARAT": {"GUJARAT", "GJ"},
    "HARYANA": {"HARYANA", "HR"},
    "HIMACHAL PRADESH": {"HIMACHAL PRADESH", "HP"},
    "JHARKHAND": {"JHARKHAND", "JH"},
    "KARNATAKA": {"KARNATAKA", "KA"},
    "KERALA": {"KERALA", "KL"},
    "MADHYA PRADESH": {"MADHYA PRADESH", "MP"},
    "MAHARASHTRA": {"MAHARASHTRA", "MH"},
    "MANIPUR": {"MANIPUR", "MN"},
    "MEGHALAYA": {"MEGHALAYA", "ML"},
    "MIZORAM": {"MIZORAM", "MZ"},
    "NAGALAND": {"NAGALAND", "NL"},
    "ODISHA": {"ODISHA", "OR"},
    "PUNJAB": {"PUNJAB", "PB"},
    "RAJASTHAN": {"RAJASTHAN", "RJ"},
    "SIKKIM": {"SIKKIM", "SK"},
    "TAMIL NADU": {"TAMIL NADU", "TN"},
    "TELANGANA": {"TELANGANA", "TS", "TELANGANA STATE"},
    "TRIPURA": {"TRIPURA", "TR"},
    "UTTAR PRADESH": {"UTTAR PRADESH", "UP"},
    "UTTARAKHAND": {"UTTARAKHAND", "UK"},
    "WEST BENGAL": {"WEST BENGAL", "WB"},
    "JAMMU AND KASHMIR": {"JAMMU AND KASHMIR", "J&K", "JK"},
    "LADAKH": {"LADAKH", "LA"},
    "PUDUCHERRY": {"PUDUCHERRY", "PY"},
    "ANDAMAN AND NICOBAR ISLANDS": {"ANDAMAN AND NICOBAR ISLANDS", "A&N"},
    "CHANDIGARH": {"CHANDIGARH", "CH"},
    "HARYANA": {"HARYANA", "HR"},
    "DADRA AND NAGAR HAVELI AND DAMAN AND DIU": {"DADRA AND NAGAR HAVELI AND DAMAN AND DIU", "DNHDD"},
}

NOISE_TOKENS = {
    "AND", "THE", "CENTRE", "CENTER", "CITIZEN", "HALLMARKING", "HALLMARK",
    "OFFICE", "SHOP", "STREET", "ROAD", "RD", "MAIN", "LOCALITY", "AREA",
    "NEAR", "OPP", "OPPOSITE", "BUILDING", "TOWER", "MARKET", "NO", "WARD",
    "DOOR", "FLAT", "HOUSE", "GROUND", "FIRST", "SECOND", "THIRD", "FLOOR",
    "BESIDE", "BEHIND", "APPARTMENT", "PARA", "PLOT", "GATE", "GOVERNORPET",
    "MALL", "NAGAR", "BAZAAR", "BAZAR", "CITY", "STATE", "DISTRICT", "DIST",
    "DISTT", "PANCHAYAT", "COLONY", "COMPLEX", "SOCIETY", "SCHOOL", "HOSPITAL",
    "PALACE", "CHOWK", "SARAFA", "SARAFA", "GPO", "GP O", "GPO.", "GOVT",
    "MARKET", "INDUSTRIAL", "INDUSTRIALAREA", "AREA", "CLUB", "AGENCY", "JUNCTION",
    "KUA", "KUCCHA", "KHASRA", "MARG", "BHAWAN", "KUES", "KUE", "BASAR",
    "GALLI", "ROADWAY", "COLONY", "THIRD FLOOR",
}


def normalize_name(value: Any) -> str:
    if value is None:
        return ""
    text = str(value)
    text = text.replace("-", " ")
    text = text.replace(".", " ")
    text = text.replace("/", " ")
    text = re.sub(r"\s+", " ", text.strip())
    text = re.sub(r"\s+", " ", text.upper())
    text = re.sub(r"\s+DISTRICT$", "", text)
    text = re.sub(r"\s+DIST\.?$", "", text)
    text = re.sub(r"\s+DISTT\.?$", "", text)
    text = re.sub(r"\s+CITY$", "", text)
    text = re.sub(r"\s+TOWN$", "", text)
    text = re.sub(r"\s+.*?\)$", "", text)
    text = re.sub(r"[^A-Z0-9 &-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.strip()


DISTRICT_REFERENCE: Dict[str, set[str]] = {
    "ANDHRA PRADESH": {
        "ANANTHAPURAM", "CHITTOOR", "EAST GODAVARI", "GUNTUR", "KADAPA", "KRISHNA",
        "KURNOOL", "MANYAM", "NTR", "PRAKASAM", "SRIKAKULAM", "VISAKHAPATNAM",
        "VIZIANAGARAM", "WEST GODAVARI", "PALNAD", "ALLURI SITHARAMA RAJU",
        "BRAMHAPURI", "DR. B.R. AMBEDKAR KONASEEMA",
    },
    "ASSAM": {
        "BAKSA", "BARPETA", "BISWANATH", "BONGAIGAON", "CACHAR", "CHARAIDEO",
        "CHIRANG", "DARRANG", "DHUBRI", "DIBRUGARH", "DIMA HASAO", "GOALPARA",
        "GOLAGHAT", "HAILAKANDI", "HOJAI", "JORHAT", "KAMRUP", "KAMRUP METROPOLITAN",
        "KARIMGANJ", "KOKRAJHAR", "LAKHIMPUR", "MAJULI", "MARIGAON", "NAGAON",
        "NALBARI", "SIVASAGAR", "SONITPUR", "SOUTH SALMARA-MANKACHAR", "TINSUKIA",
        "UDALGURI", "WEST KARBI ANGLONG", "KARBI ANGLONG",
    },
    "DELHI": {
        "CENTRAL DELHI", "EAST DELHI", "NEW DELHI", "NORTH DELHI", "NORTH EAST DELHI",
        "NORTH WEST DELHI", "SHAHDARA", "SOUTH DELHI", "SOUTH EAST DELHI",
        "SOUTH WEST DELHI", "WEST DELHI",
    },
    "MADHYA PRADESH": {
        "AGAR MALWA", "ALIRAJPUR", "ANUPPUR", "ASHOKNAGAR", "BALAGHAT", "BARWANI",
        "BETUL", "BHIND", "BHOPAL", "BURHANPUR", "CHHATARPUR", "CHHINDWARA",
        "DAMOH", "DATIA", "DEWAS", "DHAR", "DINDORI", "GUNA", "GWALIOR", "HARDA",
        "INDORE", "JABALPUR", "JHABUA", "KATNI", "KHANDWA", "KHARGONE", "MANDLA",
        "MANDSAUR", "MORENA", "NARSINGHPUR", "NEEMUCH", "PANNA", "RAISEN", "RAJGARH",
        "RATLAM", "REWA", "SAGAR", "SATNA", "SEHORE", "SEONI", "SHAJAPUR", "SHEOPUR",
        "SHIVPURI", "SIDHI", "SINGRAULI", "TIKAMGARH", "UJJAIN", "UMARIA", "VIDISHA",
    },
    "RAJASTHAN": {
        "AJMER", "ALWAR", "ANUPGARH", "BANSWARA", "BARAN", "BARMER", "BEAWAR", "BHARATPUR",
        "BHILWARA", "BIKANER", "BUNDI", "CHITTAURGARH", "CHURU", "DAUSA", "DHOLPUR",
        "DUNGARPUR", "GANGANAGAR", "HANUMANGARH", "JAIPUR", "JAISALMER", "JALORE",
        "JHALAWAR", "JHUNJHUNU", "JODHPUR", "KARAULI", "KOTA", "NAGAUR", "PALI",
        "PILANI", "RAJSAMAND", "SAWAI MADHOPUR", "SIKAR", "SIROHI", "SRIGANGANAGAR",
        "TONK", "UDAIPUR",
    },
    "UTTAR PRADESH": {
        "AGRA", "ALIGARH", "ALLAHABAD", "AMBEDKAR NAGAR", "AMETHI", "AMROHA", "AURAIYA",
        "AZAMGARH", "BAGHPAT", "BAHRAICH", "BALLIA", "BALRAMPUR", "BANDA", "BARABANKI",
        "BAREILLY", "BASTI", "BIJNOR", "BUDAUN", "BULANDSHAHR", "CHANDAULI", "CHITRAKOOT",
        "DEORIA", "ETAH", "ETAWAH", "FAIZABAD", "FARRUKHABAD", "FATEHPUR", "GAUTAM BUDDHA NAGAR",
        "GHAZIABAD", "GHAZIPUR", "GONDA", "GORAKHPUR", "HAMIRPUR", "HARDOI", "JALAUN",
        "JAUNPUR", "JHANSI", "KANNAUJ", "KANPUR DEHAT", "KANPUR NAGAR", "KASGANJ",
        "KAUSHAMBI", "KHERI", "KUSHINAGAR", "LALITPUR", "LUCKNOW", "MAHARAJGANJ", "MAHOBA",
        "MAINPURI", "MATHURA", "MAU", "MEERUT", "MIRZAPUR", "MORADABAD", "MUZAFFARNAGAR",
        "PILIBHIT", "PRATAPGARH", "RAE BARELI", "RAMPUR", "SAHARANPUR", "SAMBHAL",
        "SANT KABIR NAGAR", "SHAHJAHANPUR", "SHAMLI", "SHRAWASTI", "SIDDHARTH NAGAR",
        "SITAPUR", "SONBHADRA", "SULTANPUR", "UNNAO", "VARANASI",
    },
    "GUJARAT": {
        "AHMEDABAD", "AMRELI", "ANAND", "ARAVALLI", "BANASKANTHA", "BHARUCH", "BHAVNAGAR",
        "BOTAD", "CHHOTAUDEPUR", "DEVBHUMI DWARKA", "DOHAD", "GANDHINAGAR", "GIR SOMNATH",
        "JAMNAGAR", "JUNAGADH", "KACHCHH", "KHEDA", "MAHISAGAR", "MEHSANA", "MORBI",
        "NARMADA", "NAVSARI", "PANCH MAHALS", "PATAN", "PORBANDAR", "RAJKOT", "SABARKANTHA",
        "SURAT", "SURENDRANAGAR", "TAPI", "VADODARA", "VALSAD",
    },
    "KARNATAKA": {
        "BAGALKOT", "BALLARI", "BELAGAVI", "BENGALURU URBAN", "BENGALURU RURAL", "BIDAR",
        "CHAMARAJANAGAR", "CHIKKABALLAPUR", "CHIKKAMAGALURU", "CHITRADURGA", "DAKSHINA KANNADA",
        "DAVANGERE", "DHARWAD", "GADAG", "HASSAN", "HAVERI", "KALABURAGI", "KODAGU",
        "KOLAR", "KOPPAL", "MANDYA", "MYSURU", "RAICHUR", "RAMANAGARA", "SHIVAMOGGA",
        "TUMAKURU", "UDUPI", "UTTARA KANNADA", "VIJAYAPURA", "YADGIR",
    },
    "KERALA": {
        "ALAPPUZHA", "ERNAKULAM", "IDUKKI", "KANNUR", "KASARAGOD", "KOLLAM", "KOTTAYAM",
        "KOZHIKODE", "MALAPPURAM", "PALAKKAD", "PATHANAMTHITTA", "THIRUVANANTHAPURAM",
        "THRISSUR", "WAYANAD",
    },
    "MAHARASHTRA": {
        "AHMEDNAGAR", "AKOLA", "AMRAVATI", "BEED", "BHANDARA", "BHUSAWAL", "CHANDRAPUR",
        "DHULE", "GADCHIROLI", "GONDIA", "HINGOLI", "JALGAON", "JALNA", "KOLHAPUR",
        "LATUR", "MUMBAI CITY", "MUMBAI SUBURBAN", "NAGPUR", "NANDURBAR", "NASHIK",
        "PALGHAR", "PARBHANI", "PUNE", "RAIGAD", "RATNAGIRI", "SANGLI", "SATARA",
        "SINDHUDURG", "SOLAPUR", "THANE", "WARDHA", "WASHIM", "YAVATMAL",
    },
    "TAMIL NADU": {
        "ARIYALUR", "CHENNAI", "COIMBATORE", "CUDDALORE", "DHARMAPURI", "DINDIGUL",
        "ERODE", "KALLAKURICHI", "KANCHEEPURAM", "KANNIYAKUMARI", "KARUR", "KRISHNAGIRI",
        "MADURAI", "MAYILADUTHURAI", "NAGAPATTINAM", "NAMAKKAL", "PERAMBALUR", "PUDUKKOTTAI",
        "RAMANATHAPURAM", "RANIPET", "SALEM", "SIVAGANGA", "TIRUPATHUR", "TIRUPPUR",
        "TIRUCHIRAPPALLI", "TIRUNELVELI", "TIRUVANNAMALAI", "TUTICORIN", "VELLORE",
        "VILUPPURAM", "VIRUDHUNAGAR",
    },
    "TELANGANA": {
        "ADILABAD", "BHADRADRI KOTHAGUDEM", "HYDERABAD", "JAGTIAL", "JANGOAN", "JAYASHANKAR BHUPALPALLY",
        "JOGULAMBA GADWAL", "KAMAREDDY", "KARIMNAGAR", "KHAMMAM", "KOMARAM BHEEM ASIFABAD",
        "MAHABUBABAD", "MAHABUBNAGAR", "MANCHERIAL", "MEDAK", "MEDCHAL-MALKAJGIRI", "MULUGU",
        "NAGARKURNOOL", "NARAYANPET", "NIRMAL", "NIZAMABAD", "PEDDAPALLI", "RAJANNA SIRCILLA",
        "RANGAREDDY", "SANGAREDDY", "SIDDIPET", "SURYAPET", "VIKARABAD", "WANAPARTHY",
        "YADADRI BHUVANAGIRI",
    },
    "WEST BENGAL": {
        "ALIPURDUAR", "BANKURA", "BIRBHUM", "COOCHBEHAR", "DARJEELING", "DAKSHIN DINAJPUR",
        "HOOGHLY", "HOWRAH", "JALPAIGURI", "JHARGRAM", "KALIMPONG", "KOLKATA", "MALDA",
        "MURSHIDABAD", "NADIA", "NORTH 24 PARGANAS", "PASCHIM BARDHAMAN", "PASCHIM MEDINIPUR",
        "PURBA BARDHAMAN", "PURBA MEDINIPUR", "PURULIA", "SOUTH 24 PARGANAS", "UTTAR DINAJPUR",
    },
    "BIHAR": {
        "ARARIA", "ARWAL", "AURANGABAD", "BANKA", "BEGUSARAI", "BHAGALPUR", "BHOJPUR",
        "BUXAR", "CHAPRA", "DARBHANGA", "EAST CHAMPARAN", "GAYA", "GOPALGANJ", "JAMUI",
        "JEHANABAD", "KAIMUR", "KATIHAR", "KHAGARIA", "KISHANGANJ", "LAKHISARAI",
        "MADHEPURA", "MADHUBANI", "MUNGER", "MUZAFFARPUR", "NAWADA", "PASHCHIM CHAMPARAN",
        "PATNA", "PURBI CHAMPARAN", "PURNIA", "ROHTAS", "SAHARSA", "SAMASTIPUR",
        "SARAN", "SHEIKHPURA", "SHEOHAR", "SITAMARHI", "SIWAN", "SUPAUL", "VAISHALI",
    },
    "KARNATAKA": {
        "BAGALKOT", "BALLARI", "BELAGAVI", "BENGALURU URBAN", "BENGALURU RURAL", "BIDAR",
        "CHAMARAJANAGAR", "CHIKKABALLAPUR", "CHIKKAMAGALURU", "CHITRADURGA", "DAKSHINA KANNADA",
        "DAVANGERE", "DHARWAD", "GADAG", "HASSAN", "HAVERI", "KALABURAGI", "KODAGU",
        "KOLAR", "KOPPAL", "MANDYA", "MYSURU", "RAICHUR", "RAMANAGARA", "SHIVAMOGGA",
        "TUMAKURU", "UDUPI", "UTTARA KANNADA", "VIJAYAPURA", "YADGIR",
    },
    "PUNJAB": {"AMRITSAR", "BARNALA", "BATHINDA", "FARIDKOT", "FATEHGARH SAHIB", "FAZILKA", "GURDASPUR", "HOSHIARPUR", "JALANDHAR", "KAPURTHALA", "LUDHIANA", "MANSA", "MOGA", "MUKTSAR", "NAWANSHAHR", "PATHANKOT", "PATIALA", "ROPAR", "SANGRUR", "TARN TARAN"},
    "UTTARAKHAND": {"ALMORA", "BAGESHWAR", "CHAMOLI", "CHAMPAWAT", "DEHRADUN", "HARIDWAR", "NAINITAL", "PAURI GARHWAL", "PITHORAGARH", "RUDRAPRAYAG", "TEHRI GARHWAL", "UDHAM SINGH NAGAR", "UTTARKASHI"},
    "ODISHA": {"ANGUL", "BALASORE", "BARGARH", "BHADRAK", "BOUDH", "CUTTACK", "DEOGARH", "DHENKANAL", "GAJAPATI", "GANJAM", "JAGATSINGHPUR", "JAJPUR", "JHARSUGUDA", "KALAHANDI", "KANDHAMAL", "KENDRAPARA", "KENDUJHAR", "KHORDHA", "MALKANGIRI", "MAYURBHANJ", "NABARANGPUR", "NAYAGARH", "NUAPADA", "PURI", "RAYAGADA", "SAMBALPUR", "SONEPUR", "SUNDARGARH"},
    "TAMIL NADU": {"ARIYALUR", "CHENNAI", "COIMBATORE", "CUDDALORE", "DHARMAPURI", "DINDIGUL", "ERODE", "KALLAKURICHI", "KANCHEEPURAM", "KANNIYAKUMARI", "KARUR", "KRISHNAGIRI", "MADURAI", "MAYILADUTHURAI", "NAGAPATTINAM", "NAMAKKAL", "PERAMBALUR", "PUDUKKOTTAI", "RAMANATHAPURAM", "RANIPET", "SALEM", "SIVAGANGA", "TIRUPATHUR", "TIRUPPUR", "TIRUCHIRAPPALLI", "TIRUNELVELI", "TIRUVANNAMALI", "TUTICORIN", "VELLORE", "VILUPPURAM", "VIRUDHUNAGAR"},
    "HARYANA": {"AMBALA", "BHIWANI", "CHARKHI DADRI", "FARIDABAD", "FATEHABAD", "GURUGRAM", "HISAR", "JHAJJAR", "JIND", "KAITHAL", "KARNAL", "KURUKSHETRA", "MAHENDRAGARH", "NUH", "PALWAL", "PANCHKULA", "PANIPAT", "REWARI", "ROHTAK", "SIRSA", "SONEPAT", "YAMUNANAGAR"},
    "JAMMU AND KASHMIR": {"ANANTNAG", "BANDIPORA", "BARAMULLA", "BUDGAM", "DODA", "GANDERBAL", "JAMMU", "KATHUA", "KISHTWAR", "KULGAM", "KUPWARA", "POONCH", "PULWAMA", "RAJOURI", "RAMBAN", "REASI", "SAMBA", "SHOPIAN", "SRINAGAR", "UDHAMPUR"},
    "LADAKH": {"KARGIL", "LEH"},
    "PUDUCHERRY": {"KARAIKAL", "MAHE", "PUDUCHERRY", "YANAM"},
}

for state, district_set in list(DISTRICT_REFERENCE.items()):
    normalized = {normalize_name(x) for x in district_set}
    DISTRICT_REFERENCE[state] = {normalize_name(x) for x in district_set}

def canonical_state_name(raw_state: Optional[str]) -> str:
    if not raw_state:
        return ""
    raw = normalize_name(raw_state)
    for canonical, aliases in STATE_ALIASES.items():
        if raw == normalize_name(canonical):
            return canonical
        if raw in {normalize_name(a) for a in aliases}:
            return canonical
    return raw.title()


def normalize_pincode(value: Any) -> Optional[str]:
    if value is None:
        return None
    digits = re.sub(r"[^0-9]", "", str(value))
    return digits if len(digits) == 6 else None


def state_pincode_key(state: Optional[str], pincode: Any) -> Tuple[str, str]:
    return canonical_state_name(state), normalize_pincode(pincode) or ""


def load_pincode_cache() -> Dict[str, Dict[str, str]]:
    if not PINCODE_CACHE_PATH.exists():
        return {}
    try:
        with PINCODE_CACHE_PATH.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_pincode_cache(cache: Dict[str, Dict[str, str]]) -> None:
    with PINCODE_CACHE_PATH.open("w", encoding="utf-8") as fh:
        json.dump(cache, fh, ensure_ascii=False, indent=2, sort_keys=True)


def load_rows(conn: psycopg2.extensions.connection) -> List[Dict[str, Any]]:
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT id, sl_no, centre_name, address, state, pincode, city, district
        FROM {TABLE_NAME}
        WHERE city IS NULL OR district IS NULL
        ORDER BY sl_no;
        """
    )
    columns = [desc[0] for desc in cur.description]
    rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    cur.close()
    return rows


def split_address_tokens(address: str) -> List[str]:
    if not address:
        return []
    text = address.replace("/", ",").replace(";", ",")
    text = text.replace("- ", " ")
    text = text.replace("(AP)", "")
    text = re.sub(r"\s+", " ", text.strip())
    parts = [part.strip() for part in text.split(",")]
    cleaned: List[str] = []
    for part in parts:
        part = re.sub(r"\s+", " ", part).strip()
        if part:
            cleaned.append(part)
    return cleaned


def guess_explicit_district(address: str, state: str) -> Optional[str]:
    state_key = canonical_state_name(state)
    text = normalize_name(address)
    pattern = r"(?:DISTRICT|DISTT|DIST\.|DISTT\.|DIST)\s*[:.,\s-]*([A-Z0-9 &/-]+)"
    matches = re.findall(pattern, text, flags=re.I)
    if matches:
        for item in matches:
            candidate = normalize_name(item)
            if candidate and valid_district(state_key, candidate):
                return candidate
            if candidate and candidate.upper() in {"DELHI", "ANDHRA PRADESH", "ASSAM"}:
                continue
    tokens = split_address_tokens(address)
    for token in tokens:
        candidate = normalize_name(token)
        if valid_district(state_key, candidate):
            return candidate
    return None


def valid_district(state: str, district: Any) -> bool:
    if not district:
        return False
    d = normalize_name(district)
    if not d or d in {"", "STATE", "DISTRICT"}:
        return False
    if d in NOISE_TOKENS:
        return False
    ref = DISTRICT_REFERENCE.get(canonical_state_name(state), set())
    if d in ref:
        return True
    # allow prefix forms like "NORTH DELHI" => "NORTH DELHI" already in ref
    for item in ref:
        if d == item:
            return True
    return False


def strip_noise_prefix(token: str) -> str:
    token = normalize_name(token)
    token = re.sub(r"^(NEAR|OPP|OPPOSITE|BEHIND|BESIDE|OFF|VIA)\s+", "", token)
    token = re.sub(r"^(?:NO\.|NO|SHOP NO|DOOR NO|WARD NO)\s+", "", token)
    return token


def split_compound_location_token(token: str, state: str) -> List[str]:
    value = normalize_name(token)
    if not value:
        return []
    candidates: List[str] = []
    matches = [normalize_name(item) for item in DISTRICT_REFERENCE.get(state, set())]
    matches += [normalize_name(item) for item in STATE_ALIASES.get(state, set())]
    matches = sorted({m for m in matches if m and m not in NOISE_TOKENS}, key=len, reverse=True)
    for match in matches:
        if match in value:
            left, right = value.split(match, 1)
            if left.strip():
                candidates.append(left.strip())
            if right.strip():
                candidates.append(right.strip())
            return [c for c in candidates if c]
    return [value]


def is_noise_city(token: str) -> bool:
    token = normalize_name(token)
    if not token:
        return True
    if token in NOISE_TOKENS:
        return True
    if re.search(r"\b(?:ROAD|STREET|MARKET|BAZAR|CHOWK|SARAFA|NAGAR|COLONY|AREA|MARG|PARA|GATE|TOWER|SHOP|NO|WARD)\b", token, flags=re.I):
        return True
    if re.fullmatch(r"\d+", token):
        return True
    return False


def candidate_city_from_address(address: str, district: Optional[str], state: str) -> Optional[str]:
    tokens = split_address_tokens(address)
    if not tokens:
        return None
    district_norm = normalize_name(district) if district else ""
    seen = set()
    for idx, token in enumerate(tokens):
        value = strip_noise_prefix(token)
        raw_parts = split_compound_location_token(value, state)
        for part in raw_parts:
            if not part or part in seen:
                continue
            seen.add(part)
            part = normalize_name(part)
            if not part or part == district_norm:
                continue
            if part == normalize_name(state):
                continue
            if is_noise_city(part):
                continue
            if district_norm and idx > 0:
                prev = normalize_name(tokens[idx - 1])
                if prev == district_norm:
                    return part
            if district_norm and idx + 1 < len(tokens):
                nxt = normalize_name(tokens[idx + 1])
                if nxt == district_norm:
                    return part
            if not district_norm:
                return part
    for token in reversed(tokens):
        raw_parts = split_compound_location_token(token, state)
        for part in raw_parts:
            part = normalize_name(part)
            if not part or part == normalize_name(state):
                continue
            if is_noise_city(part):
                continue
            if district_norm and part == district_norm:
                continue
            return part
    return None


def maybe_pincode_lookup(pincode: Optional[str]) -> Dict[str, str]:
    if not pincode:
        return {}
    cache = load_pincode_cache()
    if pincode in cache:
        return cache[pincode]

    service_url = os.getenv("PINCODE_LOOKUP_URL") or os.getenv("PINCODE_SERVICE_URL")
    if not service_url:
        return {}

    try:
        import requests
    except Exception:
        return {}

    try:
        url = service_url.format(pincode=pincode)
        r = requests.get(url, timeout=8)
        r.raise_for_status()
        payload = r.json()
        if isinstance(payload, dict):
            city = payload.get("city") or payload.get("town") or payload.get("place") or ""
            district = payload.get("district") or payload.get("district_name") or payload.get("sub_district") or ""
            result = {"city": str(city).strip(), "district": str(district).strip()}
            cache[pincode] = result
            save_pincode_cache(cache)
            return result
    except Exception:
        pass
    return {}


def infer_record(row: Dict[str, Any]) -> Dict[str, Any]:
    state = canonical_state_name(row.get("state"))
    pincode = normalize_pincode(row.get("pincode"))
    address = row.get("address") or ""

    evidence: List[str] = []
    explicit_district = guess_explicit_district(address, state)
    district_candidate = explicit_district
    if explicit_district:
        evidence.append("explicit DISTRICT/DISTT marker in address")

    pincode_lookup = maybe_pincode_lookup(pincode)
    pincode_district = normalize_name(pincode_lookup.get("district"))
    pincode_city = normalize_name(pincode_lookup.get("city"))
    if pincode_district:
        evidence.append(f"pincode lookup: {pincode_district}")

    if district_candidate is None and pincode_district and valid_district(state, pincode_district):
        district_candidate = pincode_district
        evidence.append("district matches pin-derived postal district")

    if district_candidate is None:
        for token in split_address_tokens(address):
            candidate = normalize_name(token)
            if candidate and valid_district(state, candidate):
                district_candidate = candidate
                evidence.append(f"address token matches state district reference: {candidate}")
                break

    if district_candidate is None:
        district_candidate = ""

    city_candidate = None
    if explicit_district:
        city_candidate = candidate_city_from_address(address, explicit_district, state) or None
        if city_candidate:
            evidence.append(f"city inferred from district-adjacent address token: {city_candidate}")
    elif district_candidate:
        city_candidate = candidate_city_from_address(address, district_candidate, state) or None
        if city_candidate:
            evidence.append(f"city inferred from district-adjacent address token: {city_candidate}")

    if city_candidate is None and pincode_city:
        city_candidate = pincode_city
        evidence.append(f"pincode lookup city fallback: {city_candidate}")

    conflict = False
    if pincode_district and district_candidate and normalize_name(pincode_district) != normalize_name(district_candidate):
        conflict = True
        evidence.append("conflicting district evidence between address and pincode")

    if pincode_city and city_candidate and normalize_name(pincode_city) != normalize_name(city_candidate):
        conflict = True
        evidence.append("conflicting city evidence between address and pincode")

    if not district_candidate:
        confidence_score = 0.1
        confidence_level = "LOW"
        evidence_text = "; ".join(evidence) if evidence else "No valid district in address or pincode lookup"
        needs_review = True
        return {
            "id": row.get("id"),
            "sl_no": row.get("sl_no"),
            "centre_name": row.get("centre_name"),
            "address": row.get("address"),
            "state": state,
            "pincode": pincode,
            "proposed_city": None,
            "proposed_district": None,
            "confidence_level": confidence_level,
            "confidence_score": round(confidence_score, 2),
            "evidence": evidence_text,
            "needs_review": True,
            "conflict": conflict,
        }

    if city_candidate is None:
        confidence_score = 0.55
        confidence_level = "MEDIUM"
        evidence_text = "; ".join(evidence) if evidence else "District identified but city remains uncertain"
        needs_review = True
        return {
            "id": row.get("id"),
            "sl_no": row.get("sl_no"),
            "centre_name": row.get("centre_name"),
            "address": row.get("address"),
            "state": state,
            "pincode": pincode,
            "proposed_city": None,
            "proposed_district": district_candidate,
            "confidence_level": confidence_level,
            "confidence_score": round(confidence_score, 2),
            "evidence": evidence_text,
            "needs_review": True,
            "conflict": conflict,
        }

    # Stronger positive evidence for explicit district markers and pincode agreement.
    score = 0.0
    if explicit_district:
        score += 0.55
    if district_candidate and valid_district(state, district_candidate):
        score += 0.2
    if pincode_district and normalize_name(pincode_district) == normalize_name(district_candidate):
        score += 0.15
    if city_candidate and not is_noise_city(city_candidate):
        score += 0.08
    if conflict:
        score -= 0.35

    if score >= 0.8 and not conflict:
        confidence_level = "HIGH"
        needs_review = False
    elif score >= 0.5:
        confidence_level = "MEDIUM"
        needs_review = True
    else:
        confidence_level = "LOW"
        needs_review = True

    evidence_text = "; ".join(evidence) if evidence else "Address contains district and city references but no strong validation signal"
    return {
        "id": row.get("id"),
        "sl_no": row.get("sl_no"),
        "centre_name": row.get("centre_name"),
        "address": row.get("address"),
        "state": state,
        "pincode": pincode,
        "proposed_city": city_candidate,
        "proposed_district": district_candidate,
        "confidence_level": confidence_level,
        "confidence_score": round(max(0.0, min(1.0, score)), 2),
        "evidence": evidence_text,
        "needs_review": needs_review,
        "conflict": conflict,
    }


def build_summary_csv(rows: Sequence[Dict[str, Any]], output_path: Path) -> None:
    groups: Dict[Tuple[str, str, str, str], int] = defaultdict(int)
    for row in rows:
        key = (
            str(row.get("state") or ""),
            str(row.get("pincode") or ""),
            str(row.get("proposed_district") or ""),
            str(row.get("proposed_city") or ""),
        )
        groups[key] += 1

    with output_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["state", "pincode", "proposed_district", "proposed_city", "count"])
        for (state, pincode, district, city), count in sorted(groups.items()):
            writer.writerow([state, pincode, district, city, count])


def write_review_csv(rows: Sequence[Dict[str, Any]], output_path: Path) -> None:
    fieldnames = [
        "id",
        "sl_no",
        "centre_name",
        "address",
        "state",
        "pincode",
        "proposed_city",
        "proposed_district",
        "confidence_level",
        "confidence_score",
        "evidence",
        "needs_review",
    ]
    with output_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "id": row.get("id"),
                "sl_no": row.get("sl_no"),
                "centre_name": row.get("centre_name"),
                "address": row.get("address"),
                "state": row.get("state"),
                "pincode": row.get("pincode"),
                "proposed_city": row.get("proposed_city"),
                "proposed_district": row.get("proposed_district"),
                "confidence_level": row.get("confidence_level"),
                "confidence_score": row.get("confidence_score"),
                "evidence": row.get("evidence"),
                "needs_review": row.get("needs_review"),
            })


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Resolve A&H city and district values in dry-run mode.")
    parser.add_argument("--apply", action="store_true", help="Not enabled in this version. The tool remains dry-run only.")
    parser.add_argument("--limit", type=int, default=None, help="Optional row limit for local testing.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    conn = psycopg2.connect(DB_URI)
    try:
        rows = load_rows(conn)
        if args.limit is not None:
            rows = rows[: args.limit]

        state_pincode_groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
        for row in rows:
            state_pincode_groups[state_pincode_key(row.get("state"), row.get("pincode"))].append(row)

        resolved: List[Dict[str, Any]] = []
        for group in state_pincode_groups.values():
            for row in group:
                resolved.append(infer_record(row))

        write_review_csv(resolved, REVIEW_CSV_PATH)
        build_summary_csv(resolved, SUMMARY_CSV_PATH)

        total = len(resolved)
        unique_pincodes = len({r.get("pincode") for r in resolved if r.get("pincode")})
        high = sum(1 for r in resolved if r.get("confidence_level") == "HIGH")
        medium = sum(1 for r in resolved if r.get("confidence_level") == "MEDIUM")
        low = sum(1 for r in resolved if r.get("confidence_level") == "LOW")
        conflicting = sum(1 for r in resolved if bool(r.get("conflict")))
        no_match = sum(1 for r in resolved if r.get("proposed_district") is None)

        print("Total records:", total)
        print("Unique pincodes:", unique_pincodes)
        print("High confidence:", high)
        print("Medium confidence:", medium)
        print("Low confidence:", low)
        print("Conflicting evidence:", conflicting)
        print("No match:", no_match)
        print("Dry run only. No Supabase changes were made.")
        print(f"Review CSV written to: {REVIEW_CSV_PATH}")
        print(f"Summary CSV written to: {SUMMARY_CSV_PATH}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
