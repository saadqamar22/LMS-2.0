import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "auth-token";

export type Role = "student" | "teacher" | "parent" | "admin";

export interface SessionPayload extends JWTPayload {
  userId: string;
  role: Role;
  email: string;
  fullName: string;
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing AUTH_SECRET environment variable. Please set AUTH_SECRET in your environment (e.g., .env.local).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  const secret = getSecretKey();
  return await new SignJWT({
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    fullName: payload.fullName,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId as string | undefined;
    const role = payload.role as Role | undefined;
    const email = payload.email as string | undefined;
    const fullName = payload.fullName as string | undefined;

    if (!userId || !role || !email || !fullName) {
      return null;
    }

    return {
      ...payload,
      userId,
      role,
      email,
      fullName,
    } as SessionPayload;
  } catch (error) {
    console.warn("Failed to verify session token:", error);
    return null;
  }
}
