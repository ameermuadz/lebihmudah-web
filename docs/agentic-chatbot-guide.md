# Agentic Chatbot Guide

This document describes the current chatbot-related API surface and the rules the future agentic AI should follow when wiring the LebihMudah platform chatbot.

The current repo only provides the UI shell and backend property/auth/booking endpoints. The actual chatbot orchestration, message routing, and owner handoff logic are intentionally left for the chatbot team to implement later.

## Access Rules

1. Property search is public.
2. A user can search and inspect suitable properties without logging in.
3. The chatbot must require login before it performs renter actions such as booking.
4. The chatbot must require login before it performs owner actions such as property editing, listing owner property status, or approving/rejecting bookings.
5. When an authenticated session is needed, use the current session returned by `/api/auth/me`.
6. If the session role is `OWNER`, expose owner-only tools. If the session role is `USER`, expose renter tools only.

## Available APIs

### Public discovery

| Method | Route                | Use                                                                 |
| ------ | -------------------- | ------------------------------------------------------------------- |
| `POST` | `/api/tools/search`  | Search properties by location, price, rooms, pet policy, and limit. |
| `POST` | `/api/tools/details` | Load a single property by `propertyId`.                             |

### Authentication

| Method | Route              | Use                                                           |
| ------ | ------------------ | ------------------------------------------------------------- |
| `POST` | `/api/auth/login`  | Sign a user in.                                               |
| `POST` | `/api/auth/signup` | Create a new account.                                         |
| `POST` | `/api/auth/logout` | End the current session.                                      |
| `GET`  | `/api/auth/me`     | Read the current session, including role and contact details. |

### Renter actions

| Method  | Route                | Use                                                                  |
| ------- | -------------------- | -------------------------------------------------------------------- |
| `POST`  | `/api/tools/book`    | Create a booking request. The chatbot should gate this behind login. |
| `PATCH` | `/api/bookings/[id]` | Cancel a renter booking.                                             |

### Owner actions

| Method  | Route                        | Use                                                       |
| ------- | ---------------------------- | --------------------------------------------------------- |
| `PATCH` | `/api/owner/properties/[id]` | Update a property owned by the logged-in owner.           |
| `PATCH` | `/api/owner/bookings/[id]`   | Confirm or cancel a pending booking on an owned property. |

## Suggested Chatbot Flow

1. Start with `/api/tools/search` for anonymous property discovery.
2. Use `/api/tools/details` when the user asks for more information about a specific property.
3. Before booking, prompt the user to log in and confirm the session through `/api/auth/me`.
4. After login, call `/api/tools/book` for renter bookings.
5. If the user is an owner, fetch their session with `/api/auth/me`, then allow property editing and approval actions through the owner routes.
6. Keep the UI theme-aware so the chatbot preview follows the app's light and dark mode switcher.

## Reserved Integration Point

The old owner message queue concept is intentionally not part of the active chatbot contract in this repository. If a future team wants to add a dedicated owner inbox or external chatbot handoff, they can define that contract separately without changing the current UI shell.

## UI Notes For Future Work

1. Keep the chat shell branded as the LebihMudah platform chatbot.
2. Do not label the experience as WhatsApp.
3. Use light and dark theme variants so the preview matches the global theme toggle.
4. Keep search-related hints visible before login, but require login copy once the user asks the chatbot to book or manage owner data.
