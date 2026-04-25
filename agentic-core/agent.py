from __future__ import annotations

import json
import os
from typing import Any

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from memory import SessionMemoryManager
from tools import check_session, get_property_details, initiate_booking, search_properties, message_owner, get_renter_loa, get_owner_loa, get_owner_statistics, get_owner_properties, get_owner_bookings, manage_booking, update_property, get_renter_bookings, cancel_renter_booking, get_pending_owner_messages, reply_to_owner_message

RENTER_SYSTEM_PROMPT = """You are the LebihMudah Agentic Core assistant, a smart real estate agent designed to handle property rentals end-to-end for renters.

Follow this workflow strictly:
1. If the user asks to find a house with specific filters (e.g. rent < RM1000, 2 people, has WiFi), use `search_properties`. 
2. If no properties match exactly, search again with broader constraints to give the closest possible option.
3. Show the resulting list to the user clearly.
4. If the user asks for their current bookings, use `get_renter_bookings`.
5. If the user wants to cancel a booking, use `cancel_renter_booking`.
6. If the user picks a house and has specific questions about it, use the `message_owner` tool to ask the owner directly. Do NOT invent details.
7. After getting the owner's reply, present the information to the user. The owner might ask some follow up questions (e.g. about move-in date or profession). 
8. Ask the user the owner's questions to collect data. 
9. Once you collect the answers from the user, use `message_owner` again to relay the answers back to the owner.
10. If the user decides to rent, proceed with `initiate_booking` (make sure to `check_session` first).
11. If the user asks for the LOA (Letter of Agreement) for a confirmed booking, use `get_renter_loa` to fetch the document.
12. If there's no match or they decline to rent, end the conversation politely.

Other rules:
- Gracefully handle API errors by explaining what failed and suggesting the next safe action.
- Always verify login with check_session before initiating any booking.
"""

OWNER_SYSTEM_PROMPT = """You are the LebihMudah Agentic Core assistant, a smart real estate agent designed to help property owners manage their listings.

Follow this workflow strictly:
1. If the owner asks for an overview or stats of their properties, use `get_owner_statistics`.
2. If they ask to see their listings, use `get_owner_properties`.
3. If they ask to see the bookings across their properties, use `get_owner_bookings`.
4. If they ask to manage a booking request (confirm or cancel), use `manage_booking`.
5. If they ask for the LOA (Letter of Agreement) for a confirmed booking, use `get_owner_loa`.
6. If they ask to update a property they own, use `update_property`. Make sure you gather all required fields from them or the existing property details before calling the tool.
7. If there are pending questions from renters (or you are proactively notified about a new one), ALWAYS call `get_pending_owner_messages` first to retrieve ALL pending questions — there may be more than one.
8. Present ALL pending questions to the owner clearly, numbered, with the property name and renter session for each.
9. To reply to a renter's question, use `reply_to_owner_message` with the correct `message_id`. You can reply to multiple questions one after another.
10. Provide helpful insights on their properties and pending actions.
"""

RENTER_TOOLS = [search_properties, get_property_details, check_session, initiate_booking, message_owner, get_renter_loa, get_renter_bookings, cancel_renter_booking]
OWNER_TOOLS = [check_session, get_owner_statistics, get_owner_properties, get_owner_bookings, get_owner_loa, manage_booking, update_property, get_pending_owner_messages, reply_to_owner_message]
MAX_TOOL_ROUNDS = 6


def _history_to_messages(history: list[dict[str, str]]) -> list[Any]:
    messages = []
    for row in history:
        role = row.get("role", "assistant")
        content = row.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
        elif role == "system":
            messages.append(HumanMessage(content=f"[System Update: {content}]"))
    return messages


def _serialize_tool_result(result: Any) -> str:
    if isinstance(result, (dict, list)):
        return json.dumps(result, ensure_ascii=True)
    return str(result)


