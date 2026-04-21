import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_SESSION_DAYS } from "@/lib/auth";
import { loginUser } from "@/lib/services/authService";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      );
    }

    const session = await loginUser({
      email: body.email,
      password: body.password,
    });

    const response = NextResponse.json(session);
    response.cookies.set(AUTH_COOKIE_NAME, session.token, {
      ...cookieOptions,
      maxAge: AUTH_SESSION_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to log in: ${reason}` },
      { status: 401 },
    );
  }
}
