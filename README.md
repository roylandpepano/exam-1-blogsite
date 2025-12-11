# HorizonLog - Blogsite (Exam 1)

A simple blog application with a Next.js frontend and a Flask REST API backend. The project demonstrates CRUD operations for posts and comments, pagination, search, caching, database migrations, and seeding for development.

**Tech stack:**

-  **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
-  **Backend:** Flask, SQLAlchemy, Flask-Migrate (Alembic), Redis (optional cache)
-  **Database:** PostgreSQL (development/production), SQLite (testing)

**Repository layout**

-  `client/`: Next.js frontend app. Key files:
   -  `client/package.json`: client scripts and dependencies
   -  `client/lib/api.ts`: frontend API client (uses `NEXT_PUBLIC_API_URL`)
   -  `client/app/` and `client/components/`: UI and pages
-  `server/`: Flask REST API. Key files:
   -  `server/app.py`: application factory and entry point
   -  `server/models.py`: SQLAlchemy models (`Post`, `Comment`)
   -  `server/routes/`: `posts.py` and `comments.py` blueprints
   -  `server/config.py`: configuration via environment variables
   -  `server/requirements.txt`: Python dependencies
   -  `server/migrations/`: Alembic migration files
   -  `server/seed.py`: development data seeder
   -  `server/tests/`: basic pytest tests

**Features**

-  Create, read, update, delete posts
-  Create, read, update, delete comments (with optional rating)
-  Pagination and search for posts
-  Caching (SimpleCache used by default; Redis supported via config)
-  Database migrations (Alembic/Flask-Migrate)
-  Development seeder to populate sample data

**Prerequisites**

-  Node.js (recommended: Node 18 or newer)
-  npm or a compatible package manager
-  Python 3.10+ (recommended: 3.11)
-  PostgreSQL (for development/production) or you can configure a local DB
-  Redis (optional, only if you want to enable Redis caching)

---

**Quickstart (development)**

1. Clone the repository

```bash
git clone https://github.com/roylandpepano/exam-1-blogsite.git
cd exam-1-blogsite
```

2. Run with Docker (recommended)

If you have Docker and Docker Compose installed you can run the entire stack (Postgres, Redis, Flask API, Next.js client) with a single command. This is the easiest way to run the app locally and ensures services run with the correct settings.

```bash
# build images (optional, Compose will build automatically when needed)
docker-compose build

# start services in detached mode
docker-compose up -d
```

Wait a few seconds for Postgres to initialize, then apply database migrations and (optionally) seed the database:

```bash
# Apply Alembic migrations
docker-compose exec server flask db upgrade

# Seed the database (optional)
docker-compose exec server python seed.py
```

If the Postgres container is not ready yet you can retry the migration/seed with a simple loop:

```bash
docker-compose exec server bash -lc "for i in {1..20}; do flask db upgrade && break || (echo 'db not ready, retrying...' && sleep 2); done"
```

To stop and remove containers (preserving volume data):

```bash
docker-compose down
```

To stop and remove containers + volumes (remove database data):

```bash
docker-compose down -v
```

You can run one-off commands against the `server` service image without a running server using `docker-compose run --rm server <command>`.

Example:

```bash
docker-compose run --rm server flask db upgrade
```

3. Backend: create a Python virtual environment and install dependencies

```bash
cd server
python -m venv .venv
source .venv/Scripts/activate  # on Windows with bash.exe
pip install -r requirements.txt
```

3. Backend: configure environment variables

Create a `.env` file in the `server/` directory (example below). At minimum set database credentials if you want to use PostgreSQL. For quick local development you can run a local Postgres container or point to an existing DB.

Example `server/.env`:

```ini
# Flask
FLASK_ENV=development
SECRET_KEY=dev-secret-key

# Postgres
POSTGRES_USER=bloguser
POSTGRES_PASSWORD=blogpassword
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=blogsite_db

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# CORS (comma separated)
CORS_ORIGINS=http://localhost:3000
```

