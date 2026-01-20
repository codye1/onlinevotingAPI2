# OnlineVoting API

Backend API for an online voting app. Includes JWT auth (access + refresh), polls management (create/list/details/vote/results), and PostgreSQL persistence via Prisma.

## Tech stack

- Node.js + TypeScript
- Express
- PostgreSQL
- Prisma (adapter `@prisma/adapter-pg`)
- JWT (`jsonwebtoken`), password hashing: `bcrypt`
- Validation: `zod`

## Requirements

- Node.js 18+ (recommended 20+)
- PostgreSQL

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the project root (example below).

3. Apply Prisma migrations:

```bash
npx prisma migrate dev
```

4. Run the server in dev mode:

```bash
npm run dev
```

Default URL: `http://localhost:3000`.

## Environment variables

Create `.env` in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# CORS allow-list (comma separated)
# Example: http://localhost:5173,http://localhost:3000
CORS=http://localhost:5173

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/onlinevoting?schema=public

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

Notes:

- `CORS` is a comma-separated allow-list of origins. If the request has no origin (e.g., Postman), it is allowed.
- The refresh token is stored in an httpOnly cookie named `refreshToken`.

## Scripts

- `npm run dev` — start with nodemon
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` — Prettier

## API

Base URL: `http://localhost:<PORT>`

### Response format

Success:

```json
{ "ok": true, "message": "...", "...": "data" }
```

Error:

```json
{ "ok": false, "message": "..." }
```

Validation errors (Zod) return `422`:

```json
{ "ok": false, "message": "Validation error", "errors": { "field": ["..."] } }
```

### Authorization

Protected endpoints require:

`Authorization: Bearer <accessToken>`

Refresh token is stored in cookie `refreshToken` (httpOnly).

### Auth

#### POST `/register`

Body:

```json
{ "email": "user@example.com", "password": "P@ssw0rd!" }
```

Response: `accessToken` + sets `refreshToken` cookie.

#### POST `/login`

Body:

```json
{ "email": "user@example.com", "password": "P@ssw0rd!" }
```

Response: `accessToken` + `user` + sets `refreshToken` cookie.

#### POST `/logout`

Removes refresh token from DB and clears the cookie.

#### POST `/refresh`

Rotates tokens using the `refreshToken` cookie. Returns a new `accessToken` and sets a new refresh cookie.

### Polls

#### POST `/polls` (requires auth)

Body (validated by Zod):

```json
{
  "title": "My poll",
  "description": "Description (optional)",
  "image": "",
  "type": "MULTIPLE",
  "options": [{ "title": "Option 1", "file": null }],
  "resultsVisibility": "ALWAYS",
  "category": "Технології",
  "changeVote": true,
  "voteInterval": "0",
  "expireAt": null
}
```

- `type`: `MULTIPLE` or `IMAGE`
- For `MULTIPLE`: `options[].file` must be `null`
- For `IMAGE`: `options[].file` must be a valid URL
- `resultsVisibility`: `ALWAYS` | `AFTER_VOTE` | `AFTER_EXPIRE`
- `category` values are localized (Ukrainian strings) and should match the backend enum.
- `voteInterval` is treated as milliseconds (string/number) between votes for the same user.
- `expireAt` can be provided as an ISO datetime string; `null` means “no expiration”.

#### GET `/polls` (auth optional)

Query params:

- `pageSize` (default: 10)
- `cursor` (id of the last item from previous page)
- `sortByVotes` (`asc` | `desc`) — sort by vote count
- `search` — search in `title` / `description`
- `category` — filter by category string (use `ALL` to disable)
- `filter`:
  - `ACTIVE` — not expired (expireAt is null or in the future)
  - `EXPIRED`/`CLOSED` — expired
  - `CREATED` — created by the current user
  - `PARTICIPATED` — where the current user has voted
  - `ALL`

Response includes `polls`, `hasMore`, `nextCursor`.

#### GET `/polls/:id` (auth optional)

Returns poll details and `userVote` (the latest vote of the current user if a token was provided).

#### POST `/polls/:id/votes` (requires auth)

Body:

```json
{ "optionId": "<pollOptionId>" }
```

Rules:

- If `changeVote=false`, changing the vote is forbidden
- If `voteInterval>0`, the user can vote again only after the interval passes

#### GET `/polls/:id/results` (auth optional)

Returns aggregated results per option (vote counts).

> Note: results availability depends on `resultsVisibility` (`AFTER_VOTE` requires at least one vote by the current user; `AFTER_EXPIRE` requires the poll to be expired).

## Examples (curl)

### Register

```bash
curl -i -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"P@ssw0rd!"}'
```

### Login

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"P@ssw0rd!"}'
```

### Create a poll

```bash
curl -i -X POST http://localhost:3000/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "title":"My poll",
    "description":"Description",
    "image":"",
    "type":"MULTIPLE",
    "options":[{"title":"Option 1","file":null},{"title":"Option 2","file":null}],
    "resultsVisibility":"ALWAYS",
    "category":"Технології",
    "changeVote":true,
    "voteInterval":"0",
    "expireAt":null,
    "expireAt":null
  }'
```

### Vote

```bash
curl -i -X POST http://localhost:3000/polls/<pollId>/votes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"optionId":"<optionId>"}'
```

### Refresh access token

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/refresh
```

## Data model (high-level)

- `User` (email/password)
- `RefreshToken` (relation to User)
- `Poll` (creatorId, title, type, resultsVisibility, changeVote, voteInterval, expireAt)
- `PollOption` (pollId, title, file?)
- `Vote` (pollId, optionId, voterId)

## Known caveats

- `resultsVisibility` is stored as a plain string in the DB; ensure client/server values match.
- Deleting a `User` cascades to their `Poll` records (`ON DELETE CASCADE`), and polls cascade to options/votes.
