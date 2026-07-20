# ACM Lab Rating System

A competitive programming rating system built for the **CSE Department, Mawlana Bhashani Science and Technology University (MBSTU)**. It tracks participants across VJudge contests, Codeforces, and AtCoder — calculating weekly points and live standings automatically.

---

## What it does

- Members register with their VJudge, Codeforces, AtCoder, and CodeChef handles
- After a weekly VJudge contest ends, the system scrapes results automatically and updates everyone's solve counts and points
- Codeforces and AtCoder ratings/solves are pulled via their public APIs
- A live leaderboard ranks all participants by weekly points
- Admins can manage users, add contests, and manually trigger scraping
- Each user has a profile page with their stats, ratings, and a weekly rank history chart

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Backend  | FastAPI + SQLAlchemy (PostgreSQL)   |
| Auth     | JWT (Bearer Token)                 |
| Scraping | httpx + VJudge internal API        |
| Frontend | React 19 + Vite + TailwindCSS      |
| Routing  | React Router DOM v7                |

---

## Project Structure

```
RatingSystem/
├── Backend/
│   ├── app/
│   │   ├── routers/      # auth, users, admin, contests
│   │   ├── services/     # rank calculation, vjudge scraping, API fetching
│   │   ├── models/       # SQLAlchemy DB models
│   │   ├── repositories/ # DB query logic
│   │   ├── schemas/      # Pydantic request/response models
│   │   └── core/         # JWT auth, password hashing
│   └── main.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Standing/   # Leaderboard table
        │   ├── Profile/    # User profile + edit modal
        │   ├── Admin/      # Admin dashboard
        │   ├── Contest/    # Contest list/schedule
        │   └── Login/      # Auth forms
        └── main.jsx        # Routes
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
```

Run the server:
```bash
python main.py
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/SignUp` | Register a new participant |
| POST | `/auth/SignIn` | Login and get JWT token |
| GET | `/users/ViewAllUsers_by_Rank` | Get leaderboard (auto-processes finished contests) |
| GET | `/users/ViewUser/{username}` | Get a user's full profile |
| PUT | `/users/UpdateUser` | Update your own profile |
| PUT | `/admin/UpdateUser/{username}` | Admin: update any user |
| DELETE | `/admin/DeleteUser/{username}` | Admin: remove a user |
| POST | `/contests/add` | Admin: add a new VJudge contest |
| POST | `/contests/scrape` | Admin: manually scrape contest results |

All endpoints except `/auth/*` require a `Bearer <token>` header.

---

## How Points Work

1. When a VJudge contest ends, the system scrapes the scoreboard
2. Each participant's solve count is matched to their VJudge handle
3. Points are calculated based on problems solved and position
4. Codeforces + AtCoder solves from the last 7 days are fetched via their APIs
5. A final weekly score is computed combining contest + platform activity
6. Rankings update automatically every time the leaderboard is loaded

---

## Roles

- **participant** — can view standings, update their own profile
- **admin** — can manage all users, add contests, trigger scraping

---

## Live

- Frontend: [ranking-system-zeta.vercel.app](https://ranking-system-zeta.vercel.app)
