from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GENAI_API_KEY")
)

response = client.models.generate_content(
    model="gemini-3.1-flash-lite",
    contents="Explain brand governance in one sentence."
)

print(response.text)