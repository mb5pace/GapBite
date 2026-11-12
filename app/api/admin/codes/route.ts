import { z } from "zod";
import { COPY } from "@/data/copy";
import { AppError, handle, ok, parseBody } from "@/lib/api";
import { requireApiSession } from "@/lib/auth";
import { ACCESS_CODE_LENGTH } from "@/lib/config";
import {
  adminSnapshot,
  endTempSession,
  fillPool,
  formatCode,
  normalizeCode,
  permanentCodes,
  revokeTempCode,
} from "@/lib/codes";

export const dynamic = "force-dynamic";

/** GET -> permanent codes (masked) and the temporary pool. Tops the pool up first. */
export async function GET() {
  return handle(async () => {
    await requireApiSession("admin");
    return ok(await adminSnapshot(Date.now()));
  });
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate") }),
  z.object({ action: z.literal("revoke"), code: z.string().min(1).max(16) }),
  z.object({ action: z.literal("end"), code: z.string().min(1).max(16) }),
  z.object({ action: z.literal("reveal"), index: z.number().int().min(0).max(99) }),
]);

/**
 * POST { action }:
 * generate (refill the pool), revoke (unused code), end (active session),
 * reveal (one permanent code in full, only when the admin asks for it).
 */
export async function POST(req: Request) {
  return handle(async () => {
    await requireApiSession("admin");
    const input = await parseBody(req, schema);
    const now = Date.now();

    if (input.action === "reveal") {
      const code = permanentCodes()[input.index];
      if (!code) throw new AppError(404, COPY.admin.slotEmpty);
      const plain = normalizeCode(code);
      return ok({ code: plain.length === ACCESS_CODE_LENGTH ? formatCode(plain) : code });
    }

    if (input.action === "revoke") {
      const revoked = await revokeTempCode(normalizeCode(input.code), now);
      if (!revoked) throw new AppError(409, COPY.admin.codeNotUnused);
    } else if (input.action === "end") {
      const ended = await endTempSession(normalizeCode(input.code), now);
      if (!ended) throw new AppError(409, COPY.admin.sessionAlreadyEnded);
    } else {
      await fillPool(now);
    }

    return ok(await adminSnapshot(Date.now()));
  });
}
