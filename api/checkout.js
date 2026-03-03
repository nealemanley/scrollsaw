module.exports = async function handler(req, res) {
  return res.status(200).json({ 
    stripe_key_start: (process.env.STRIPE_SECRET_KEY || "MISSING").slice(0, 15),
    node_version: process.version
  });
};
