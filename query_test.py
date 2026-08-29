import chromadb

# 1. Connect to the existing Chroma database
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_collection(name="bis_standards")

# 2. Ask a question in plain English
query_text = "What cushioning materials are recommended for small household appliances?"

# 3. Search for the top 2 most relevant chunks
results = collection.query(
    query_texts=[query_text],
    n_results=2
)

# 4. Display the retrieved results with metadata citations
print("\n--- Search Results ---\n")
for i in range(len(results["documents"][0])):
    doc_text = results["documents"][0][i]
    meta = results["metadatas"][0][i]
    chunk_id = results["ids"][0][i]
    
    print(f"Result {i + 1}:")
    print(f"Standard ID : {meta['standard_id']}")
    print(f"Page Number : {meta['page_number']}")
    print(f"Chunk ID    : {chunk_id}")
    print(f"Text Snippet:\n{doc_text}\n")
    print("-" * 40)