from transformers import pipeline

pipe = pipeline("text-generation", model="mosaicml/mpt-7b-storywriter", trust_remote_code=True)