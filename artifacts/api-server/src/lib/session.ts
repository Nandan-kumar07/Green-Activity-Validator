export function getSessionCookieOptions() {
  return {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
      | "none"
      | "lax"
      | "strict",
    path: "/",
  };
}

export const SESSION_COOKIE_NAME = "connect.sid";
