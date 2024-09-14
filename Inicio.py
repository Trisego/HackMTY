import streamlit as st
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("mosaicml/mpt-7b-storywriter", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("mosaicml/mpt-7b-storywriter", trust_remote_code=True)

st.write("ghjkl")
st.write("ghjk")