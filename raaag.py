from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
import openai
import os

load_dotenv()

client = openai.OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="http://198.145.126.109:8080/v1"
)

pdf = PdfReader(r"C:\Users\hansv\Downloads\Prompt Training.pdf")
text = ""

for page in pdf.pages:
    text += page.extract_text()

text_splitter = CharacterTextSplitter(
    separator = "\n",  
    chunk_size = 1000,
    chunk_overlap = 200,
    length_function = len
)

chunks = text_splitter.split_text(text)

embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"), base_url="http://198.145.126.109:8080/v1")
knowledge_base = FAISS.from_texts(chunks, embeddings)

print(knowledge_base)