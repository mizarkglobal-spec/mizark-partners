const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE = "https://api.paystack.co";

async function paystackRequest(path: string, method = "GET", body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack ${method} ${path} failed: ${text}`);
  }
  return res.json();
}

export async function initializeTransaction(opts: {
  email: string;
  amount: number; // in kobo (NGN × 100)
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}) {
  return paystackRequest("/transaction/initialize", "POST", opts);
}

export async function verifyTransaction(reference: string) {
  return paystackRequest(`/transaction/verify/${reference}`);
}

export async function createTransferRecipient(opts: {
  name: string;
  account_number: string;
  bank_code: string;
}) {
  return paystackRequest("/transferrecipient", "POST", {
    type: "nuban",
    currency: "NGN",
    ...opts,
  });
}

export async function initiateTransfer(opts: {
  amount: number; // kobo
  recipient: string; // recipient_code
  reason: string;
  reference: string;
}) {
  return paystackRequest("/transfer", "POST", { source: "balance", ...opts });
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const crypto = require("crypto");
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY!;
  const hash   = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature;
}
