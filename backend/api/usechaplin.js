// api/usechaplin.js
import { withMiddleware } from "../lib/withMiddleware.js";
import { withCors } from "../lib/withCors.js";
import { db } from "../lib/firebase.js";
import { runWorkgroupAndIntegrateStream } from "../lib/workgroupEngine.js";

async function useChaplinHandler(req, res) {
  try {
    const { chaplin_id, input } = req.body;

    if (!chaplin_id || !input) {
      return res.status(400).json({ error: "Missing chaplin_id or input" });
    }

    const chaplinRef = db.ref(`chaplin_full/${chaplin_id}`);
    const snapshot = await chaplinRef.once('value');
    const chaplinData = snapshot.val();

    if (!chaplinData) {
      return res.status(404).json({ error: "Chaplin not found" });
    }

    const { workgroup, responseformat } = chaplinData;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendChunk = (chunk) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    };

    const options = {
      maxTokens: 800,
      temperature: 0.7,
      integratorMaxAttempts: 3,
      integratorMaxTokens: 900,
      integratorTemperature: 0.5
    };

    await runWorkgroupAndIntegrateStream({
      input,
      workgroup,
      responseformat,
      options,
      onChunk: sendChunk
    });

    sendChunk({ type: 'done' });
    res.end();

  } catch (err) {
    console.error("useChaplinHandler error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error", detail: err.message });
    }
    res.end();
  }
}

export default withCors(withMiddleware(useChaplinHandler, {
  allowedMethods: ["POST"],
  requireJson: true,
  parseJson: true,
}));