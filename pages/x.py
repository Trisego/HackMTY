import streamlit as st
from openai import OpenAI
import openai

client = OpenAI(
    api_key="-",
    base_url="http://198.145.126.109:8080/v1"
)

subject = st.selectbox("Enter subject for the story", ("Math", "Physics", "H"))
age = st.text_input("Enter age")
name = st.text_input("Enter name")

def get_completion(prompt):
    response = client.chat.completions.create(
        model="tgi",
        messages=[{"role": "system", "content": prompt}],
        stream=False
    )
    return response.choices[0].message.content

if subject and age and name:
    
    prompt1 = f"You are a teacher of {subject}. Trying to teach the subject to a student of {age} years old, you tell your student, whose name is {name}, a story that solves a problem of the subject in three steps in less than 50 words each. The story should not contain interactions with {name} and the character be named {name}. For now, just write me the first step, without title or your introduction, straight to the story."
    text = get_completion(prompt1)

    st.write(text)
    st.divider()

    prompt2 = f"Now the second step of the previous story: {text}. Less than 70 words."
    text2 = get_completion(prompt2)
    st.write(text2)
    st.divider()
        
    
    prompt3 = f"Now the final step of the previous story: {text2}."
    text3 = get_completion(prompt3)
    st.write(text3)

