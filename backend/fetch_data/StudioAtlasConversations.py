"""
Atlas chat conversation persistence (Supabase Postgres) for Simulation Studio.

The browser calls these FastAPI routes on the Simulation Studio backend (not Next.js).
Supabase URL, anon key, and service role are read from the backend environment.

Database DDL: ``backend/supabase/studio_atlas_conversations.sql`` (run once in Supabase SQL editor).
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any, Callable, Optional, TypeVar

from dotenv import load_dotenv
from fastapi import APIRouter, Body, Header
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from supabase import create_client

load_dotenv()

router = APIRouter(prefix="/api/atlas-chat", tags=["atlas-chat"])

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
ID_RE = re.compile(r"^[0-9a-f-]{36}$", re.IGNORECASE)


class OwnerResolutionError(Exception):
    """Invalid/missing auth for conversation rows."""

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def _supabase_url() -> str:
    return (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).strip()


def _supabase_anon_key() -> str:
    return (
        os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or ""
    ).strip()


def _service_role_key() -> str:
    return (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()


def _resolve_owner_key(
    authorization: Optional[str],
    x_studio_owner_key: Optional[str],
) -> str:
    url = _supabase_url()
    anon = _supabase_anon_key()
    if not url or not anon:
        raise OwnerResolutionError(
            500,
            "Supabase env not configured on server "
            "(SUPABASE_URL and SUPABASE_ANON_KEY, or NEXT_PUBLIC_* equivalents)",
        )

    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        if token:
            sb = create_client(url, anon)
            try:
                res = sb.auth.get_user(token)
                uid = getattr(getattr(res, "user", None), "id", None)
                if uid:
                    return str(uid)
            except Exception:
                pass

    raw = (x_studio_owner_key or "").strip()
    if UUID_RE.match(raw):
        return raw.lower()

    raise OwnerResolutionError(
        401,
        "Missing owner: sign in or send x-studio-owner-key "
        "(UUID from Studio localStorage)",
    )


def _admin_client():
    url = _supabase_url()
    key = _service_role_key()
    if not url or not key:
        raise OwnerResolutionError(
            500,
            "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) "
            "or SUPABASE_SERVICE_ROLE_KEY",
        )
    return create_client(url, key)


def _pg_error(e: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error": e.message or "Database request failed",
            "code": e.code,
            "hint": e.hint,
        },
    )


def _owner_error(e: OwnerResolutionError) -> JSONResponse:
    return JSONResponse(
        status_code=e.status_code,
        content={"error": e.message},
    )


T = TypeVar("T")


async def _run_sync(fn: Callable[[], T]) -> T:
    return await run_in_threadpool(fn)


class CreateConversationBody(BaseModel):
    title: Optional[str] = None


class PatchConversationBody(BaseModel):
    title: Optional[str] = None
    ui_messages: Optional[Any] = None
    langgraph_history: Optional[Any] = None


def _list_sync(authorization: Optional[str], x_studio_owner_key: Optional[str]):
    owner = _resolve_owner_key(authorization, x_studio_owner_key)
    sb = _admin_client()
    res = (
        sb.table("studio_atlas_conversations")
        .select("id, title, created_at, updated_at")
        .eq("owner_key", owner)
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    )
    return res.data or []


def _create_sync(
    authorization: Optional[str],
    x_studio_owner_key: Optional[str],
    title: Optional[str],
):
    owner = _resolve_owner_key(authorization, x_studio_owner_key)
    sb = _admin_client()
    t = (title or "").strip() or "New conversation"
    t = t[:200]
    res = (
        sb.table("studio_atlas_conversations")
        .insert(
            {
                "owner_key": owner,
                "title": t,
                "langgraph_history": [],
                "ui_messages": [],
            }
        )
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise RuntimeError("Insert returned no row")
    return rows[0]["id"]


def _get_one_sync(
    authorization: Optional[str],
    x_studio_owner_key: Optional[str],
    conversation_id: str,
):
    owner = _resolve_owner_key(authorization, x_studio_owner_key)
    sb = _admin_client()
    res = (
        sb.table("studio_atlas_conversations")
        .select(
            "id, owner_key, title, langgraph_history, ui_messages, created_at, updated_at"
        )
        .eq("id", conversation_id)
        .eq("owner_key", owner)
        .maybe_single()
        .execute()
    )
    return res.data


def _patch_sync(
    authorization: Optional[str],
    x_studio_owner_key: Optional[str],
    conversation_id: str,
    body: PatchConversationBody,
):
    owner = _resolve_owner_key(authorization, x_studio_owner_key)
    sb = _admin_client()
    patch: dict[str, Any] = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if body.title is not None:
        patch["title"] = (body.title.strip()[:200] or "Conversation")
    if body.ui_messages is not None:
        patch["ui_messages"] = body.ui_messages
    if body.langgraph_history is not None:
        patch["langgraph_history"] = body.langgraph_history

    res = (
        sb.table("studio_atlas_conversations")
        .update(patch)
        .eq("id", conversation_id)
        .eq("owner_key", owner)
        .execute()
    )
    rows = res.data or []
    return len(rows) > 0


def _delete_sync(
    authorization: Optional[str],
    x_studio_owner_key: Optional[str],
    conversation_id: str,
):
    owner = _resolve_owner_key(authorization, x_studio_owner_key)
    sb = _admin_client()
    res = (
        sb.table("studio_atlas_conversations")
        .delete()
        .eq("id", conversation_id)
        .eq("owner_key", owner)
        .execute()
    )
    rows = res.data or []
    return len(rows) > 0


@router.get("/conversations")
async def list_conversations(
    authorization: Optional[str] = Header(None),
    x_studio_owner_key: Optional[str] = Header(None, alias="x-studio-owner-key"),
):
    try:
        rows = await _run_sync(lambda: _list_sync(authorization, x_studio_owner_key))
    except OwnerResolutionError as e:
        return _owner_error(e)
    except APIError as e:
        return _pg_error(e)
    return {"conversations": rows}


@router.post("/conversations")
async def create_conversation(
    authorization: Optional[str] = Header(None),
    x_studio_owner_key: Optional[str] = Header(None, alias="x-studio-owner-key"),
    body: CreateConversationBody = Body(default_factory=CreateConversationBody),
):
    try:
        title_arg = body.title
        cid = await _run_sync(
            lambda: _create_sync(authorization, x_studio_owner_key, title_arg)
        )
    except OwnerResolutionError as e:
        return _owner_error(e)
    except APIError as e:
        return _pg_error(e)
    except RuntimeError as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    return {"id": cid}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    authorization: Optional[str] = Header(None),
    x_studio_owner_key: Optional[str] = Header(None, alias="x-studio-owner-key"),
):
    if not ID_RE.match(conversation_id):
        return JSONResponse(status_code=400, content={"error": "Invalid id"})
    try:
        data = await _run_sync(
            lambda: _get_one_sync(
                authorization, x_studio_owner_key, conversation_id
            )
        )
    except OwnerResolutionError as e:
        return _owner_error(e)
    except APIError as e:
        return _pg_error(e)
    if not data:
        return JSONResponse(status_code=404, content={"error": "Not found"})
    return {"conversation": data}


@router.patch("/conversations/{conversation_id}")
async def patch_conversation(
    conversation_id: str,
    authorization: Optional[str] = Header(None),
    x_studio_owner_key: Optional[str] = Header(None, alias="x-studio-owner-key"),
    body: PatchConversationBody = Body(default_factory=PatchConversationBody),
):
    if not ID_RE.match(conversation_id):
        return JSONResponse(status_code=400, content={"error": "Invalid id"})
    try:
        ok = await _run_sync(
            lambda: _patch_sync(
                authorization, x_studio_owner_key, conversation_id, body
            )
        )
    except OwnerResolutionError as e:
        return _owner_error(e)
    except APIError as e:
        return _pg_error(e)
    if not ok:
        return JSONResponse(status_code=404, content={"error": "Not found"})
    return {"ok": True}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    authorization: Optional[str] = Header(None),
    x_studio_owner_key: Optional[str] = Header(None, alias="x-studio-owner-key"),
):
    if not ID_RE.match(conversation_id):
        return JSONResponse(status_code=400, content={"error": "Invalid id"})
    try:
        ok = await _run_sync(
            lambda: _delete_sync(
                authorization, x_studio_owner_key, conversation_id
            )
        )
    except OwnerResolutionError as e:
        return _owner_error(e)
    except APIError as e:
        return _pg_error(e)
    if not ok:
        return JSONResponse(status_code=404, content={"error": "Not found"})
    return {"ok": True}
