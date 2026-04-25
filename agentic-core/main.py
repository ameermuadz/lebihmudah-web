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
    user_role: str | None = "USER"


class OwnerReplyWebhookRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    owner_message: str = Field(..., min_length=1)

class RenterQuestionWebhookRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    renter_session_id: str = Field(..., min_length=1)
    property_title: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)


class AgentResponse(BaseModel):
    response: str


@app.get("/api/chat/{session_id}/history")
def get_chat_history(session_id: str) -> list[dict[str, str]]:
    try:
        memory = SessionMemoryManager()
        history = memory.get_history(session_id)
        # Filter out system updates for a cleaner UI if you want, but for now just return it
        return history
    except Exception as exc:
        logger.exception("Failed to retrieve chat history")
        raise HTTPException(status_code=500, detail="Failed to retrieve chat history") from exc


@app.post("/api/chat", response_model=AgentResponse)
def chat(payload: ChatRequest) -> AgentResponse:
    try:
        response_text = run_agent(
            session_id=payload.session_id,
            message=payload.message,
            user_token=payload.user_token,
            user_role=payload.user_role,
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
            "[System Update: Owner Replied]\n"
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

@app.post("/api/webhook/renter_question", response_model=AgentResponse)
def renter_question(payload: RenterQuestionWebhookRequest) -> AgentResponse:
    try:
        memory = SessionMemoryManager()
        memory.add_message(
            payload.session_id,
            "system",
            f"A renter (session: {payload.renter_session_id}) asked a question about your property '{payload.property_title}': {payload.question}",
        )

        owner_message = (
            "[System Update: New Renter Question]\n"
            "A new question from a renter has just arrived. "
            "Please use `get_pending_owner_messages` to fetch ALL pending questions (there may be more than one), "
            "then present them all to me clearly, numbered, so I can reply to each one."
        )

        response_text = run_agent(
            session_id=payload.session_id,
            message=owner_message,
            user_token="",
            user_role="OWNER"
        )
        return AgentResponse(response=response_text)
    except Exception as exc:
        if AnthropicAuthenticationError is not None and isinstance(exc, AnthropicAuthenticationError):
            raise HTTPException(
                status_code=401,
                detail=(
                    "Anthropic authentication failed. Verify ANTHROPIC_API_KEY. "
                ),
            ) from exc
        logger.exception("Renter question webhook handling failed")
        raise HTTPException(status_code=500, detail="Renter question webhook handling failed") from exc