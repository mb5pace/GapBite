"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { Banner } from "@/components/ui/Banner";
import { FaceRating } from "@/components/ui/FaceRating";
import { PillButton } from "@/components/ui/PillButton";
import { Textarea } from "@/components/ui/Textarea";
import { FEEDBACK_TEXT_MAX } from "@/lib/config";
import { postJson } from "@/lib/http";

/** The feedback form, used by Account › Feedback and Discover › Feedback: a 1 to 5 face rating and an optional comment. */
export function FeedbackForm() {
  const copy = ACCOUNT_COPY.feedback;
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (rating === 0) {
      setError(copy.pickAFace);
      return;
    }
    setBusy(true);
    setError("");
    const res = await postJson<{ saved: boolean }>("/api/feedback", { rating, text });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? copy.failed);
      return;
    }
    setSent(true);
  }

  function reset() {
    setRating(0);
    setText("");
    setError("");
    setSent(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card bg-parchment p-6 text-center" role="status">
        <span className="flex size-24 items-center justify-center rounded-pill bg-sand text-maroon" aria-hidden="true">
          <CheckCircle weight="regular" size={44} />
        </span>
        <h2 className="font-display text-title font-bold text-maroon">{copy.thanksTitle}</h2>
        <p className="text-body text-espresso">{copy.thanks}</p>
        <PillButton variant="secondary" onClick={reset}>
          {copy.again}
        </PillButton>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-5" noValidate>
      <h2 className="font-display text-section font-bold text-maroon">{copy.title}</h2>
      <FaceRating
        value={rating}
        onChange={(next) => {
          setRating(next);
          setError("");
        }}
        label={copy.ratingLabel}
        words={copy.faces}
        describe={copy.ratingOf}
        disabled={busy}
      />
      <Textarea
        label={copy.textLabel}
        hint={copy.textHint}
        value={text}
        maxLength={FEEDBACK_TEXT_MAX}
        onChange={(event) => setText(event.target.value)}
        disabled={busy}
      />
      {error ? <Banner tone="error">{error}</Banner> : null}
      <PillButton type="submit" full arrow disabled={busy} aria-busy={busy}>
        {busy ? copy.sending : copy.submit}
      </PillButton>
    </form>
  );
}
