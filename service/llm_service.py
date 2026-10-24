import json
import os
import time
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import errors

from ProofMarkAI.schema.review_schema import ReviewResponse

load_dotenv()

MODEL_NAME = os.getenv(
    "GENAI_MODEL", "gemini-3.1-flash-lite"
).strip()

MAX_ATTEMPTS = 2


def _get_client() -> genai.Client:
    api_key = os.getenv("GENAI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GENAI_API_KEY is not configured."
        )

    return genai.Client(api_key=api_key)


def _parse_response(response: Any) -> ReviewResponse:
    """
    Parse Gemini's JSON response and validate
    it against the Pydantic ReviewResponse schema.
    """

    # Use parsed structured output when available
    parsed = getattr(response, "parsed", None)

    if isinstance(parsed, ReviewResponse):
        return parsed

    if parsed is not None:
        return ReviewResponse.model_validate(parsed)

    response_text = getattr(response, "text", None)

    if not response_text or not response_text.strip():
        raise ValueError(
            "Gemini returned an empty response."
        )

    try:
        payload = json.loads(response_text)

    except json.JSONDecodeError as exc:
        raise ValueError(
            "Gemini returned invalid JSON."
        ) from exc

    return ReviewResponse.model_validate(payload)


def generate_review(prompt: str) -> ReviewResponse:
    """
    Generate a structured brand-governance review
    using Gemini.
    """

    if not prompt or not prompt.strip():
        raise ValueError(
            "Review prompt cannot be empty."
        )

    client = _get_client()

    for attempt in range(MAX_ATTEMPTS):

        try:
            start_time = time.perf_counter()

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ReviewResponse,
                    "temperature": 0.1,
                    "max_output_tokens": 2048,
                },
            )

            elapsed = time.perf_counter() - start_time

            print(
                f"Gemini response time: {elapsed:.2f} seconds"
            )

            return _parse_response(response)

        except errors.ServerError as exc:

            if attempt == MAX_ATTEMPTS - 1:
                raise RuntimeError(
                    "AI review service is temporarily unavailable."
                ) from exc

            time.sleep(2 ** attempt)

        except errors.ClientError as exc:
            raise RuntimeError(
                f"Gemini API request failed: {exc}"
            ) from exc

    raise RuntimeError(
        "AI review generation failed."
    )