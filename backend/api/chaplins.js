// api/chaplins.js
import { withMiddleware } from "../lib/withMiddleware.js";
import { withCors } from "../lib/withCors.js";
import { db } from "../lib/firebase.js";

async function getChaplinsHandler(req, res) {
  try {
    const chaplinsRef = db.ref('chaplins');
    const snapshot = await chaplinsRef.once('value');
    const chaplins = snapshot.val() || {};

    return res.status(200).json(chaplins);
  } catch (err) {
    console.error("getChaplinsHandler error:", err);
    return res.status(500).json({ error: "Failed to fetch Chaplins.", detail: err.message });
  }
}

export default withCors(withMiddleware(getChaplinsHandler, {
  allowedMethods: ["GET"],
}));