from fastapi import FastAPI

from ProofMarkAI.routes.review_routes import router


app = FastAPI(
    title="ProofMark AI",
    description="Brand governance review API",
    version="1.0.0",
)
app.include_router(router)


@app.get("/", tags=["Health"])
def home() -> dict[str, str]:
    return {"message": "ProofMark AI is running"}