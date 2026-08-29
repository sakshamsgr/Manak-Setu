import json
import chromadb

# 1. Connect to ChromaDB
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# 2. Reset the collection
try:
    chroma_client.delete_collection("bis_standards")
except Exception:
    pass

collection = chroma_client.create_collection(name="bis_standards")

# 3. Load the OCR chunks
with open("output/bis_chunks_ocr.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

documents = [c["text"] for c in chunks]
metadatas = [{"standard_id": c["standard_id"], "page_number": c["page_number"]} for c in chunks]
ids = [c["chunk_id"] for c in chunks]

# 4. Embed and store
print("Storing OCR chunks into ChromaDB...")
collection.add(
    documents=documents,
    metadatas=metadatas,
    ids=ids
)

print(f"Success! {collection.count()} chunks stored in ChromaDB.")