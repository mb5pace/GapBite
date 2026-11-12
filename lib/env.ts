/**
 * Reads a text setting from env, forgiving the usual copy-paste slips: spaces or
 * a newline around the value, or the whole value wrapped in quotes. Secrets are
 * only ever read here, on the server. Never log what this returns.
 */
export function envText(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  let value = raw.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' || first === "'") && first === last) value = value.slice(1, -1).trim();
  }
  return value === "" ? undefined : value;
}
