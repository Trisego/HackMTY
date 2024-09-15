from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim
import numpy as np
import openai

client = openai.OpenAI(
    api_key="-",
    base_url="http://198.145.126.109:8080/v1"
)


embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

documents = [
    "The cat sits outside",
    "A man is playing guitar",
    "I love pasta",
    "The new movie is awesome",
    "The cat plays in the garden",
    "A woman watches TV",
    "The new movie is so great",
    "Do you like pizza?",
]

document_embeddings = embedding_model.encode(documents)

def retrieve_documents(query, document_embeddings, documents, top_n=2):
    query_embedding = embedding_model.encode([query])
    
    similarities = cos_sim(query_embedding, document_embeddings)
    
    top_indices = np.argsort(similarities[0])[::-1][:top_n]
    
    top_documents = [documents[i] for i in top_indices]
    return top_documents


def generate_response(query, relevant_docs):
    prompt = f"Query: {query}\n\nRelevant Documents:\n" + "\n".join(relevant_docs) + "\n\nResponse:"
    
    response = client.chat.completions.create(
        model="tgi",
        prompt = prompt,
        stream=False,
        max_tokens=150
    )

    return response.choices[0].text.strip()

query = "Tell me about the new movie."

# Retrieve relevant documents
relevant_docs = retrieve_documents(query, document_embeddings, documents)

# Generate a response
response = generate_response(query, relevant_docs)

print("Relevant Documents:")
for doc in relevant_docs:
    print(doc)

print("\nGenerated Response:")
print(response)