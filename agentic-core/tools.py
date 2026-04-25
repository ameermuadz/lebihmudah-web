from __future__ import annotations

from datetime import datetime
from typing import Any

import requests
import logging
import json
from langchain_core.tools import tool

# Set up logging to a file for API calls
api_logger = logging.getLogger("api_calls")
api_logger.setLevel(logging.INFO)
file_handler = logging.FileHandler("api_calls.log")
file_handler.setFormatter(logging.Formatter("%(asctime)s - %(message)s"))
if not api_logger.handlers:
    api_logger.addHandler(file_handler)

BASE_URL = "http://localhost:3000"
AUTH_COOKIE_NAME = "lebihmudah_session"
REQUEST_TIMEOUT_SECONDS = 20


def _build_auth_cookies(user_token: str | None) -> dict[str, str]:
    if not user_token:
        return {}
    return {AUTH_COOKIE_NAME: user_token}


def _safe_parse_response(response: requests.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return {"raw": response.text}


def _request(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
    cookies: dict[str, str] | None = None,
) -> dict[str, Any]:
    url = f"{BASE_URL}{path}"
    
    # Log the API call and its body
    log_msg = f"{method} {path}"
    if payload:
        log_msg += f" - Body: {json.dumps(payload)}"
    api_logger.info(log_msg)
    print(f"API CALL LOG: {log_msg}")  # Also print to terminal so you can see it instantly
    
    try:
        response = requests.request(
            method=method,
            url=url,
            json=payload,
            cookies=cookies,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        return {
            "ok": False,
            "status_code": 0,
            "error": f"Request failed: {exc}",
            "data": None,
        }

    data = _safe_parse_response(response)

    if response.ok:
        return {
            "ok": True,
            "status_code": response.status_code,
            "data": data,
        }

    error_text = data.get("error") if isinstance(data, dict) else None
    if not isinstance(error_text, str) or not error_text.strip():
        error_text = f"HTTP {response.status_code} from {path}"

    return {
        "ok": False,
        "status_code": response.status_code,
        "error": error_text,
        "data": data,
    }





@tool
def search_properties(location: str = "", max_price: int | None = None, room_count: int | None = None, amenities: list[str] | None = None) -> dict[str, Any]:
    """Searches the property catalog by location, budget, room count, and amenities.

    This tool calls the Next.js discovery endpoint at POST `/api/tools/search`.
    The API supports open discovery, so it can be used before login. It returns
    a list of matching properties with detailed fields including description,
    amenities, and rules, which allows for rich property discovery.

    Args:
        location: Free-text location filter such as a city, district, or area
            name. Use an empty string to skip location filtering.
        max_price: Optional upper budget limit in local currency. Pass `None`
            to avoid price filtering.
        room_count: Optional minimum number of rooms requested by the user.
            Pass `None` when room constraints are not provided.
        amenities: Optional list of amenity keywords to filter by (e.g., ["WiFi", "Pool"]).
            The search uses AND logic, requiring all specified amenities to be present.

    Returns:
        dict[str, Any]: A normalized API result object.
            - `ok` (bool): `True` when the API responded with 2xx.
            - `status_code` (int): HTTP status code from the Next.js API.
            - `data` (Any): Parsed response payload (usually a list of
              properties with rich details when successful).
            - `error` (str): Present only when the request failed.

    When to use:
        Use this when the user asks to browse, compare, or narrow down homes
        by budget, rooms, location, or specific features like "WiFi" or "Pool".
    """
    payload: dict[str, Any] = {}

    if location.strip():
        payload["location"] = location.strip()
    if max_price is not None:
        payload["maxPrice"] = max_price
    if room_count is not None:
        payload["rooms"] = room_count
    if amenities:
        payload["amenities"] = amenities

    return _request("POST", "/api/tools/search", payload=payload)


@tool
def get_property_details(property_id: str) -> dict[str, Any]:
    """Fetches full details for one property from the platform API.

    This tool calls POST `/api/tools/details` and expects a property identifier.
    The detailed response typically includes rich description fields, contact
    references, amenities, rules, and availability metadata.

    Args:
        property_id: Unique property identifier from a prior search result or
            user-provided reference.

    Returns:
        dict[str, Any]: A normalized API result object.
            - `ok` (bool): `True` when details were retrieved successfully.
            - `status_code` (int): HTTP response code.
            - `data` (Any): Parsed property payload on success.
            - `error` (str): Error message when the request fails, such as
              missing ID, unknown property, or server issues.

    When to use:
        Use this immediately after the user selects a listing and asks for
        exact details. Never invent missing fields; call this tool instead.
    """
    payload = {"propertyId": property_id}
    return _request("POST", "/api/tools/details", payload=payload)


@tool
def check_session(user_token: str) -> dict[str, Any]:
    """Validates whether a renter is currently logged in.

    This tool calls GET `/api/auth/me` and forwards the session token as the
    `lebihmudah_session` cookie. It should be used before protected actions,
    especially booking, to ensure the user is authenticated.

    Args:
        user_token: Session token that was issued by the web app login flow.
            The value is sent as the auth cookie to the Next.js API.

    Returns:
        dict[str, Any]: A normalized API result object.
            - `ok` (bool): `True` when a valid authenticated session is found.
            - `status_code` (int): HTTP response code from `/api/auth/me`.
            - `data` (Any): Parsed user/session payload on success.
            - `error` (str): Failure reason (for example `401` when token is
              missing/expired, or network/server errors).

    When to use:
        Use this whenever the user asks to book, cancel, or perform any action
        that requires identity verification.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("GET", "/api/auth/me", cookies=cookies)


@tool
def initiate_booking(property_id: str, user_token: str, move_in_date: str, move_out_date: str) -> dict[str, Any]:
    """Creates a renter booking request for a property.

    This tool calls POST `/api/tools/book`, sending the property identifier,
    move-in date, and the move-out date explicitly provided by the user. 
    The session token is forwarded as the `lebihmudah_session` cookie. 
    The caller must validate login via `check_session` before invoking this tool.

    Args:
        property_id: Target property identifier to be booked.
        user_token: Auth token from the user session cookie.
        move_in_date: Requested move-in date in ISO-like date or datetime text.
            Example values: `2026-05-01` or `2026-05-01T00:00:00Z`.
        move_out_date: Requested move-out date in ISO-like date or datetime text.
            Example values: `2026-06-01` or `2026-06-01T00:00:00Z`.

    Returns:
        dict[str, Any]: A normalized API result object.
            - `ok` (bool): `True` when the booking request was accepted.
            - `status_code` (int): HTTP status code from the booking endpoint.
            - `data` (Any): Booking payload when successful.
            - `error` (str): Validation/conflict/auth/server failure reason.

    When to use:
        Use this only after identity is confirmed through `check_session` and
        after explicitly collecting both the move-in and move-out dates from the user.
    """
    cookies = _build_auth_cookies(user_token)
    payload = {
        "propertyId": property_id,
        "moveInDate": move_in_date,
        "moveOutDate": move_out_date,
    }
    return _request("POST", "/api/tools/book", payload=payload, cookies=cookies)


import os
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

@tool
def message_owner(property_id: str, question: str, session_id: str | None = None) -> dict[str, Any]:
    """Messages the property owner with a specific question to clarify details for the user.

    Args:
        property_id: Target property identifier.
        question: The exact question you want to ask the property owner on behalf of the renter.
        session_id: System injected chat session ID.

    Returns:
        dict[str, Any]: A normalized API result object confirming the message was sent.
    """
    if not session_id:
        return {"ok": False, "error": "Missing session ID. Cannot route owner message."}

    payload = {
        "propertyId": property_id,
        "question": question,
        "sessionId": session_id,
    }

    response = _request("POST", "/api/tools/owner-message", payload=payload)
    if response["ok"]:
        response["data"] = {"reply": "I have successfully asked the owner this question. We are now waiting for their reply. I will notify the renter when the owner responds."}
    return response

@tool
def get_pending_owner_messages(user_token: str | None = None) -> dict[str, Any]:
    """Fetches questions from renters that the owner needs to answer.
    
    Args:
        user_token: System injected auth token.
    """
    if not user_token:
        return {"ok": False, "error": "Login required."}
    cookies = _build_auth_cookies(user_token)
    return _request("GET", "/api/tools/owner-messages", cookies=cookies)

@tool
def reply_to_owner_message(message_id: str, reply: str, user_token: str | None = None) -> dict[str, Any]:
    """Replies to a pending question from a renter.

    Args:
        message_id: The ID of the pending message (from get_pending_owner_messages).
        reply: The exact response to give to the renter.
        user_token: System injected auth token.
    """
    if not user_token:
        return {"ok": False, "error": "Login required."}
    cookies = _build_auth_cookies(user_token)
    payload = {"reply": reply}
    return _request("PATCH", f"/api/tools/owner-messages/{message_id}", payload=payload, cookies=cookies)


@tool
def get_renter_loa(booking_id: str, user_token: str) -> dict[str, Any]:
    """Get the LOA PDF attachment for a renter's confirmed booking.

    Args:
        booking_id: Target booking identifier.
        user_token: System injected auth token.

    Returns:
        dict[str, Any]: A normalized API result object containing the LOA PDF URL and timestamp.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("GET", f"/api/renter/bookings/{booking_id}/loa", cookies=cookies)


@tool
def get_owner_loa(booking_id: str, user_token: str) -> dict[str, Any]:
    """Get the LOA PDF attachment for an owner's confirmed booking.

    Args:
        booking_id: Target booking identifier.
        user_token: System injected auth token.

    Returns:
        dict[str, Any]: A normalized API result object containing the LOA PDF URL and timestamp.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("GET", f"/api/owner/bookings/{booking_id}/loa", cookies=cookies)


@tool
def get_renter_bookings(user_token: str) -> dict[str, Any]:
    """Lists the logged-in renter's bookings with property details and status.
    
    Args:
        user_token: System injected auth token.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("GET", "/api/renter/bookings", cookies=cookies)


@tool
def cancel_renter_booking(booking_id: str, user_token: str) -> dict[str, Any]:
    """Cancels a renter's booking request.
    
    Args:
        booking_id: The ID of the booking to cancel.
        user_token: System injected auth token.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("PATCH", f"/api/renter/bookings/{booking_id}", cookies=cookies)


@tool
def get_owner_statistics(user_token: str) -> dict[str, Any]:
    """Retrieves property owner's statistics such as property and booking counts.
    
    Args:
        user_token: System injected auth token.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("GET", "/api/owner/statistics", cookies=cookies)


@tool
def get_owner_properties(user_token: str) -> dict[str, Any]:
    """Lists all properties owned by the logged-in owner.
    
    Args:
        user_token: System injected auth token.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("GET", "/api/owner/properties", cookies=cookies)


@tool
def get_owner_bookings(user_token: str) -> dict[str, Any]:
    """Lists bookings across the owner's properties.
    
    Args:
        user_token: System injected auth token.
    """
    cookies = _build_auth_cookies(user_token)
    return _request("GET", "/api/owner/bookings", cookies=cookies)


@tool
def manage_booking(booking_id: str, action: str, user_token: str | None = None) -> dict[str, Any]:
    """Approves or cancels a pending booking request on an owned property.
    
    Args:
        booking_id: The ID of the booking to manage.
        action: Must be 'confirm' or 'cancel'.
        user_token: System injected auth token.
    """
    if not user_token:
        return {"ok": False, "error": "Login required. Please ask the user to login."}
        
    try:
        cookies = {"lebihmudah_session": user_token}
        payload = {"action": action}
        
        log_msg = f"PATCH /api/owner/bookings/{booking_id} - Body: {json.dumps(payload)}"
        api_logger.info(log_msg)
        print(f"API CALL LOG: {log_msg}")

        response = requests.patch(
            f"http://localhost:3000/api/owner/bookings/{booking_id}",
            json=payload,
            cookies=cookies,
            timeout=10,
        )
        data = response.json() if response.text else {}
        return {
            "ok": response.ok,
            "status_code": response.status_code,
            "data": data,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


@tool
def update_property(property_id: str, title: str, location: str, price: float, rooms: int, pets_allowed: bool, description: str, availability_date: str, amenities: list[str], rules: list[str], user_token: str | None = None) -> dict[str, Any]:
    """Updates a property owned by the logged-in owner.
    
    Args:
        property_id: The ID of the property to update.
        title: Title of the property.
        location: Location of the property.
        price: Monthly rent price.
        rooms: Number of rooms.
        pets_allowed: Whether pets are allowed.
        description: Description of the property.
        availability_date: YYYY-MM-DD date when the property is available.
        amenities: List of amenities strings.
        rules: List of rules strings.
        user_token: System injected auth token.
    """
    if not user_token:
        return {"ok": False, "error": "Login required. Please ask the user to login."}
        
    try:
        cookies = {"lebihmudah_session": user_token}
        payload = {
            "title": title,
            "location": location,
            "price": price,
            "rooms": rooms,
            "petsAllowed": pets_allowed,
            "description": description,
            "availabilityDate": availability_date,
            "amenities": amenities,
            "rules": rules
        }
        
        log_msg = f"PATCH /api/owner/properties/{property_id} - Body: {json.dumps(payload)}"
        api_logger.info(log_msg)
        print(f"API CALL LOG: {log_msg}")

        response = requests.patch(
            f"http://localhost:3000/api/owner/properties/{property_id}",
            json=payload,
            cookies=cookies,
            timeout=10,
        )
        data = response.json() if response.text else {}
        return {
            "ok": response.ok,
            "status_code": response.status_code,
            "data": data,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}