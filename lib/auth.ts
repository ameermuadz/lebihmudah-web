import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "lebihmudah_session";
export const AUTH_SESSION_DAYS = 30;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(keyBuffer, derivedKey);
};

export const createSessionToken = () => randomBytes(32).toString("hex");
export const createSessionId = () => randomUUID();

export const getSessionExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + AUTH_SESSION_DAYS);
  return expiresAt;
};
