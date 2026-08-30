import requests
import os

# 1. Automatically find your PDF in the pdfs folder
pdf_files = [f for f in os.listdir("pdfs") if f.endswith(".pdf")]
if not pdf_files:
    print("No PDF found in the pdfs/ folder to test with!")
    exit()

test_file_path = f"pdfs/{pdf_files[0]}"

# 2. Set up our API call
url = "http://127.0.0.1:8000/chat/multimodal"
data = {
    "session_id": "vision_test_1",
    "message": "I am attaching a BIS standard document. What is the IS number and title printed on it?"
}

print(f"Uploading '{test_file_path}' to your FastAPI server...")
print("Gemini is reading the document... please wait a few seconds...\n")

# 3. Send the file WITH the correct MIME type
with open(test_file_path, "rb") as file_data:
    # THIS IS THE FIX: We explicitly tell the server it is an application/pdf
    files = {"file": ("document.pdf", file_data, "application/pdf")}
    response = requests.post(url, data=data, files=files)

# 4. Print the AI's response
if response.status_code == 200:
    result = response.json()
    print("=== MULTIMODAL AI RESPONSE ===")
    print(result["response"])
    print(f"\nCitations found: {len(result['citations'])}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)