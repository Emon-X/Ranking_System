import asyncio
import os
import sys
import httpx

BACKEND_URL = os.environ["BACKEND_URL"]
INTERNAL_SECRET = os.environ["INTERNAL_SYNC_SECRET"]

_ATCODER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://atcoder.jp/",
}
_INTERNAL_HEADERS = {"x-internal-secret": INTERNAL_SECRET}


async def fetch_handles(client: httpx.AsyncClient) -> list[str]:
    resp = await client.get(f"{BACKEND_URL}/internal/atcoder-handles", headers=_INTERNAL_HEADERS)
    resp.raise_for_status()
    data = resp.json()
    return data.get("handles", [])


async def fetch_rating(client: httpx.AsyncClient, handle: str) -> tuple[str, float]:
    handle = handle.strip()
    if not handle:
        return handle, 0.0
    try:
        resp = await client.get(f"https://atcoder.jp/users/{handle}/history/json")
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and data:
            return handle, float(data[-1].get("NewRating", 0.0))
    except Exception as e:
        print(f"[WARN] failed for {handle}: {e}", file=sys.stderr)
    return handle, 0.0


async def main():
    # প্রথমে backend থেকে বর্তমান handle list আনি
    async with httpx.AsyncClient(timeout=30.0) as client:
        handles = await fetch_handles(client)

    if not handles:
        print("No AtCoder handles found. Exiting.")
        return

    print(f"Found {len(handles)} handles: {handles}")

    # তারপর AtCoder থেকে rating fetch করি
    async with httpx.AsyncClient(timeout=30.0, headers=_ATCODER_HEADERS, follow_redirects=True) as client:
        results = await asyncio.gather(*(fetch_rating(client, h) for h in handles))

    payload = {handle: rating for handle, rating in results}
    print(f"Fetched ratings: {payload}")

    # শেষে backend-এ push করি
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/internal/atcoder-ratings",
            json=payload,
            headers=_INTERNAL_HEADERS,
        )
        print(f"Backend response: {resp.status_code} {resp.text}")
        resp.raise_for_status()


if __name__ == "__main__":
    asyncio.run(main())