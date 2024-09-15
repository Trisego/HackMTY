import os
from openai import OpenAI
import openai

client = OpenAI(
    api_key="-",
    base_url="http://198.145.126.109:8080/v1"
)

response = client.chat.completions.create(
    model="tgi",
    messages=[
        {"role": "system", "content": "Tell me a short story in less than 50 words"}
    ],
    stream=False
)

text = (response.choices[0].message.content)
print(text)