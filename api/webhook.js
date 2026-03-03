import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 30 };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const raw = await getRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).json({ error: `Webhook error: ${e.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const email = session.customer_email || session.customer_details?.email;

    if (userId) {
      await supabase.from("purchases").upsert({
        user_id: userId,
        email,
        stripe_session_id: session.id,
        purchased_at: new Date().toISOString(),
      });
    }
  }

  res.status(200).json({ received: true });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
