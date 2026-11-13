import { z } from "zod";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { FEEDBACK_TEXT_MAX } from "@/lib/config";
import { submitFeedback } from "@/lib/feedback";
import { getUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    rating: z.number(ACCOUNT_COPY.feedback.pickAFace).int(ACCOUNT_COPY.feedback.pickAFace).min(1, ACCOUNT_COPY.feedback.pickAFace).max(5, ACCOUNT_COPY.feedback.pickAFace),
    text: z.string().max(FEEDBACK_TEXT_MAX, ACCOUNT_COPY.feedback.tooLong).optional(),
  })
  .strict();

/** POST { rating 1-5, text? } -> saved for the team. One every few seconds per person. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { rating, text } = await parseBody(req, schema);
    const user = await getUser(session.userId as string);
    await submitFeedback({ userId: session.userId as string, role: user?.role ?? "student", rating, text: (text ?? "").trim() }, Date.now());
    return ok({ saved: true });
  });
}
