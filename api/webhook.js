import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on("data", c => chunks.push(c));
      req.on("end", resolve);
      req.on("error", reject);
    });
    const raw = Buffer.concat(chunks);
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature error:", e.message);
    return res.status(400).json({ error: e.message });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const email = session.customer_email || session.customer_details?.email;
    console.log("Payment completed for userId:", userId, "email:", email);

    if (userId) {
      const { error } = await supabase.from("purchases").upsert({
        user_id: userId,
        email,
        stripe_session_id: session.id,
        purchased_at: new Date().toISOString(),
      });
      if (error) console.error("Supabase upsert error:", error.message);
      else console.log("Purchase recorded successfully");
    }
  }

  return res.status(200).json({ received: true });
}
