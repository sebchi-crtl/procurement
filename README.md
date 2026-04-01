# Procurement OAuth Flow

This app uses a server-side OAuth flow:

- Browser never calls `/oauth2/token` directly
- Browser never stores `client_secret`
- Tokens are stored in secure `httpOnly` cookies
- Next.js routes handle code exchange, refresh, and logout

## Required environment variables

Set these in `.env`:

```bash
AUTH_ISSUER=http://134.209.20.12
AUTH_CLIENT_ID=procurement-client
AUTH_CLIENT_SECRET=replace-with-server-only-secret
AUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
APP_URL=http://localhost:3000
```

## Auth routes

- `GET /api/auth/login` - generates state + PKCE and redirects to authorize endpoint
- `GET /api/auth/callback` - validates state, exchanges code, stores cookies, redirects to `/dashboard`
- `POST /api/auth/refresh` - refreshes access token using refresh token cookie
- `POST /api/auth/logout` - clears auth cookies and redirects to `/login`

## Frontend behavior

- Login button sends user to `/api/auth/login`
- `fetchWithAutoRefresh` retries once after `POST /api/auth/refresh` when a request returns `401`
- `AuthRefreshDaemon` checks session expiry on load and every 60s, and refreshes if expiry is near

## Protected pages

- `proxy.ts` guards `/dashboard` and redirects unauthenticated users to `/login`

## Run locally

```bash
npm install
npm run dev
```
