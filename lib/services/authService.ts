import { prisma } from "@/lib/db";
import {
  createSessionToken,
  getSessionExpiry,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  SignupPayload,
} from "@/lib/types";

const mapUser = (user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "USER" | "OWNER";
}): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const mapSession = (session: {
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "USER" | "OWNER";
  };
}): AuthSession => ({
  token: session.token,
  user: mapUser(session.user),
  expiresAt: session.expiresAt.toISOString(),
});

export async function signupUser(input: SignupPayload): Promise<AuthSession> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
  });

  if (existingUser) {
    throw new Error("Email already in use");
  }

  const passwordHash = hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() ? input.phone.trim() : null,
      role: "USER",
      passwordHash,
    },
  });

  const sessionToken = createSessionToken();
  const expiresAt = getSessionExpiry();

  const session = await prisma.session.create({
    data: {
      token: sessionToken,
      userId: user.id,
      expiresAt,
    },
    include: {
      user: true,
    },
  });

  return mapSession(session);
}

export async function loginUser(input: LoginPayload): Promise<AuthSession> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
  });

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  const sessionToken = createSessionToken();
  const expiresAt = getSessionExpiry();

  const session = await prisma.session.create({
    data: {
      token: sessionToken,
      userId: user.id,
      expiresAt,
    },
    include: {
      user: true,
    },
  });

  return mapSession(session);
}

export async function getSessionUser(token: string | undefined) {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { token } }).catch(() => undefined);
    }

    return null;
  }

  return {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: mapUser(session.user),
  } as AuthSession;
}

export async function revokeSession(token: string | undefined) {
  if (!token) {
    return;
  }

  await prisma.session.delete({ where: { token } }).catch(() => undefined);
}
