### /create-order

## Razorpay Integration Demo

This repository is a minimal demo showing how to integrate Razorpay's payment gateway with a small Express server and a static client page.

The server exposes endpoints to create orders, return the public key, and verify payments using the Razorpay Node SDK.

## Folder Structure

```
├── .env
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── README.md
└── src/
  ├── index.js
  ├── index.html
  ├── payment-success.html
  ├── payment-failure.html
  └── config/
    └── razorpay.config.js
```

Files of interest:

- `src/index.js` — Express server (node, ES modules).
- `src/index.html` — Static client page which uses Razorpay Checkout.
- `src/config/razorpay.config.js` — Razorpay SDK initialization.
- `src/payment-success.html`, `src/payment-failure.html` — static pages shown after verification.
- `.env`, `.env.example` — environment variable files in the root.
- `package.json` — scripts and dependencies (uses `pnpm` by default if you use the repo's package manager).

## Features

- Create Razorpay orders from the server.
- Return the public key to the client (`/get-razorpay-key`).
- Verify payments server-side using HMAC signature comparison (`/payment-verification`).

## Prerequisites

- Node.js 18+ recommended.
- A Razorpay account with API credentials (Key ID and Key Secret).

## Environment

Create a `.env` file in the project root with the following variables:

```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
PORT=4001
```

Do NOT commit your `.env` or secrets to version control.

## Installation

Install dependencies (uses pnpm by default; npm also works):

```cmd
pnpm install
```

or with npm:

```cmd
npm install
```

## Running the project

Start the server (the `start` script uses `nodemon`):

```cmd
pnpm start
```

or with npm:

```cmd
npm start
```

By default the server listens on `PORT` (defaults to `4001`). Open `http://localhost:4001/` in your browser.

## API Endpoints

### List of API Endpoints

| Method | Path                    | Description                                                                  |
| ------ | ----------------------- | ---------------------------------------------------------------------------- |
| GET    | `/`                     | Serves the static `index.html` client.                                       |
| POST   | `/create-order`         | Creates a Razorpay order. Expects `{ "amount": <number> }` in JSON body.     |
| GET    | `/get-razorpay-key`     | Returns the Razorpay public key for client-side checkout.                    |
| POST   | `/payment-verification` | Verifies payment using Razorpay signature; serves success/failure HTML page. |

#### Example: Create Order

Request:

```json
{
  "amount": 500
}
```

Response:

```json
{
  "order": {
    "amount": 50000,
    "currency": "INR",
    "id": "order_xxx",
    "status": "created",
    ...
  }
}
```

#### Example: Get Razorpay Key

Response:

```json
{ "key": "your_public_key" }
```

#### Example: Payment Verification

Request:

```json
{
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx",
  "razorpay_signature": "signature_string"
}
```

Response:

- On success: Serves `payment-success.html`.
- On failure: Serves `payment-failure.html`.

## How the client works

The `index.html` page:

- Fetches `/get-razorpay-key` and posts to `/create-order`.
- Opens Razorpay Checkout using the returned order and key.
- Uses `callback_url: '/payment-verification'` — the server performs signature verification and renders success/failure pages.

Important: The `RAZORPAY_KEY_SECRET` must never be exposed to the client — verification happens on the server.

## Configuration (Razorpay SDK)

`config/razorpay.config.js` initializes the Razorpay instance with env variables:

```js
import Razorpay from 'razorpay';

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default instance;
```

## Troubleshooting

- "Amount is required" — ensure the client sends `{ amount: <number> }` in the POST body to `/create-order`.
- `create order` errors — confirm `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct and the account is active.
- Signature mismatch on verification — ensure the server computes HMAC using `razorpay_order_id + '|' + razorpay_payment_id` and compares hex digest against `razorpay_signature`.
