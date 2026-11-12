"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { COPY } from "@/data/copy";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { CODE_INPUT_MAX } from "@/lib/config";
import { postJson } from "@/lib/http";

/** The single access-code field. The server decides which portal the code opens. */
export function GateForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!code.trim()) {
      setError(COPY.gate.codeRequired);
      return;
    }
    setBusy(true);
    setError("");
    const res = await postJson<{ next: string }>("/api/auth/login", { code }, { redirectOn401: false });
    if (res.ok && res.data) {
      router.replace(res.data.next);
      return; // stay busy until the next page loads
    }
    setError(res.error ?? COPY.common.network);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Input
        variant="code"
        label={COPY.gate.label}
        placeholder={COPY.gate.placeholder}
        value={code}
        maxLength={CODE_INPUT_MAX}
        onChange={(e) => {
          setCode(e.target.value);
          if (error) setError("");
        }}
        error={error}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="go"
        // The code is typed without the dash and in any case. Cafe and admin passwords go in the same box.
        name="access-code"
      />
      {notice && !error ? (
        <p role="status" className="px-2 text-secondary text-mocha">
          {notice}
        </p>
      ) : null}
      <PillButton type="submit" arrow full disabled={busy || code.trim() === ""} aria-busy={busy}>
        {COPY.gate.button}
      </PillButton>
    </form>
  );
}
