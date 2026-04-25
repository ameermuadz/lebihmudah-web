# Agentic Core Backend

FastAPI backend for the LebihMudah agent using LangChain tools and an Anthropic SDK-compatible model runtime.

## 1) Install dependencies

From this folder:

```bash
cd agentic-core
pip install -r requirements.txt
```

## 2) Configure environment

Create `.env` in this folder:

```env
ANTHROPIC_API_KEY=your_group_key_here
# Optional (default shown)
# ANTHROPIC_MODEL=ilmu-GLM-5.1
# Optional if your provider gives a custom Anthropic-compatible endpoint
# ANTHROPIC_BASE_URL=https://your-provider-endpoint
# Optional fallback env names supported by the backend:
# ZHIPUAI_API_KEY=your_group_key_here
# ZHIPUAI_MODEL=ilmu-GLM-5.1
```

Note: this backend accepts shared keys, but they are not one-time use. They must be active (not expired/revoked) and have permission for the selected model.

## 3) Run the API server

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`

## 4) Required companion app

The tool layer calls the Next.js API at `http://localhost:3000`, so run the web app too:

```bash
npm run dev
```

## 5) Example requests

### POST /api/chat

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-001",
    "message": "Find me a 2-room property in KL under 3000.",
    "user_token": ""
  }'
```

Response shape:

```json
{
  "response": "...assistant reply..."
}
```

Note: `user_token` should be the value of the `lebihmudah_session` cookie when the user is logged in.

### POST /api/webhook/owner_reply

```bash
curl -X POST http://localhost:8000/api/webhook/owner_reply \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-001",
    "owner_message": "The unit is available from next Monday."
  }'
```

Response shape:

```json
{
  "response": "...assistant renter-facing summary..."
}
```
