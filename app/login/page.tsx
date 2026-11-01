"use client";

import { useActionState } from "react";
import { CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logIn, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(logIn, initialState);

  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
          >
            <CalendarCheck2 className="size-7" />
          </span>
          <h1 className="text-heading mt-5 text-4xl italic">Day Planner</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your private space to plan the week, close each day, and move your
            goals forward.
          </p>
        </div>

        <form
          action={formAction}
          className="rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="mt-4 grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {state.error ? (
            <p className="mt-3 text-sm font-medium text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="mt-6 w-full" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This is a private planner — no account creation, by design.
        </p>
      </div>
    </main>
  );
}
