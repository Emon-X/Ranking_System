import asyncio
from datetime import datetime, timedelta, timezone
import os
import sys
from typing import Any
import httpx

BACKEND_URL = os.environ["BACKEND_URL"].rstrip("/")
INTERNAL_SECRET = os.environ["INTERNAL_SYNC_SECRET"]

_INTERNAL_HEADERS = {"x-internal-secret": INTERNAL_SECRET}

_CF_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}

_ATCODER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://atcoder.jp/",
    "Accept": "application/json, text/plain, */*",
}

# Strict 1 request per 2 seconds rate-limiting semaphores
_CF_SEMAPHORE = asyncio.Semaphore(1)
_AC_SEMAPHORE = asyncio.Semaphore(1)


def _utc_cutoff_timestamp(days: int = 7) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return int(cutoff.timestamp())


async def fetch_participants(client: httpx.AsyncClient) -> list[dict]:
    resp = await client.get(f"{BACKEND_URL}/internal/participants", headers=_INTERNAL_HEADERS)
    resp.raise_for_status()
    data = resp.json()
    return data.get("participants", [])


async def fetch_cf_rating(client: httpx.AsyncClient, handle: str) -> float:
    handle = handle.strip()
    if not handle:
        return 0.0
    async with _CF_SEMAPHORE:
        await asyncio.sleep(2.0)
        for attempt in range(3):
            try:
                resp = await client.get(f"https://codeforces.com/api/user.info?handles={handle}", headers=_CF_HEADERS)
                if resp.status_code in (429, 503, 403):
                    await asyncio.sleep(2.0 * (attempt + 1))
                    continue
                resp.raise_for_status()
                data = resp.json()
                if data.get("status") == "OK" and data.get("result"):
                    return float(data["result"][0].get("rating", 0.0) or 0.0)
            except Exception as e:
                if attempt == 2:
                    print(f"[WARN] CF rating failed for {handle}: {e}", file=sys.stderr)
                await asyncio.sleep(2.0 * (attempt + 1))
    return 0.0


async def fetch_cf_solved_7d(client: httpx.AsyncClient, handle: str) -> int:
    handle = handle.strip()
    if not handle:
        return 0
    cutoff_ts = _utc_cutoff_timestamp(7)
    async with _CF_SEMAPHORE:
        await asyncio.sleep(2.0)
        for attempt in range(3):
            try:
                resp = await client.get(
                    f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=1000",
                    headers=_CF_HEADERS,
                )
                if resp.status_code in (429, 503, 403):
                    await asyncio.sleep(2.0 * (attempt + 1))
                    continue
                resp.raise_for_status()
                data = resp.json()
                if data.get("status") == "OK" and data.get("result"):
                    solved = set()
                    for sub in data["result"]:
                        if sub.get("verdict") == "OK" and int(sub.get("creationTimeSeconds", 0)) >= cutoff_ts:
                            prob = sub.get("problem", {})
                            c_id = prob.get("contestId")
                            idx = prob.get("index")
                            name = prob.get("name") or ""
                            solved.add(f"{c_id}:{idx}:{name}")
                    return len(solved)
            except Exception as e:
                if attempt == 2:
                    print(f"[WARN] CF solves failed for {handle}: {e}", file=sys.stderr)
                await asyncio.sleep(2.0 * (attempt + 1))
    return 0


async def fetch_ac_rating(client: httpx.AsyncClient, handle: str) -> float:
    handle = handle.strip()
    if not handle:
        return 0.0
    async with _AC_SEMAPHORE:
        await asyncio.sleep(2.0)
        for attempt in range(3):
            try:
                resp = await client.get(f"https://atcoder.jp/users/{handle}/history/json", headers=_ATCODER_HEADERS)
                if resp.status_code in (429, 503, 403):
                    await asyncio.sleep(2.0 * (attempt + 1))
                    continue
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list) and data:
                    return float(data[-1].get("NewRating", 0.0) or 0.0)
            except Exception as e:
                if attempt == 2:
                    print(f"[WARN] AtCoder rating failed for {handle}: {e}", file=sys.stderr)
                await asyncio.sleep(2.0 * (attempt + 1))
    return 0.0


async def fetch_ac_solved_7d(client: httpx.AsyncClient, handle: str) -> int:
    handle = handle.strip()
    if not handle:
        return 0
    cutoff_ts = _utc_cutoff_timestamp(7)
    async with _AC_SEMAPHORE:
        await asyncio.sleep(2.0)
        for attempt in range(3):
            try:
                resp = await client.get(
                    f"https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user={handle}&from_second={cutoff_ts}",
                    headers=_ATCODER_HEADERS,
                )
                if resp.status_code in (429, 503, 403):
                    await asyncio.sleep(2.0 * (attempt + 1))
                    continue
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list):
                    solved = set()
                    for sub in data:
                        if sub.get("result") == "AC" and int(sub.get("epoch_second", 0)) >= cutoff_ts:
                            p_id = sub.get("problem_id")
                            if p_id:
                                solved.add(p_id)
                    return len(solved)
            except Exception as e:
                if attempt == 2:
                    print(f"[WARN] AtCoder solves failed for {handle}: {e}", file=sys.stderr)
                await asyncio.sleep(2.0 * (attempt + 1))
    return 0


async def process_participant(client: httpx.AsyncClient, p: dict) -> dict[str, Any]:
    p_id = p["id"]
    cf_handle = p.get("codeforces_handle") or ""
    ac_handle = p.get("atcoder_handle") or ""

    cf_rating = 0.0
    cf_solved = 0
    ac_rating = 0.0
    ac_solved = 0

    if cf_handle:
        cf_rating = await fetch_cf_rating(client, cf_handle)
        cf_solved = await fetch_cf_solved_7d(client, cf_handle)

    if ac_handle:
        ac_rating = await fetch_ac_rating(client, ac_handle)
        ac_solved = await fetch_ac_solved_7d(client, ac_handle)

    return {
        "id": p_id,
        "codeforces_rating": cf_rating,
        "codeforces_solved_last_7_days": cf_solved,
        "atcoder_rating": ac_rating,
        "atcoder_solved_last_7_days": ac_solved,
    }


async def main():
    print(f"Connecting to backend: {BACKEND_URL}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        participants = await fetch_participants(client)

    if not participants:
        print("No participants found. Exiting.")
        return

    print(f"Found {len(participants)} participants. Starting rate-limited sync...")

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        stats = await asyncio.gather(*(process_participant(client, p) for p in participants))

    print(f"Fetched stats for {len(stats)} participants.")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/internal/sync-stats",
            json={"stats": stats},
            headers=_INTERNAL_HEADERS,
        )
        print(f"Backend response: {resp.status_code} {resp.text}")
        resp.raise_for_status()

    print("Sync completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())