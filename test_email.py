import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

print(f"Attempting to send as: {SMTP_USERNAME}")

msg = MIMEText("This is a test OTP: 123456")
msg['Subject'] = 'Test BIS Authentication'
msg['From'] = SMTP_USERNAME
msg['To'] = SMTP_USERNAME # Sending to yourself to test

try:
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        print("Connected to Gmail server...")
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        print("Logged in successfully...")
        server.send_message(msg)
        print("✅ Success! Check your inbox.")
except Exception as e:
    print(f"❌ FAILED: {e}")