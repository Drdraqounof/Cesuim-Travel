import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "session_user_id";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
  const [salt, hash] = storedValue.split(":");

  if (!salt || !hash) {
    return password === storedValue;
  }

  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");

  if (derived.length !== original.length) {
    return false;
  }

  return timingSafeEqual(derived, original);
}
