/**
 * Browser-side fetch helpers for the { ok, data } / { ok: false, error } API.
 * No Redis and no server code in here, so client components can import it.
 */
import { COPY } from "@/data/copy";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/** The session ended (or was ended by Admin): back to the gate with the standard message. */
function backToGate(): void {
  window.location.replace("/?ended=1");
}

async function parse<T>(res: Response): Promise<ApiResult<T>> {
  try {
    const body = (await res.json()) as { ok: boolean; data?: T; error?: string };
    return { ok: body.ok, status: res.status, data: body.data, error: body.error };
  } catch {
    return { ok: false, status: res.status, error: COPY.common.network };
  }
}

/**
 * POST JSON. A 401 sends the person back to the gate, except on the gate's own
 * login call, where a 401 just means the code was wrong.
 */
export async function postJson<T>(
  url: string,
  body: unknown,
  options: { redirectOn401?: boolean } = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (res.status === 401 && options.redirectOn401 !== false) backToGate();
    return await parse<T>(res);
  } catch {
    return { ok: false, status: 0, error: COPY.common.network };
  }
}

/** For SWR: returns the data, or throws an Error with a sentence the person can read. */
export async function getJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch {
    throw new Error(COPY.common.network);
  }
  if (res.status === 401) backToGate();
  const result = await parse<T>(res);
  if (!result.ok || result.data === undefined) throw new Error(result.error ?? COPY.common.network);
  return result.data;
}
