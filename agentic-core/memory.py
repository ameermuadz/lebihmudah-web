from __future__ import annotations

import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "agent_memory.db"

GUEST_MEMORY: dict[str, list[dict[str, str]]] = {}

class SessionMemoryManager:
    """Stores and retrieves chat history grouped by session ID."""

    def __init__(self, db_path: str | Path = DEFAULT_DB_PATH) -> None:
        self.db_path = str(db_path)
        self._initialize_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize_schema(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_chat_history_session_id_id
                ON chat_history(session_id, id)
                """
            )

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """Appends a single message row for a session."""
        if session_id.startswith("guest-"):
            if session_id not in GUEST_MEMORY:
                GUEST_MEMORY[session_id] = []
            GUEST_MEMORY[session_id].append({"role": role, "content": content})
            return

        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO chat_history (session_id, role, content)
                VALUES (?, ?, ?)
                """,
                (session_id, role, content),
            )

    def get_history(self, session_id: str, limit: int | None = None) -> list[dict[str, str]]:
        """Returns chat history rows in chronological order for a session."""
        if session_id.startswith("guest-"):
            history = GUEST_MEMORY.get(session_id, [])
            if limit is not None and limit > 0:
                return history[-limit:]
            return history

        with self._connect() as connection:
            if limit is not None and limit > 0:
                rows = connection.execute(
                    """
                    SELECT role, content
                    FROM (
                        SELECT id, role, content
                        FROM chat_history
                        WHERE session_id = ?
                        ORDER BY id DESC
                        LIMIT ?
                    )
                    ORDER BY id ASC
                    """,
                    (session_id, limit),
                ).fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT role, content
                    FROM chat_history
                    WHERE session_id = ?
                    ORDER BY id ASC
                    """,
                    (session_id,),
                ).fetchall()

        return [{"role": str(row["role"]), "content": str(row["content"])} for row in rows]

    def clear_session(self, session_id: str) -> None:
        """Removes all messages for a session."""
        if session_id.startswith("guest-"):
            GUEST_MEMORY.pop(session_id, None)
            return

        with self._connect() as connection:
            connection.execute(
                """
                DELETE FROM chat_history
                WHERE session_id = ?
                """,
                (session_id,),
            )