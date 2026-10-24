from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GENAI_API_KEY"))

for model in client.models.list():
    if "generateContent" in (model.supported_actions or []):
        print(model.name)