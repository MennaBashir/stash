"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "planner_session";
const SESSION_TOKEN = "planner-session-ok";
const ALLOWED_EMAIL = "mennabashir00@gmail.com";
const ALLOWED_PASSWORD = "mennabashir00";

export type LoginState = { error?: string };

export async function logIn(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  if (email !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) {
    return { error: "Incorrect email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/tasks");
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
