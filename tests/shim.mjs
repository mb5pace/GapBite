// Upstash REST stand-in backed by a local redis-server (RESP over TCP).
import http from "node:http";
import net from "node:net";
const RPORT = Number(process.env.RPORT || 6390);
function enc(args) {
  const parts = [Buffer.from(`*${args.length}\r\n`)];
  for (const a of args) {
    const b = Buffer.from(String(a));
    parts.push(Buffer.from(`$${b.length}\r\n`), b, Buffer.from("\r\n"));
  }
  return Buffer.concat(parts);
}
const MORE = Symbol("more");
function parse(buf, i) {
  if (i >= buf.length) throw MORE;
  const t = String.fromCharCode(buf[i]);
  const e = buf.indexOf("\r\n", i);
  if (e < 0) throw MORE;
  const line = buf.slice(i + 1, e).toString();
  if (t === "+") return [line, e + 2];
  if (t === "-") return [{ err: line }, e + 2];
  if (t === ":") return [Number(line), e + 2];
  if (t === "$") {
    const n = Number(line);
    if (n < 0) return [null, e + 2];
    if (buf.length < e + 2 + n + 2) throw MORE;
    return [buf.slice(e + 2, e + 2 + n).toString(), e + 2 + n + 2];
  }
  if (t === "*") {
    const n = Number(line);
    if (n < 0) return [null, e + 2];
    let j = e + 2;
    const out = [];
    for (let k = 0; k < n; k++) {
      const [v, nj] = parse(buf, j);
      out.push(v);
      j = nj;
    }
    return [out, j];
  }
  throw new Error("bad resp " + t);
}
function cmd(args) {
  return new Promise((res, rej) => {
    const s = net.connect(RPORT, "127.0.0.1");
    let buf = Buffer.alloc(0);
    s.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      try {
        const [v] = parse(buf, 0);
        s.end();
        res(v);
      } catch (x) {
        if (x !== MORE) {
          s.end();
          rej(x);
        }
      }
    });
    s.on("error", rej);
    s.write(enc(args));
  });
}
function b64(v) {
  if (typeof v === "string") return Buffer.from(v).toString("base64");
  if (Array.isArray(v)) return v.map(b64);
  return v;
}
async function one(args, b) {
  const v = await cmd(args);
  if (v && v.err) return { error: v.err };
  return { result: b ? b64(v) : v };
}
http
  .createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const b = (req.headers["upstash-encoding"] || "") === "base64";
    const data = JSON.parse(body || "[]");
    let out;
    if (req.url.startsWith("/pipeline") || req.url.startsWith("/multi-exec")) {
      out = [];
      for (const a of data) out.push(await one(a, b));
    } else out = await one(data, b);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(out));
  })
  .listen(Number(process.env.SPORT || 8790));
