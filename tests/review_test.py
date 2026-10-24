from fastapi.testclient import TestClient
from ProofMarkAI.main import app
from routes import review_routes

client = TestClient(app)


def test_review_endpoint(monkeypatch):

    def mock_review_content(request):
        return {"findings": []}

    monkeypatch.setattr(
        review_routes,
        "review_content",
        mock_review_content
    )

    payload = {
        "draft_content": "Our product guarantees 100% success.",
        "brand_guidelines": [
            {
                "id": "BG001",
                "rule": "Avoid exaggerated claims."
            }
        ],
        "approved_facts": [
            {
                "id": "FACT001",
                "fact": "Product success rate is 85%."
            }
        ]
    }

    response = client.post("/review/", json=payload)

    assert response.status_code == 200
    assert response.json() == {"findings": []}