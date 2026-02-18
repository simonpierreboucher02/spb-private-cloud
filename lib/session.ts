import { SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  userRole?: string;
  csrfToken?: string;
  pendingTwoFactor?: boolean;
  pendingUserId?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "spb-cloud-secret-key-change-in-production-min-32-chars",
  cookieName: "spb-cloud-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24,
  },
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
