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

| Method  | Route                       | Use                                                                    |
| ------- | --------------------------- | ---------------------------------------------------------------------- |
| `POST`  | `/api/tools/book`           | Create a booking request. The chatbot should gate this behind login.   |
| `GET`   | `/api/renter/bookings`      | List the logged-in renter's bookings with property details and status. |
| `PATCH` | `/api/renter/bookings/[id]` | Cancel a renter booking.                                               |

### Owner actions

| Method  | Route                        | Use                                                       |
| ------- | ---------------------------- | --------------------------------------------------------- |
| `GET`   | `/api/owner/statistics`      | Get owner property and booking counts.                    |
| `GET`   | `/api/owner/properties`      | List the logged-in owner's properties.                    |
| `PATCH` | `/api/owner/properties/[id]` | Update a property owned by the logged-in owner.           |
| `PATCH` | `/api/owner/bookings/[id]`   | Confirm or cancel a pending booking on an owned property. |

## Suggested Chatbot Flow

1. Start with `/api/tools/search` for anonymous property discovery.
2. Use `/api/tools/details` when the user asks for more information about a specific property.
3. Before booking, prompt the user to log in and confirm the session through `/api/auth/me`.
4. After login, call `/api/tools/book` for new renter booking requests.
5. When the user asks about existing reservations, call `/api/renter/bookings` to list their bookings and `/api/renter/bookings/[id]` to cancel one.
6. If the user is an owner, fetch their session with `/api/auth/me`, then use `/api/owner/statistics` for a quick summary and `/api/owner/properties` to list owned properties before allowing property editing and approval actions through the owner routes.
7. Keep the UI theme-aware so the chatbot preview follows the app's light and dark mode switcher.

## Renter Booking Tool

Use `/api/renter/bookings` when the chatbot needs to surface a renter's reservation history.

Each returned item includes booking fields plus property details such as:

- `propertyTitle`
- `propertyLocation`
- `propertyImage`
- `propertyPrice`
- `propertyRooms`
- `propertyPetsAllowed`
- `propertyAvailabilityDate`
- `moveInDate`
- `moveOutDate`
- `status`

Use `/api/renter/bookings/[id]` to cancel one of those bookings when the user confirms the action.

## Owner Statistics Tool

Use `/api/owner/statistics` when the chatbot needs a quick owner dashboard summary.

The response groups counts into two blocks:

- `properties.overall` for the total number of owned properties.
- `bookings.overall`, `bookings.pending`, `bookings.booked`, and `bookings.cancelled` for the owner's booking totals.

In chatbot wording, `booked` means confirmed bookings.

## Reserved Integration Point

The old owner message queue concept is intentionally not part of the active chatbot contract in this repository. If a future team wants to add a dedicated owner inbox or external chatbot handoff, they can define that contract separately without changing the current UI shell.

## UI Notes For Future Work

1. Keep the chat shell branded as the LebihMudah platform chatbot.
2. Do not label the experience as WhatsApp.
3. Use light and dark theme variants so the preview matches the global theme toggle.
4. Keep search-related hints visible before login, but require login copy once the user asks the chatbot to book or manage owner data.
