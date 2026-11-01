import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "planner_session";
const SESSION_TOKEN = "planner-session-ok";

export function proxy(request: NextRequest) {
  const authed =
    request.cookies.get(SESSION_COOKIE)?.value === SESSION_TOKEN;

  if (!authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tasks"],
};
