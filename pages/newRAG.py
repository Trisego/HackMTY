from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim
import numpy as np
import openai
import streamlit as st
import pandas as pd
import faiss


part_number = 6
name = "John"
interest = "Cars"
subject = "Substraction"


parts = []

client = openai.OpenAI(
    api_key="-",
    base_url="http://198.145.126.109:8080/v1"
)
# Declare a list with parts
parts = []
#Create a dataframe with the info to train the gpt model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
ta = pd.read_excel(r"C:\Users\hansv\Downloads\PromptDataBases (2).xlsx")
st.dataframe(ta)
stories = []
#Add this data into the list
for i in range(1, 4):
    for j in range(1,6):
        stories.append(ta.at[i,j])
# Save these into embeddings
story_embeddings = embedding_model.encode(stories)
story_embeddings = np.array(story_embeddings).astype('float32')
index = faiss.IndexFlatL2(story_embeddings.shape[1])
index.add(story_embeddings)

question = f"""Give me a {subject} problem for {name}, he is intermediate in {subject} and likes {interest}. 
Make it have a similar structure of the following data, don't explain the process or give answers nor title, instead write them as [answer a,b,c].
a, b, and c are differente possible answers. The correct answer should always be a. b and c are wrong. 
Use sequential adverbs, like "First...", "then...", "Finally..."
Divide it into {parts} parts, just tell me the first part in less than 50 words and more than 20. Then the next, and so forth."""

question_embedding = embedding_model.encode(question).reshape(1,-1)

# Determine the distances to the vector in cosine angle
distances = []
for vector in story_embeddings:
    distances.append(cos_sim(question_embedding, vector))
    st.write(cos_sim(question_embedding, vector))
distances, indices = index.search(question_embedding, k=3)
similar_sentences = [stories[idx] for idx in indices[0]]
question_made = question.join(similar_sentences)


print(similar_sentences)

response = client.chat.completions.create(
        model="tgi",
        messages=[{"role": "system", "content": question_made}],
        stream=False, 
        temperature=0.8,
    )
ans = response.choices[0].message.content
parts.append(ans)




print("Part 1")
print(ans)
#st.write(f"part Number {part_number}")

# Follow up with the next parts
for i in range(1,part_number):
    st.write(f"Part {i+1}")
    question = f"""Follow up with the {subject} problem for {name}, he is intermediate {subject} and likes {interest}. Follow the story of {ans}.
    Make it have a similar structure to the following data, don't explain the process or give answers, instead save them as [answer 1,2,3].
    It is divided into {part_number} and this is part {i+1}. Just write the part {i+1}, not the next one. Less than 50 words."""
    prompt = question+(parts[i-1])
    
    response = client.chat.completions.create(
        model="tgi",
        messages=[{"role": "system", "content": prompt}],
        stream=False, 
        temperature=0.8,
    )
    parts.append(response.choices[0].message.content)
    print(parts[i])

print("The end")