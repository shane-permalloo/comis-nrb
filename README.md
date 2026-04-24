# COMIS – NRB Member Verification

An Angular + Express application that verifies member identity against the Malawi National Registration Bureau (NRB) API. Includes a mock NRB endpoint for development/testing and a frontend toggle to switch between mock data and the live NRB API.

## Prerequisites

- **Node.js** v18+ (LTS recommended)
- **npm** v9+
- **Angular CLI** — installed automatically via the frontend's devDependencies
- **Netlify CLI** (optional, for local full-stack dev or deployment): `npm i -g netlify-cli`

## Project Structure

```
comis-nrb/
├── backend/          # Express server (local dev) with mock NRB endpoint
├── frontend/         # Angular 21 + PrimeNG UI
├── netlify/functions/ # Netlify serverless function (production API)
├── netlify.toml      # Netlify build & redirect config
└── package.json      # Root deps for the Netlify function
```

## Local Setup

### 1. Install dependencies

```bash
# Root (needed for Netlify function deps)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure the backend environment

Create a `backend/.env` file:

```env
PORT=3000
CLIENT_ID=apiTest
CLIENT_KEY=FBE119F2
MIN_AGE=18
MOCK_NRB_URL=http://localhost:3000/mock/api/person

# Optional — set this to use the real NRB API instead of mock data:
# NRB_API_URL=https://real-nrb-endpoint.example.com/api/person
```

### 3. Start the backend

```bash
cd backend
npm start
```

The Express server starts on `http://localhost:3000`.

### 4. Start the frontend

In a separate terminal:

```bash
cd frontend
npm start
```

The Angular dev server starts on `http://localhost:4200`.

### 5. Open the app

Navigate to **http://localhost:4200** in your browser.

## Running with Netlify Dev (alternative)

This runs both the frontend and Netlify Functions locally with the same redirect rules as production:

```bash
npx netlify-cli dev
```

The app is available at `http://localhost:8888`.

## Switching Between Mock and Live NRB

The UI includes a **toggle switch** in the form header:

| Toggle state | Label       | Behaviour                                              |
|--------------|-------------|--------------------------------------------------------|
| OFF (default)| Mock Data   | Verifies against the built-in mock test data           |
| ON           | Live NRB    | Calls the real NRB API (requires `NRB_API_URL` to be set) |

If `NRB_API_URL` is not configured on the server, the toggle falls back to mock data regardless.

## Deploying to Netlify

```bash
npx netlify-cli login
npx netlify-cli link --name comis-nrb
npx netlify-cli deploy --prod
```

To enable the live NRB API in production, add `NRB_API_URL` as an environment variable in the Netlify dashboard under **Site settings → Environment variables**.

## Mock Test Data

The following NID codes are available for testing:

| NID        | Name            | Status             |
|------------|-----------------|--------------------|
| `MA845876` | LOVE GRACE      | VALID              |
| `AA55DDFF` | BRUCE PROMISE   | VALID              |
| `MINOR001` | TOM YOUNG       | VALID (Minor)      |
| `EXP00148` | JANE OLD        | EXPIRED            |
| `DEC00199` | BLACKNEZ POPE   | PERSON DECEASED    |
| `INV00122` | MARK BAD        | INVALID            |
| `REN00233` | SARAH RENEWED   | RENEWAL PROCESSED  |
| `SNR00344` | PETER FLAGGED   | SEE NRB            |