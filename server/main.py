import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse
from fastapi.security import HTTPBasic
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from .evidence import Evidence, load_evidence, project_url, retrieve


ROOT = Path(__file__).resolve().parent.parent
@asynccontextmanager
async def lifespan(app: FastAPI):
    if project_url and not await run_in_threadpool(load_evidence, limit=1):
        raise RuntimeError("Supabase is connected, but bts_evidence has no rows.")
    yield


app = FastAPI(title="BTS TRIO API", version="0.1.0", lifespan=lifespan)
preview_password = os.environ.get("BTS_TRIO_PREVIEW_PASSWORD", "").strip()
if os.environ.get("BTS_TRIO_REQUIRE_PREVIEW_PASSWORD") == "1" and not preview_password:
    raise RuntimeError("Set BTS_TRIO_PREVIEW_PASSWORD before starting the hosted preview.")
if preview_password and not preview_password.isascii():
    raise RuntimeError("BTS_TRIO_PREVIEW_PASSWORD must use ASCII characters.")

if preview_password:
    preview_auth = HTTPBasic(auto_error=False, realm="BTS TRIO Preview")

    @app.middleware("http")
    async def protect_preview(request: Request, call_next):
        if request.method == "GET" and request.url.path == "/api/health":
            return await call_next(request)

        try:
            credentials = await preview_auth(request)
        except HTTPException:
            credentials = None
        if credentials is None or not (
            secrets.compare_digest(credentials.username, "team")
            & secrets.compare_digest(credentials.password, preview_password)
        ):
            return PlainTextResponse(
                "BTS TRIO team preview. Sign in to continue.",
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="BTS TRIO Preview"', "Cache-Control": "no-store"},
            )

        response = await call_next(request)
        response.headers["Cache-Control"] = "private, no-store"
        return response


class SearchRequest(BaseModel):
    question: str = Field(min_length=1, max_length=300)


class SearchResult(BaseModel):
    answer: str
    evidence: list[Evidence]


@app.post("/api/search", response_model=SearchResult)
def search(payload: SearchRequest) -> SearchResult:
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="질문을 입력해 주세요.")
    found = retrieve(question)
    if not found:
        return SearchResult(
            answer="현재 연결된 자료에서 이 질문에 답할 근거를 찾지 못했습니다.",
            evidence=[],
        )

    lines = ["등록된 공식 자료에서 찾은 기록입니다."]
    for item in found:
        lines.append(f"{item.record} [{item.id}]")
    return SearchResult(answer="\n".join(lines), evidence=found)


@app.get("/api/evidence/{evidence_id}", response_model=Evidence)
def get_evidence(evidence_id: str) -> Evidence:
    if not evidence_id.isascii() or not evidence_id.replace("-", "").isalnum() or len(evidence_id) > 36:
        raise HTTPException(status_code=404, detail="등록된 근거를 찾을 수 없습니다.")
    record = next(iter(load_evidence(id="eq." + evidence_id.upper())), None)
    if record is None:
        raise HTTPException(status_code=404, detail="등록된 근거를 찾을 수 없습니다.")
    return record


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "evidence_source": "supabase" if project_url else "local"}


if (ROOT / "dist").is_dir():
    app.mount("/", StaticFiles(directory=ROOT / "dist", html=True), name="frontend")
