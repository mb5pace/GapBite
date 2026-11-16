import { z } from "zod";
import { ACCOUNT_COPY } from "@/data/account-copy";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { FEEDBACK_TEXT_MAX, INPUT_MAX } from "@/lib/config";
import { submitFeedback } from "@/lib/feedback";
import { getOrderForBuyer } from "@/lib/orders";
import { getUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    rating: z.number(ACCOUNT_COPY.feedback.pickAFace).int(ACCOUNT_COPY.feedback.pickAFace).min(1, ACCOUNT_COPY.feedback.pickAFace).max(5, ACCOUNT_COPY.feedback.pickAFace),
    text: z.string().max(FEEDBACK_TEXT_MAX, ACCOUNT_COPY.feedback.tooLong).optional(),
    orderId: z.string(ACCOUNT_COPY.feedback.notYourOrder).max(INPUT_MAX.id, ACCOUNT_COPY.feedback.notYourOrder).optional(),
  })
  .strict();

/** POST { rating 1-5, text?, orderId? } -> saved for the team. An orderId must be one of the sender's own orders. One every few seconds per person. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireApiSession("student", { user: true });
    const { rating, text, orderId } = await parseBody(req, schema);
    const userId = session.userId as string;
    const order = orderId ? await getOrderForBuyer(orderId, userId) : null;
    if (orderId && !order) throw new AppError(400, ACCOUNT_COPY.feedback.notYourOrder);
    const user = await getUser(userId);
    await submitFeedback({ userId, role: user?.role ?? "student", rating, text: (text ?? "").trim(), ...(order ? { orderId: order.order.id } : {}) }, Date.now());
    return ok({ saved: true });
  });
}
