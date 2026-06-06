import os
import shutil
import tempfile
import time
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scanner import scan_file

app = FastAPI(title="SecretScanner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Finding(BaseModel):
    type: str
    value: str
    method: str
    confidence: str
    line: Optional[int] = None
    description: Optional[str] = None


class ScanResponse(BaseModel):
    results: List[Finding]
    risk_score: int
    total_secrets: int
    high_confidence: int
    medium_confidence: int
    scan_time_ms: float
    lines_scanned: int


def _compute_risk_score(results: list) -> int:
    high = sum(1 for r in results if r["confidence"] == "HIGH")
    medium = sum(1 for r in results if r["confidence"] == "MEDIUM")
    raw = high * 22 + medium * 8
    return min(100, raw)


def _to_finding(raw: dict) -> Finding:
    return Finding(
        type=raw.get("type", "UNKNOWN"),
        value=raw.get("value", ""),
        method=raw.get("method", "regex"),
        confidence=raw.get("confidence", "MEDIUM"),
        line=raw.get("line"),
        description=raw.get("description"),
    )


@app.post("/scan", response_model=ScanResponse)
async def scan(
    request: Request,
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    # Fall back to JSON body when neither multipart field is present
    if not file and not text:
        try:
            body = await request.json()
            text = body.get("text")
        except Exception:
            pass

    if not file and not text:
        raise HTTPException(status_code=400, detail="Provide a file upload or raw text.")

    t0 = time.perf_counter()
    tmp_path: Optional[str] = None

    try:
        if file:
            suffix = os.path.splitext(file.filename or "")[1] or ".txt"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = tmp.name
        else:
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=".txt", mode="w", encoding="utf-8"
            ) as tmp:
                tmp.write(text or "")
                tmp_path = tmp.name

        with open(tmp_path, "r", encoding="utf-8", errors="replace") as fh:
            content = fh.read()
        lines_scanned = len(content.splitlines())

        print("DEBUG FILE CONTENT:")
        print(content)

        results: list[dict] = scan_file(tmp_path)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    high_count = sum(1 for r in results if r.get("confidence") == "HIGH")
    medium_count = sum(1 for r in results if r.get("confidence") == "MEDIUM")

    return ScanResponse(
        results=[_to_finding(r) for r in results],
        risk_score=_compute_risk_score(results),
        total_secrets=len(results),
        high_confidence=high_count,
        medium_confidence=medium_count,
        scan_time_ms=round(elapsed_ms, 2),
        lines_scanned=lines_scanned,
    )


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
