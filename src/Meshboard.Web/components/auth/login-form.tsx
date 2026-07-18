"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function LoginForm()
{
  const router = useRouter();

  const [m_username, setUsername] = useState("");
  const [m_password, setPassword] = useState("");
  const [m_isSubmitting, setIsSubmitting] = useState(false);
  const [m_error, setError] = useState<string | null>(null);

  async function HandleSubmit(event: FormEvent<HTMLFormElement>)
  {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try
    {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: m_username,
          password: m_password,
        }),
      });

      if (!response.ok)
      {
        if (response.status === 401)
        {
          throw new Error("Invalid username or password.");
        }

        throw new Error("Unable to sign in. Please try again.");
      }

      router.push("/boards");
      router.refresh();
    }
    catch (error)
    {
      setError(
          error instanceof Error
              ? error.message
              : "Unable to sign in. Please try again.");
    }
    finally
    {
      setIsSubmitting(false);
    }
  }

  return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent>
          <form className="space-y-5" onSubmit={HandleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="zach"
                  value={m_username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={m_password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
              />
            </div>

            {m_error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {m_error}
                </div>
            ) : null}

            <Button
                type="submit"
                className="w-full rounded-full"
                disabled={m_isSubmitting}
            >
              {m_isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
              ) : (
                  "Sign in"
              )}
            </Button>

            <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                onClick={() => window.location.href = "/api/auth/login/oidc"}
            >
              Sign in with OIDC
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}