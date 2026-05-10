# Deployment Guide

Recommended setup:

- Backend: Render Web Service
- Database: Render PostgreSQL
- Frontend: Vercel
- AI scoring: Hugging Face Spaces

## 1. Push source code to GitHub

Deploying from Render/Vercel is easiest when this `xkld-project` folder is in a GitHub repository.

Do not commit local secrets or generated folders:

- `backend/.env`
- `backend/venv/`
- `backend/uploads/`
- `frontend/node_modules/`
- `frontend/dist/`

## 2. Deploy backend on Render

You can use `render.yaml` from the repository root.

Render service settings:

- Service type: Web Service
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`

Required backend environment variables:

```env
DATABASE_URL=<Render PostgreSQL connection string>
SECRET_KEY=<generate-a-long-random-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=<your Vercel frontend URL>
PYTHON_VERSION=3.11.11
PHOBERT_ENABLED=false
VIETNAMESE_TOKENIZER_ENABLED=false
PHOBERT_SERVICE_URL=<your Hugging Face Space URL>
PHOBERT_SERVICE_TIMEOUT=60
```

If you need more than one frontend origin, use `CORS_ORIGINS` instead:

```env
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

After the backend is live, test:

```text
https://your-backend.onrender.com/
```

Expected response:

```json
{"message":"XKLD Backend is running"}
```

## 3. Deploy frontend on Vercel

Vercel project settings:

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Required frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

The `frontend/vercel.json` file rewrites all browser routes to `index.html`, so URLs like `/jobs` and `/login` work after refresh.

## 4. Deploy AI scoring on Hugging Face Spaces

Create a new Hugging Face Space:

- SDK: Docker
- Hardware: Free CPU
- Files: use the contents of the `ai-service` folder

After the Space is running, test:

```text
https://your-space-name.hf.space/health
```

Expected response:

```json
{"status":"ok","model_loaded":false}
```

The first real `/score` request can be slow because PhoBERT is loaded on demand.

Then update the Render backend env var:

```env
PHOBERT_SERVICE_URL=https://your-space-name.hf.space
PHOBERT_SERVICE_TIMEOUT=90
```

Restart/redeploy the Render backend after changing env vars.

## 5. Update CORS after Vercel deploy

Once Vercel gives you the final frontend URL, update the Render backend env var:

```env
FRONTEND_URL=https://your-app.vercel.app
```

Then redeploy/restart the backend.

## 6. Optional seed data

After the backend and database are connected, run seed scripts only if you need initial demo data:

```bash
python seed_data.py
python seed_interview_questions.py
python seed_real_orders.py
```

On Render, run these from the backend service shell.

## Notes

- The Render backend is intentionally lightweight. PhoBERT runs in the separate Hugging Face Space.
- If `PHOBERT_SERVICE_URL` is empty or unavailable, the backend falls back to lightweight keyword/length scoring.
- Uploaded files under `backend/uploads/` are created at runtime. For production uploads that must survive redeploys, attach persistent storage or move uploads to cloud storage.
