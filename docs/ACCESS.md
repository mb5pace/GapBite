# ACCESS — codes, sessions, identity

Nobody reaches any page except the gate without a valid session. There are no accounts with passwords for students; the access code proves you were invited and the AU number says who you are.

## The gate (`/`)

One input: "Enter your QuickX access code". The server decides which portal it opens:

| What was typed | Matches | Opens | Session length |
|---|---|---|---|
| One of the 5 permanent codes | env `QX_PERMANENT_CODES` | Identify screen → Student portal | 8 hours |
| An unused temporary code from the pool | Redis `codes:temp` | Identify screen → Student portal | 15 minutes |
| The cafe password | env `QX_CAFE_PASSWORD` | Cafe portal | 12 hours |
| The admin password | env `QX_ADMIN_PASSWORD` | Admin portal | 2 hours |
| Anything else | – | "That code doesn't work. Ask the QuickX team for a fresh one." | – |

Rate limit: 10 wrong tries per IP per 10 minutes (Redis counter), then "Too many tries, wait a few minutes."

## Permanent codes (5)

For the team's own demo devices. They never expire and can be used on any number of devices at the same time. Stored only in Vercel env as a comma-separated list, e.g. `QX_PERMANENT_CODES=XXXXXX,XXXXXX,XXXXXX,XXXXXX,XXXXXX` (the team picks the real values and never commits them). The Admin portal lists them masked (`K7••••`) with a reveal button.

## Temporary codes (pool of 6)

For classmates, panel members or teammates testing in parallel.

1. The pool always holds `TEMP_POOL_SIZE = 6` unused codes. On first use of the Admin portal (or when empty) the server fills it.
2. An **unused** code never expires. It waits in the pool until someone uses it.
3. When someone logs in with it, the code is **burned** immediately (cannot be used again, on any device), their session lasts 15 minutes, and the server generates one new code so the pool is back to 6.
4. When the 15 minutes end, the next request redirects to the gate with "Your session has ended. Ask for a new code." Any cart is lost; orders already placed continue normally and are still visible if they come back with a new code and the same AU number.
5. Admin can revoke an unused code (it is deleted and replaced) or end an active session early.

Code format: 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I), shown grouped as `K7Q-M2X`, typed without the dash, case-insensitive.

Code record in Redis (`codes:temp` hash, field = code):
```ts
{ code: string; status: "unused" | "active" | "burned" | "revoked"; createdAt: number; usedAt?: number; usedBy?: string; sessionEndsAt?: number }
```
Burn must be atomic (Lua or `HSETNX` on a `codes:used:<code>` key) so two devices typing the same code at once cannot both get in.

## Identify (`/identify`)

After a student-type code, ask "Who's ordering?":
1. **Student:** AU number, format `AU` + 7 digits (`/^AU\d{7}$/`, uppercase the input). First time only, also ask for first name (2–20 letters). Stored in Redis as the user record.
2. **Staff:** a link "I'm QuickX staff" switches the field to staff ID, format `QX-STF-` + 2 digits. Staff IDs must already exist (created in the Admin portal); unknown staff IDs are refused.

There is no password on the AU number. This is a prototype; the access code is the security. Show a one-line note in the footer of the identify screen: "Prototype: anyone with a code can enter any AU number."

## Sessions

A signed JWT (library `jose`, HS256, secret env `QX_SESSION_SECRET`) in an HttpOnly, Secure, SameSite=Lax cookie named `qx_session`:
```ts
{ portal: "student" | "cafe" | "admin"; codeType: "permanent" | "temp" | "cafe" | "admin"; code?: string; userId?: string; exp: number }
```
`middleware.ts` verifies the cookie on every route except `/`, `/api/auth/*` and static assets, and redirects by portal: `/cafe/**` needs `cafe`, `/admin/**` needs `admin`, the student routes need `student` plus a `userId` (otherwise redirect to `/identify`). API routes re-check the session themselves; never rely on middleware alone.

For temp-code sessions also check Redis that the code is still `active` (so Admin can end it early).

The Student portal header shows a small countdown chip only for temp sessions in their last 3 minutes ("2:41 left").

Logout (Account › Logout, and a button in Cafe and Admin headers) clears the cookie. For temp codes, logout does not give the code back; it stays burned.

## Staff accounts

Created only in Admin › Staff: name + auto ID (`QX-STF-01`, `-02`, …). Staff log in with any student-type access code, then "I'm QuickX staff" + their ID. Their profile shows a "Staff" badge everywhere their name appears.

## Environment variables

```
QX_PERMANENT_CODES      5 comma-separated codes
QX_CAFE_PASSWORD        cafe portal password
QX_ADMIN_PASSWORD       admin portal password
QX_SESSION_SECRET       32+ random characters
KV_REST_API_URL         set automatically by the Upstash integration (name may be UPSTASH_REDIS_REST_URL; support both)
KV_REST_API_TOKEN       set automatically (or UPSTASH_REDIS_REST_TOKEN)
```
