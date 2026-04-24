from __future__ import annotations

import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from anthropic import AuthenticationError as AnthropicAuthenticationError
except Exception:
    AnthropicAuthenticationError = None

from agent import run_agent
from memory import SessionMemoryManager

load_dotenv()

logger = logging.getLogger(__name__)

app = FastAPI(title="Agentic Core Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    user_token: str | None = None


class OwnerReplyWebhookRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    owner_message: str = Field(..., min_length=1)


class AgentResponse(BaseModel):
    response: str


@app.post("/api/chat", response_model=AgentResponse)
def chat(payload: ChatRequest) -> AgentResponse:
    try:
        response_text = run_agent(
            session_id=payload.session_id,
            message=payload.message,
            user_token=payload.user_token,
        )
        return AgentResponse(response=response_text)
    except Exception as exc:
        if AnthropicAuthenticationError is not None and isinstance(exc, AnthropicAuthenticationError):
            raise HTTPException(
                status_code=401,
                detail=(
                    "Anthropic authentication failed. Verify ANTHROPIC_API_KEY. "
                    "If your key is for a provider-hosted Anthropic-compatible API, "
                    "set ANTHROPIC_BASE_URL to that provider endpoint."
                ),
            ) from exc
        logger.exception("Agent execution failed")
        raise HTTPException(status_code=500, detail="Agent execution failed") from exc


@app.post("/api/webhook/owner_reply", response_model=AgentResponse)
def owner_reply(payload: OwnerReplyWebhookRequest) -> AgentResponse:
    try:
        memory = SessionMemoryManager()
        memory.add_message(
            payload.session_id,
            "system",
            f"Owner reply received for this conversation: {payload.owner_message}",
        )

        renter_message = (
            "Please respond to the renter based on this owner update. "
            "Summarize the owner reply clearly and suggest next steps if relevant.\n\n"
            f"Owner reply: {payload.owner_message}"
        )

        response_text = run_agent(
            session_id=payload.session_id,
            message=renter_message,
            user_token="",
        )
        return AgentResponse(response=response_text)
    except Exception as exc:
        if AnthropicAuthenticationError is not None and isinstance(exc, AnthropicAuthenticationError):
            raise HTTPException(
                status_code=401,
                detail=(
                    "Anthropic authentication failed. Verify ANTHROPIC_API_KEY. "
                    "If your key is for a provider-hosted Anthropic-compatible API, "
                    "set ANTHROPIC_BASE_URL to that provider endpoint."
                ),
            ) from exc
        logger.exception("Owner webhook handling failed")
        raise HTTPException(status_code=500, detail="Owner webhook handling failed") from exc