def run_agent(session_id: str, message: str, user_token: str | None, user_role: str | None = "USER") -> str:
    """Runs the GLM agent with tool-calling and SQLite-backed session memory using LangChain."""
    memory = SessionMemoryManager()
    memory.add_message(session_id, "user", message)
    
    is_owner = (user_role == "OWNER")
    system_prompt = OWNER_SYSTEM_PROMPT if is_owner else RENTER_SYSTEM_PROMPT
    active_tools = OWNER_TOOLS if is_owner else RENTER_TOOLS
    
    api_key = (
        os.getenv("ANTHROPIC_API_KEY")
        or os.getenv("ZHIPUAI_API_KEY")
        or ""
    ).strip()

    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY is required. "
            "You can also use ZHIPUAI_API_KEY as a fallback env name."
        )

    base_url = os.getenv("ANTHROPIC_BASE_URL", "").strip().rstrip("/")
    if not base_url:
        raise ValueError(
            "ANTHROPIC_BASE_URL is required for this provider runtime."
        )

    raw_model = (
        os.getenv("ANTHROPIC_MODEL")
        or os.getenv("ZHIPUAI_MODEL")
        or "ilmu-glm-5.1"
    ).strip()

    model = "ilmu-glm-5.1" if raw_model.lower() == "ilmu-glm-5.1" else raw_model
    timeout_seconds = float(os.getenv("ANTHROPIC_TIMEOUT_SECONDS", "30"))
    max_tokens = int(os.getenv("ANTHROPIC_MAX_TOKENS", "1024"))

    llm = ChatAnthropic(
        model=model,
        anthropic_api_key=api_key,
        anthropic_api_url=base_url,
        timeout=timeout_seconds,
        max_tokens=max_tokens,
        temperature=0.2,
    )
    llm_with_tools = llm.bind_tools(active_tools)

    history = memory.get_history(session_id, limit=20)
    
    messages: list[Any] = [SystemMessage(content=system_prompt)]
    messages.extend(_history_to_messages(history))
    
    runtime_token = user_token or ""
    runtime_token_status = "provided" if runtime_token else "not_provided"
    
    messages.append(
        HumanMessage(
            content=(
                f"User message:\n{message}\n\n"
                "Runtime context:\n"
                f"- session_id: {session_id}\n"
                f"- user_token_status: {runtime_token_status}\n"
                "For booking requests, call check_session first and only then call initiate_booking. "
                "The backend injects the actual token into tool calls automatically. "
                "IMPORTANT: You must explicitly ask the user for BOTH their move-in and move-out dates before booking."
            )
        )
    )

    session_verified: bool | None = None

    for _ in range(MAX_TOOL_ROUNDS):
        response = llm_with_tools.invoke(messages)
        messages.append(response)

        if not response.tool_calls:
            final_text = response.content
            if isinstance(final_text, list):
                final_text = " ".join([block.get("text", "") for block in final_text if isinstance(block, dict) and block.get("type") == "text"])
            
            final_text = str(final_text).strip() or "I could not generate a response right now."
            memory.add_message(session_id, "assistant", final_text)
            return final_text

        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = dict(tool_call["args"])
            
            tool = next((t for t in active_tools if t.name == tool_name), None)
            if not tool:
                messages.append(
                    ToolMessage(
                        content=f"Unknown tool: {tool_name}",
                        tool_call_id=tool_call["id"],
                        name=tool_name,
                        status="error"
                    )
                )
                continue

            if tool_name in {"check_session", "initiate_booking", "manage_booking", "update_property", "get_renter_bookings", "cancel_renter_booking", "get_owner_statistics", "get_owner_properties", "get_owner_bookings", "get_renter_loa", "get_owner_loa", "get_pending_owner_messages", "reply_to_owner_message"}:
                tool_args["user_token"] = runtime_token
            if tool_name in {"message_owner"}:
                tool_args["session_id"] = session_id

            result_str = ""
            if tool_name == "check_session":
                result = tool.invoke(tool_args)
                if isinstance(result, dict):
                    session_verified = bool(result.get("ok"))
                result_str = _serialize_tool_result(result)
            elif tool_name == "initiate_booking" and session_verified is not True:
                precheck = check_session.invoke({"user_token": runtime_token})
                session_verified = bool(isinstance(precheck, dict) and precheck.get("ok"))
                if not session_verified:
                    result_str = _serialize_tool_result({
                        "ok": False,
                        "error": "Booking blocked because check_session failed. Ask the user to log in first.",
                        "check_session": precheck,
                    })
                else:
                    result = tool.invoke(tool_args)
                    result_str = _serialize_tool_result(result)
            else:
                result = tool.invoke(tool_args)
                result_str = _serialize_tool_result(result)

            messages.append(
                ToolMessage(
                    content=result_str,
                    tool_call_id=tool_call["id"],
                    name=tool_name
                )
            )

    fallback = "I could not complete this request right now. Please try again in a moment."
    memory.add_message(session_id, "assistant", fallback)
    return fallback