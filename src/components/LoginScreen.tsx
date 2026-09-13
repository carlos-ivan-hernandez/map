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
    <div className="flex h-full w-full items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>Map</Card.Title>
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
              <Input placeholder="you@example.com" />
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
              <Input placeholder="••••••••" />
              <FieldError />
            </TextField>

            {!isSupabaseConfigured && (
              <p className="text-sm text-warning">
                Supabase isn't configured yet — add <code>VITE_SUPABASE_URL</code> and{" "}
                <code>VITE_SUPABASE_KEY</code> to <code>.env.local</code>.
              </p>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
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
