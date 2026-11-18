import json
import os
import secrets
import unicodedata
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse
from fastapi.security import HTTPBasic
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parent.parent
app = FastAPI(title="BTS TRIO API", version="0.1.0")
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


class Evidence(BaseModel):
    id: str
    song: str
    ceremony: int
    category: str
    record: str
    source: str
    url: str


class SearchRequest(BaseModel):
    question: str = Field(min_length=1, max_length=300)


class SearchResult(BaseModel):
    answer: str
    evidence: list[Evidence]


records = [
    Evidence.model_validate(record)
    for record in json.loads((ROOT / "server" / "evidence.json").read_text(encoding="utf-8-sig"))
]
by_id = {record.id: record for record in records}
song_aliases = {"G-01": ("dynamite", "다이너마이트"), "G-02": ("butter", "버터")}
award_terms = ("그래미", "grammy", "후보", "수상", "nominat", "best pop duo")
other_topics = ("빌보드", "billboard", "차트", "chart", "투어", "tour", "군 복무", "군복무", "복귀", "공연", "performed", "발매", "release", "가사", "lyric", "작사", "작곡", "멤버")


def retrieve(question: str) -> list[Evidence]:
    query = unicodedata.normalize("NFKC", question).casefold()
    if any(term in query for term in other_topics):
        return []

    selected = [record for record in records if any(alias in query for alias in song_aliases[record.id])]
    asks_about_awards = any(term in query for term in award_terms)
    if selected and asks_about_awards:
        return selected
    if asks_about_awards or "주요 성과" in query:
        return records
    return []


@app.post("/api/search", response_model=SearchResult)
def search(payload: SearchRequest) -> SearchResult:
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="질문을 입력해 주세요.")
    found = retrieve(question)
    if not found:
        return SearchResult(
            answer="현재 연결된 자료에서 질문에 답할 근거를 찾지 못했습니다. 그래미 후보 기록을 질문해 보세요.",
            evidence=[],
        )

    lines = ["현재 연결된 Recording Academy 검증 기록입니다."]
    for item in found:
        lines.append(
            f"‘{item.song}’은 제{item.ceremony}회 그래미 {item.category} 부문에서 "
            f"{item.record} [{item.id}]"
        )
    return SearchResult(answer="\n".join(lines), evidence=found)


@app.get("/api/evidence/{evidence_id}", response_model=Evidence)
def get_evidence(evidence_id: str) -> Evidence:
    record = by_id.get(evidence_id.upper())
    if record is None:
        raise HTTPException(status_code=404, detail="등록된 근거를 찾을 수 없습니다.")
    return record


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


if (ROOT / "dist").is_dir():
    app.mount("/", StaticFiles(directory=ROOT / "dist", html=True), name="frontend")


