# Sanchez Landscape (sanchezlandscape512.com)

This directory is the **GitHub repo root** and **Vercel project root** (do not set Root Directory to a nested `sanchez-landscape` folder in Vercel—there is no such folder in the repo).

## Contact / quote forms → Resend

- **API:** `api/send-form.js` — serverless route `POST /api/send-form`
- **Frontend:** `js/main.js` submits JSON to that route

### Environment variables (Vercel → Settings → Environment Variables)

| Name | Required | Notes |
|------|----------|--------|
| `RESEND_API_KEY` | Yes | From [Resend API keys](https://resend.com/api-keys) |
| `RESEND_FROM` | Yes | Verified sender, e.g. `Sanchez Landscape <noreply@yourdomain.com>` |
| `CONTACT_TO_EMAIL` | No | Comma/semicolon-separated inboxes (default: `sanchezlandscape512@gmail.com`) |
| `CONTACT_TO_EMAIL_2` | No | Optional second inbox |

Copy `.env.example` to `.env` for local use with `npx vercel dev`.

### Local dev

```bash
npm install
npx vercel dev
```

Do not open `index.html` as a `file://` URL if you need to test the forms—the API runs on the dev server.

### Repository

Remote: `https://github.com/Ottertrends/sanchez-landscape-site.git` (branch `main`).
