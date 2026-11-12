"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { COPY } from "@/data/copy";
import { Input } from "@/components/ui/Input";
import { PillButton } from "@/components/ui/PillButton";
import { FIRST_NAME_MAX } from "@/lib/config";
import { postJson } from "@/lib/http";

type Mode = "student" | "staff";
type IdentifyReply = { status: "needs-name" } | { status: "ok"; next: string; name: string };

/** "Who's ordering?" A student gives an AU number (and a first name the first time). Staff give their ID. */
export function IdentifyForm() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("student");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // When the first-name field appears, put the cursor in it.
  useEffect(() => {
    if (needsName) nameRef.current?.focus();
  }, [needsName]);

  function switchMode(next: Mode) {
    setMode(next);
    setId("");
    setName("");
    setNeedsName(false);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    const body =
      mode === "staff"
        ? { kind: "staff" as const, id }
        : { kind: "student" as const, id, ...(needsName ? { name } : {}) };

    const res = await postJson<IdentifyReply>("/api/auth/identify", body);
    if (res.ok && res.data?.status === "ok") {
      router.replace(res.data.next);
      return; // stay busy until the next page loads
    }
    if (res.ok && res.data?.status === "needs-name") {
      setNeedsName(true);
    } else {
      setError(res.error ?? COPY.common.network);
    }
    setBusy(false);
  }

  const idLabel = mode === "staff" ? COPY.identify.staffLabel : COPY.identify.auLabel;
  const canSubmit = id.trim() !== "" && (!needsName || name.trim() !== "");

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <Input
        label={idLabel}
        placeholder={mode === "staff" ? COPY.identify.staffPlaceholder : COPY.identify.auPlaceholder}
        hint={mode === "staff" ? COPY.identify.staffHint : COPY.identify.auHint}
        value={id}
        onChange={(e) => {
          setId(e.target.value);
          if (error) setError("");
        }}
        error={mode === "staff" || !needsName ? error : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        name="user-id"
      />

      {mode === "student" && needsName ? (
        <Input
          ref={nameRef}
          label={COPY.identify.nameLabel}
          hint={COPY.identify.nameHint}
          value={name}
          maxLength={FIRST_NAME_MAX}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          error={error}
          autoComplete="given-name"
          name="first-name"
        />
      ) : null}

      <PillButton type="submit" arrow full disabled={busy || !canSubmit} aria-busy={busy}>
        {COPY.identify.button}
      </PillButton>

      <button
        type="button"
        onClick={() => switchMode(mode === "staff" ? "student" : "staff")}
        className="mx-auto min-h-11 rounded-pill px-4 text-secondary font-medium text-maroon underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
      >
        {mode === "staff" ? COPY.identify.switchToStudent : COPY.identify.switchToStaff}
      </button>
    </form>
  );
}
