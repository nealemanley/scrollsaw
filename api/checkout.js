const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.STRIPE_SECRET_KEY;
  
  if (!key) return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY env variable" });
  if (!key.startsWith("sk_")) return res.status(500).json({ error: "Invalid key format: " + key.slice(0, 8) });

  const stripe = new Stripe(key);

  try {
    const { userId, userEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${req.headers.origin}/app?payment=success`,
      cancel_url: `${req.headers.origin}/app?payment=cancelled`,
      customer_email: userEmail || undefined,
      metadata: { userId: userId || "" },
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