4. Backend: initialize database and run migrations

If you are using PostgreSQL and Alembic is already configured within `server/migrations/`, run:

```bash
# from the server/ directory
export FLASK_APP=app:create_app
export FLASK_ENV=development
flask db upgrade
```

If you don't want to set up Postgres right now, you can still run the app (but some features may require a DB). To keep things simple during early development you can temporarily update `server/config.py` to point to a local SQLite file.

5. Backend: seed the database (optional, creates sample posts & comments)

```bash
python seed.py
```

6. Backend: run the Flask API

```bash
python app.py
# The API will listen on http://0.0.0.0:5000 by default
```

7. Frontend: install dependencies and run the Next.js dev server

```bash
cd ../client
npm install
# If you use yarn or pnpm, adjust accordingly

# Optionally set the API base url for the client
export NEXT_PUBLIC_API_URL=http://localhost:5000

npm run dev
# The frontend will be available at http://localhost:3000
```

---

**Running tests**

Server unit tests use `pytest`:

```bash
cd server
pytest
```

Frontend tests are not included by default; you can add Jest/Playwright as needed.

---

**API Reference (summary)**

Base URL: `http://localhost:5000`

-  `GET /` - Root: returns a small JSON with available endpoints
-  `GET /health` - Health check

Posts:

-  `GET /api/posts` - List posts. Query params: `page`, `per_page`, `search`
-  `GET /api/posts/:id` - Get a single post with comments
-  `POST /api/posts` - Create a post
   -  JSON body: `{ "title": "...", "content": "...", "author": "..." }`
-  `PUT /api/posts/:id` - Update post (partial updates allowed)
-  `DELETE /api/posts/:id` - Delete a post

Comments:

-  `GET /api/comments` - List comments (query params: `page`, `per_page`, optional `post_id`)
-  `GET /api/comments/post/:post_id` - Get comments for a post
-  `POST /api/comments` - Create a comment
   -  JSON body: `{ "post_id": 1, "author": "...", "content": "...", "rating": 4 }`
-  `PUT /api/comments/:id` - Update a comment
-  `DELETE /api/comments/:id` - Delete a comment

Example curl: create a post

```bash
curl -X POST http://localhost:5000/api/posts \
	-H "Content-Type: application/json" \
	-d '{"title":"Hello","content":"This is a post","author":"Me"}'
```

Example curl: create a comment

```bash
curl -X POST http://localhost:5000/api/comments \
	-H "Content-Type: application/json" \
	-d '{"post_id":1, "author":"Commenter", "content":"Nice post!", "rating":5}'
```

---

**Frontend integration notes**

-  The client uses `client/lib/api.ts` which reads `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`). Set `NEXT_PUBLIC_API_URL` before running `npm run dev` if your backend runs on another host/port.
-  Pagination and search UI are wired to the backend endpoints specified above.

**Deployment hints**

-  Use a production Postgres instance (Heroku Postgres, RDS, etc.) and set `DATABASE_URL` (or the `POSTGRES_*` variables used in `server/config.py`).
-  Use a proper WSGI server (Gunicorn/Uvicorn) and put the Flask app behind a reverse proxy (Nginx).
-  Build the Next.js app with `npm run build` and serve with `npm run start` or a platform like Vercel.
-  For Redis caching in production, provide `REDIS_HOST`/`REDIS_PORT` and ensure `server/config.py` picks up `REDIS_URL`.

**Troubleshooting**

-  If migrations fail, ensure your `SQLALCHEMY_DATABASE_URI` is correct and the DB is reachable.
-  If CORS errors occur in the browser, make sure `CORS_ORIGINS` includes your frontend origin (e.g., `http://localhost:3000`).
-  If the frontend can't reach the API, confirm `NEXT_PUBLIC_API_URL` and that the backend is running on the expected port.

**Contributing**

-  Feel free to open issues or pull requests. Keep changes focused and add tests for backend logic where appropriate.

**License**

-  This repository does not include a license file. Add one if you plan to publish the project.
