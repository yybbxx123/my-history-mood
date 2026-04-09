import os
from typing import Any

from supabase import Client, create_client


def _is_configured() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"))


_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is not None:
        return _client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("Supabase 未配置：缺少 SUPABASE_URL / SUPABASE_KEY")

    _client = create_client(url, key)
    return _client


def fetch_figures() -> list[dict[str, Any]]:
    if not _is_configured():
        return []

    sb = get_supabase()
    res = sb.table("figures").select("name,era,traits,summary").order("name").execute()
    rows = res.data or []
    return [
        {
            "name": r["name"],
            "era": r["era"],
            "traits": r.get("traits") or [],
            "summary": r.get("summary") or "",
        }
        for r in rows
    ]

