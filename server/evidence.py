import json
import logging
import os
import re
import unicodedata
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal
from urllib.error import URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError


class Evidence(BaseModel):
    id: str
    title: str
    kind: Literal["grammy", "popup", "tour"]
    category: str
    record: str
    source: str
    url: str
    event_date: date | None
    verified_on: date
    aliases: list[str] = Field(default_factory=list, exclude=True)


columns = "id,title,kind,category,record,source,url,event_date,verified_on,aliases"
log = logging.getLogger(__name__)
project_url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
secret_key = os.environ.get("SUPABASE_SECRET_KEY", "").strip()
local_records = [
    Evidence.model_validate(row)
    for row in json.loads(Path(__file__).with_name("evidence.json").read_text(encoding="utf-8-sig"))
]

if project_url or secret_key:
    address = urlsplit(project_url)
    if (
        address.scheme != "https" or not (address.hostname or "").endswith(".supabase.co")
        or address.netloc != address.hostname or address.path or address.query or address.fragment
        or not secret_key.startswith("sb_secret_")
    ):
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SECRET_KEY together.")


def load_evidence(*, limit: int = 1000, **filters: str) -> list[Evidence]:
    if not project_url:
        return [row for row in local_records if all(getattr(row, key) == value[3:] for key, value in filters.items())][:limit]

    query = urlencode({"select": columns, "order": "event_date.asc.nullslast,id.asc", "limit": limit, **filters})
    request = Request(f"{project_url}/rest/v1/bts_evidence?{query}", headers={"apikey": secret_key})
    try:
        with urlopen(request, timeout=6) as response:
            return [Evidence.model_validate(row) for row in json.load(response)]
    except (URLError, OSError, ValueError, ValidationError) as error:
        log.warning("Supabase evidence request failed (%s)", type(error).__name__)
        raise HTTPException(status_code=503, detail="근거 자료에 일시적으로 연결할 수 없습니다.") from None


def retrieve(question: str) -> list[Evidence]:
    query = unicodedata.normalize("NFKC", question).casefold()
    if any(term in query for term in ("빌보드", "billboard", "차트", "군복무", "군 복무", "가사", "티켓", "예매", "ticket")):
        return []

    evidence_id = re.fullmatch(r"(?:g|now|tour)-\d+", query)
    if evidence_id:
        return load_evidence(id="eq." + query.upper())

    if any(term in query for term in ("팝업", "pop-up", "popup")):
        kind = "popup"
    elif any(term in query for term in ("투어", "tour", "콘서트 일정")):
        kind = "tour"
    elif any(term in query for term in ("그래미", "grammy", "후보", "수상", "nominat", "주요 성과")):
        kind = "grammy"
    else:
        return []

    records = load_evidence(kind="eq." + kind)
    matched = [row for row in records if any(alias in query for alias in row.aliases)]
    if matched:
        records = matched
    elif kind == "popup" and not re.fullmatch(r"(?:bts\s*)?(?:공식\s*)?(?:팝업(?:스토어)?|pop-?up)(?:\s*(?:일정(?:은|이)?|공지|언제|알려줘))*[?？.! ]*", query):
        return []
    elif kind == "tour" and not re.fullmatch(r"(?:(?:bts|다음|아리랑|arirang|공식|예정된)\s*)*(?:월드\s*)?(?:투어|콘서트)\s*(?:공연\s*)?일정(?:은|이)?(?:\s*(?:언제|알려줘))?[?？.! ]*", query):
        return []

    if kind == "tour" and any(term in query for term in ("다음", "예정", "앞으로")):
        today = datetime.now(timezone(timedelta(hours=9))).date()
        records = [row for row in records if row.event_date is not None and row.event_date >= today]
    return records[:8]
