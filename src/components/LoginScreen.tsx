import { useState, type FormEvent } from "react";
import { Button, Card, FieldError, Input, Label, TextField } from "@heroui/react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0b0f19] p-6">
      <Card className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>Drive Trail</Card.Title>
          <Card.Description>Sign in to record where you've been.</Card.Description>
        </Card.Header>

        <form onSubmit={onSubmit}>
          <Card.Content className="flex flex-col gap-4">
            <TextField
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
              isRequired
              fullWidth
            >
              <Label>Email</Label>
              <Input className="ring-1 ring-white/10" placeholder="you@example.com" />
              <FieldError />
            </TextField>

            <TextField
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete="current-password"
              isRequired
              fullWidth
            >
              <Label>Password</Label>
              <Input className="ring-1 ring-white/10" placeholder="••••••••" />
              <FieldError />
            </TextField>

            {!isSupabaseConfigured && (
              <p className="text-sm text-amber-400">
                Supabase isn't configured yet — add <code>VITE_SUPABASE_URL</code> and{" "}
                <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.
              </p>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </Card.Content>

          <Card.Footer>
            <Button type="submit" variant="primary" fullWidth isDisabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </Card.Footer>
        </form>
      </Card>
    </div>
  );
}
