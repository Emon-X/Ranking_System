# ACM Lab Ranking System

A competitive programming ranking platform built for the **CSE Department, Mawlana Bhashani Science and Technology University (MBSTU)**. It tracks participants across VJudge contests, Codeforces, and AtCoder — automatically calculating weekly points and maintaining a live leaderboard.

**Live app:** [ranking-system-zeta.vercel.app](https://ranking-system-zeta.vercel.app)

---

## Features

- Members register with their VJudge, Codeforces, AtCoder, and CodeChef handles
- When a weekly VJudge contest ends, results are scraped automatically and everyone's solve counts and points are updated
- Codeforces and AtCoder ratings/solves are pulled via their public APIs (AtCoder synced via a scheduled GitHub Actions job — see [AtCoder Rating Sync](#atcoder-rating-sync))
- Live leaderboard ranking all participants by weekly points
- Admin dashboard to manage users, add contests, and manually trigger scraping
- Per-user profile page with stats, ratings, and a weekly rank-history chart

---

## Tech Stack

| Layer    | Technology                          |
|----------|--------------------------------------|
| Backend  | FastAPI + SQLAlchemy (PostgreSQL)    |
| Auth     | JWT (Bearer token)                   |
| Scraping | httpx + VJudge internal API          |
| Frontend | React 19 + Vite + Tailwind CSS       |
| Routing  | React Router DOM v7                  |
| Automation | GitHub Actions (scheduled AtCoder sync) |

---

## Project Structure

```
RatingSystem/
├── .github/
│   └── workflows/         # Scheduled AtCoder rating sync
├── Backend/
│   ├── app/
│   │   ├── routers/       # auth, users, admin, contests, internal
│   │   ├── services/      # rank calculation, VJudge scraping, API fetching
│   │   ├── models/        # SQLAlchemy DB models
│   │   ├── repositories/  # DB query logic
│   │   ├── schemas/       # Pydantic request/response models
│   │   └── core/          # JWT auth, password hashing
│   ├── scripts/           # AtCoder rating sync script (run by GitHub Actions)
│   └── main.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Standing/   # Leaderboard table
        │   ├── Profile/    # User profile + edit modal
        │   ├── Admin/      # Admin dashboard
        │   ├── Contest/    # Contest list/schedule
        │   └── Login/      # Auth forms
        └── main.jsx        # Route definitions
```

---

## Getting Started

### Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost/rating_db
SECRET_KEY=your_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
INTERNAL_SYNC_SECRET=your_internal_secret
BACKEND_URL=http://localhost:8000
```

Run the server:

```bash
python main.py
# API:          http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## AtCoder Rating Sync

AtCoder blocks requests from most cloud/datacenter IPs (including Render), so ratings can't be fetched live from the backend. Instead, a **GitHub Actions workflow** (`.github/workflows/`) runs on a schedule:

1. Fetches the current list of AtCoder handles from `GET /internal/atcoder-handles`
2. Pulls each user's rating directly from AtCoder
3. Pushes the results back to `POST /internal/atcoder-ratings`

Both internal endpoints are protected by the `INTERNAL_SYNC_SECRET` header and are not part of the public API.

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/SignUp` | Register a new participant |
| POST | `/auth/SignIn` | Log in and receive a JWT |
| GET | `/users/ViewAllUsers_by_Rank` | Get the leaderboard (auto-processes finished contests) |
| GET | `/users/ViewUser/{username}` | Get a user's full profile |
| PUT | `/users/UpdateUser` | Update your own profile |
| PUT | `/admin/UpdateUser/{username}` | Admin: update any user |
| DELETE | `/admin/DeleteUser/{username}` | Admin: remove a user |
| POST | `/contests/add` | Admin: add a new VJudge contest |
| POST | `/contests/scrape` | Admin: manually trigger contest scraping |
| GET | `/contests/list` | List all contests |
| GET | `/internal/atcoder-handles` | Internal: list all AtCoder handles (requires `INTERNAL_SYNC_SECRET`) |
| POST | `/internal/atcoder-ratings` | Internal: update AtCoder ratings for all users (requires `INTERNAL_SYNC_SECRET`) |
| GET | `/health` | Health check |

All endpoints except `/auth/*` and `/internal/*` require an `Authorization: Bearer <token>` header. `/internal/*` endpoints require the `x-internal-secret` header instead.

---

## How Points Work

1. When a VJudge contest ends, the system scrapes the scoreboard.
2. Each participant's solve count is matched to their VJudge handle.
3. Points are calculated from problems solved and contest position.
4. Codeforces solves from the last 7 days and AtCoder solves from the last 30 days are pulled via their APIs. (AtCoder ratings can take up to a week to reflect a contest, so a longer window is used.)
5. A final weekly score combines contest performance with platform activity.
6. Rankings recalculate automatically each time the leaderboard is loaded.

---

## Roles

- **Participant** — view standings, contests, and resources; update their own profile
- **Admin** — manage all users, add contests, trigger scraping