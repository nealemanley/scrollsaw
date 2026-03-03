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

  let event;

  try {
    // Read raw body
    const buf = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", c => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

    const sig = req.headers["stripe-signature"];

    // Try with signature verification first, fall back without for testing
    if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(buf.toString());
    }
  } catch (e) {
    console.error("Webhook parse error:", e.message);
    return res.status(400).json({ error: e.message });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const email = session.customer_details?.email || session.customer_email;

    console.log("Recording purchase for userId:", userId, "email:", email);

    try {
      const { error } = await supabase.from("purchases").upsert({
        user_id: userId || "unknown",
        email: email || "",
        stripe_session_id: session.id,
        purchased_at: new Date().toISOString(),
      });
      if (error) {
        console.error("Supabase error:", error.message);
        return res.status(500).json({ error: error.message });
      }
      console.log("Purchase saved successfully");
    } catch (e) {
      console.error("DB error:", e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(200).json({ received: true });
}
