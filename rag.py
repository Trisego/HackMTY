from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
import openai
from openai import OpenAI
import os
import getpass

client = OpenAI(
     api_key="-",
     base_url="http://198.145.126.109:8080/v1"
)

loader = PyPDFLoader(file_path=r"C:\Users\hansv\Downloads\Prompt Training.pdf")
pages = loader.load_and_split()



faiss_index = FAISS.from_documents(pages, OpenAIEmbeddings(client=client))

# Perform a similarity search on the indexed documents
query = "How will the community be engaged?"
docs = faiss_index.similarity_search(query, k=2)

# Print the results
for doc in docs:
    print(str(doc.metadata["page"]) + ":", doc.page_content[:300])




# from langchain_community.document_loaders import PyPDFLoader

# loader = PyPDFLoader(file_path=r"C:\Users\hansv\Downloads\Prompt Training.pdf")
# data = loader.load()
# data


# pages = loader.load_and_split()
###
# """ from langchain_community.vectorstores import FAISS
# from langchain.embeddings import OpenAIEmbeddings
# from langchain_objectbox.vectorstores import ObjectBox
# from openai import OpenAI
# from langchain_text_splitters import RecursiveCharacterTextSplitter


# import openai

# client = OpenAI(
#     api_key="-",
#     base_url="http://198.145.126.109:8080/v1"
# )

# try:
#     with open(r"C:\Users\hansv\Downloads\Prompt Training.pdf", 'rb') as f:
#         print("File opened successfully!")
# except FileNotFoundError:
#     print("File not found. Check the file path.")
#     exit()
# except Exception as e:
#     print(f"An error occurred: {e}")
#     exit()

# loader = PyPDFLoader(file_path=r"C:\Users\hansv\Downloads\Prompt Training.pdf")
# pages = loader.load_and_split()

# #embeddings = OpenAIEmbeddings(openai_api_key=client.api_key)

# #vector_store = FAISS.from_documents(pages, embeddings)


# full_text = "\n".join(pages)

# response = client.chat.completions.create(
#     model="tgi",  
#     prompt=f"Summarize the following text:\n\n{full_text}",
#     max_tokens=1500,  
#     api_key="-",
#     base_url="http://198.145.126.109:8080/v1"
# )

# print("Summary of the PDF content:")
# print(response.choices[0].text.strip()) """