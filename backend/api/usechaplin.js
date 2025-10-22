// api/usechaplin.js
import { withCorsEdge } from "../lib/withCorsEdge.js";
import { db } from "../lib/firebase.js";
import { executeWorkgroupStream } from "../lib/workgroupEngine.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

async function handler(req) {
  try {
    const { chaplin_id, input } = await req.json();

    if (!chaplin_id || !input) {
      throw new ValidationError("Missing chaplin_id or input");
    }

    const chaplinRef = db.ref(`chaplin_full/${chaplin_id}`);
    const snapshot = await chaplinRef.once("value");
    const chaplinData = snapshot.val();

    if (!chaplinData) {
      throw new ValidationError("Chaplin not found");
    }

    const { workgroup, responseformat } = chaplinData;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(obj) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        }

        try {
          send({ type: "start", chaplin_id });

          const workgroupGenerator = executeWorkgroupStream({
            input,
            workgroup,
            responseformat,
            options: {
              maxTokens: 800,
              temperature: 0.7,
              integratorMaxAttempts: 3,
              integratorMaxTokens: 900,
              integratorTemperature: 0.5,
            },
          });

          for await (const chunk of workgroupGenerator) {
            send(chunk);
            await new Promise((r) => setTimeout(r, 50));
          }

          send({ type: "done" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Error during workgroup execution:", err);
          send({ type: "error", data: { message: err.message } });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Setup error:", err);
    const statusCode = err.name === "ValidationError" ? 400 : 500;
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ✅ EXPORTE O OPTIONS AQUI!
export const OPTIONS = withCorsEdge(async (req) => {
  return new Response(null, { status: 204 });
});

export const POST = withCorsEdge(handler);