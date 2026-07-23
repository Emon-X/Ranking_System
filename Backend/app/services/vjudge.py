from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse
import re

import httpx


class VJudgeScrapeError(RuntimeError):
	pass


@dataclass(slots=True)
class ScrapedContestant:
	position: int
	contestant: str
	vjudge_handle: str | None
	solves: int


@dataclass(slots=True)
class ScrapedContest:
	contest_url: str
	contest_name: str | None
	contestants: list[ScrapedContestant]


def _normalize_url(url: str) -> str:
	parsed = urlparse(url)
	if not parsed.scheme or not parsed.netloc:
		raise VJudgeScrapeError(f"Invalid contest URL: {url}")
	return url


def _extract_contest_id(url: str) -> int:
	normalized = _normalize_url(url)
	match = re.search(r"/contest/(\d+)", normalized)
	if not match:
		raise VJudgeScrapeError(f"Could not determine contest id from URL: {url}")
	return int(match.group(1))


def _format_display_name(participant: dict[str, Any]) -> str:
	name = str(participant.get("name") or "Unknown")
	nickname = str(participant.get("nickname") or "").strip()
	if nickname:
		return f"{name} ({nickname})"
	return name


def _to_seconds(value: int | float | None) -> int:
	if value is None:
		return 0
	return int(value)


def _build_standings(data: dict[str, Any], contest_url: str) -> ScrapedContest:
	participants = data.get("participants") or {}
	submissions = data.get("submissions") or []
	contest_length_seconds = _to_seconds(data.get("length")) // 1000

	solved_times_by_user: dict[int, dict[int, int]] = defaultdict(dict)

	for submission in submissions:
		if not isinstance(submission, list) or len(submission) < 4:
			continue

		user_id = int(submission[0])
		problem_index = int(submission[1])
		accepted = bool(submission[2])
		elapsed_seconds = _to_seconds(submission[3])

		if not accepted:
			continue
		if contest_length_seconds and elapsed_seconds > contest_length_seconds:
			continue

		problem_map = solved_times_by_user[user_id]
		previous_time = problem_map.get(problem_index)
		if previous_time is None or elapsed_seconds < previous_time:
			problem_map[problem_index] = elapsed_seconds

	standings: list[dict[str, Any]] = []
	for user_id_str, participant in participants.items():
		user_id = int(user_id_str)
		solved_times = solved_times_by_user.get(user_id, {})
		solves = len(solved_times)
		sort_key = sum(solved_times.values())
		standings.append(
			{
				"user_id": user_id,
				"display_name": _format_display_name(participant),
				"solves": solves,
				"sort_key": sort_key,
			}
		)

	standings.sort(key=lambda item: (-item["solves"], item["sort_key"], item["display_name"], item["user_id"]))

	contestants = [
		ScrapedContestant(
			position=index + 1,
			contestant=entry["display_name"],
			vjudge_handle=str(participants.get(str(entry["user_id"]), {}).get("nickname") or "").strip() or None,
			solves=entry["solves"],
		)
		for index, entry in enumerate(standings)
	]

	contest_name = data.get("title")
	return ScrapedContest(
		contest_url=contest_url,
		contest_name=str(contest_name) if contest_name else None,
		contestants=contestants,
	)


_VJUDGE_HEADERS = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
	"Accept": "application/json, text/plain, */*",
	"Referer": "https://vjudge.net/",
}

async def scrape_vjudge_contest(url: str) -> ScrapedContest:
	contest_url = _normalize_url(url)
	contest_id = _extract_contest_id(contest_url)
	api_url = f"https://vjudge.net/contest/rank/single/{contest_id}"

	async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=_VJUDGE_HEADERS) as client:
		try:
			response = await client.get(api_url)
			response.raise_for_status()
		except httpx.HTTPStatusError as exc:
			status_code = exc.response.status_code if exc.response is not None else "unknown"
			raise VJudgeScrapeError(f"VJudge contest rank endpoint returned HTTP {status_code}.") from exc
		except httpx.HTTPError as exc:
			raise VJudgeScrapeError("Failed to contact the VJudge contest rank endpoint.") from exc

	try:
		data = response.json()
	except ValueError as exc:
		raise VJudgeScrapeError("VJudge returned an invalid contest rank payload.") from exc

	if not isinstance(data, dict):
		raise VJudgeScrapeError("VJudge returned an unexpected contest rank payload.")

	return _build_standings(data, contest_url)


async def scrape_vjudge_contests(urls: list[str]) -> list[ScrapedContest]:
	contests: list[ScrapedContest] = []
	for url in urls:
		contests.append(await scrape_vjudge_contest(url))
	return contests
