// api/usechaplin.js
import { waitUntil } from "@vercel/functions";
import { withCorsEdge } from "../lib/withCorsEdge.js";
import { db } from "../lib/firebase.js";
import { executeWorkgroupStream } from "../lib/workgroupEngine.js";
import crypto from "crypto";

function makeSignature(clientSessionId, chaplin_id, input) {
  const raw = `${String(clientSessionId || "anon")}::${chaplin_id}::${String(input || "")}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

const encoder = new TextEncoder();

async function backgroundRun(jobId) {
  const jobRef = db.ref(`chaplin_jobs/${jobId}`);
  const jobSnap = await jobRef.once("value");
  const job = jobSnap.val();
  if (!job) {
    console.warn(`[backgroundRun] job ${jobId} not found`);
    return;
  }

  if (job.status === "done") {
    console.log(`[backgroundRun] job ${jobId} already done`);
    return;
  }

  const chapSnap = await db.ref(`chaplin_full/${job.chaplin_id}`).once("value");
  const chap = chapSnap.val();
  if (!chap) {
    await jobRef.update({ status: "error", errorMessage: "chaplin not found", updatedAt: Date.now() });
    console.error(`[backgroundRun] chaplin ${job.chaplin_id} not found for job ${jobId}`);
    return;
  }

  const progressRef = jobRef.child("progress");

  try {
    await jobRef.update({ status: "running", executorStarted: true, updatedAt: Date.now() });
  } catch (e) { /* ignore metadata update errors */ }

  try {
    const gen = executeWorkgroupStream({
      input: job.input,
      workgroup: chap.workgroup,
      responseformat: chap.responseformat,
      options: {
        maxTokens: 800,
        temperature: 0.7,
        integratorMaxAttempts: 3,
        integratorMaxTokens: 900,
        integratorTemperature: 0.5,
      },
    });

    for await (const chunk of gen) {
      try {
        await progressRef.push({ ...chunk, ts: Date.now() });
      } catch (e) {
        console.warn("[backgroundRun] push failed:", e?.message || e);
      }

      if (chunk.type === "integrator_result") {
        try {
          const finalData = chunk.data?.final || null;
          await jobRef.update({ final: finalData, integrator: chunk.data || null, updatedAt: Date.now() });
        } catch (e) {
          console.warn("[backgroundRun] failed to write final:", e?.message || e);
        }
      }
    }

    try {
      await jobRef.update({ status: "done", finishedAt: Date.now(), updatedAt: Date.now() });
      await progressRef.push({ type: "done", ts: Date.now() });
      console.log(`[backgroundRun] job ${jobId} finished`);
    } catch (e) {
      console.warn("[backgroundRun] final update failed:", e?.message || e);
    }
  } catch (err) {
    console.error(`[backgroundRun] execution error for job ${jobId}:`, err);
    try {
      await jobRef.update({ status: "error", errorMessage: String(err?.message || err), updatedAt: Date.now() });
      await progressRef.push({ type: "error", data: { message: String(err?.message || err) }, ts: Date.now() });
    } catch (e) {
      console.warn("[backgroundRun] failed to persist error:", e?.message || e);
    }
  }
}

async function handler(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { chaplin_id, input, jobId: requestedJobId, clientSessionId } = body || {};

    if (!chaplin_id && !requestedJobId) {
      return new Response(JSON.stringify({ error: "Missing chaplin_id or jobId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (chaplin_id) {
      const chapSnap = await db.ref(`chaplin_full/${chaplin_id}`).once("value");
      if (!chapSnap.exists()) {
        return new Response(JSON.stringify({ error: "Chaplin not found" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const signature = makeSignature(clientSessionId, chaplin_id, input);
    const jobsRef = db.ref("chaplin_jobs");

    let jobId = null;
    if (requestedJobId) {
      const snap = await db.ref(`chaplin_jobs/${requestedJobId}`).once("value");
      if (snap.exists()) jobId = requestedJobId;
    }

    if (!jobId) {
      const newRef = jobsRef.push();
      jobId = newRef.key;
      const now = Date.now();
      await newRef.set({
        chaplin_id: chaplin_id || null,
        signature,
        input: input || null,
        ownerSession: clientSessionId || null,
        status: "queued",
        createdAt: now,
        updatedAt: now,
        executorStarted: false,
        executorOwner: null,
        final: null,
      });
      console.log(`[usechaplin] created job ${jobId}`);
    } else {
      console.log(`[usechaplin] reattach to job ${jobId}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        function send(obj) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          } catch (e) {
            console.warn("[usechaplin] enqueue failed (client maybe disconnected):", e?.message || e);
          }
        }

        // cleanup closure
        let cleaned = false;
        let childHandler = null;
        let statusHandler = null;
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          try {
            if (progressRef && childHandler) progressRef.off("child_added", childHandler);
          } catch (e) {}
          try {
            if (jobRef && statusHandler) jobRef.child("status").off("value", statusHandler);
          } catch (e) {}
        };

        // send start
        send({ type: "start", chaplin_id, jobId });

        const jobRef = db.ref(`chaplin_jobs/${jobId}`);
        const progressRef = jobRef.child("progress");

        // replay existing history
        try {
          const histSnap = await progressRef.once("value");
          const hist = histSnap.val();
          if (hist) {
            Object.keys(hist).forEach((k) => send(hist[k]));
            console.log(`[usechaplin] replayed ${Object.keys(hist).length} history items for ${jobId}`);
          } else {
            console.log(`[usechaplin] no history for ${jobId}`);
          }
        } catch (e) {
          console.warn("[usechaplin] failed to read history:", e?.message || e);
        }

        // quick final check for already-done job
        try {
          const jobSnapNow = await jobRef.once("value");
          const jobNow = jobSnapNow.val() || {};
          const histSnap2 = await progressRef.once("value");
          const hist2 = histSnap2.val();
          const hasHist = hist2 && Object.keys(hist2).length > 0;
          if (!hasHist && jobNow.status === "done" && jobNow.final) {
            send({ type: "integrator_result", data: { final: jobNow.final, validation: jobNow.integrator || null } });
            try {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (e) {}
            try {
              controller.close();
            } catch (e) {}
            cleanup();
            return;
          }
        } catch (e) {
          console.warn("[usechaplin] quick final check failed", e?.message || e);
        }

        // try to claim executor
        let txnResult = null;
        try {
          txnResult = await jobRef.child("executorStarted").transaction((current) => {
            if (current) return;
            return true;
          }, undefined, false);
        } catch (e) {
          console.warn("[usechaplin] transaction error:", e?.message || e);
        }

        const weStarted = txnResult && txnResult.committed === true;
        if (weStarted) {
          try {
            await jobRef.update({
              executorStarted: true,
              executorOwner: clientSessionId || "vercel-invoker",
              status: "running",
              updatedAt: Date.now(),
            });
          } catch (e) {}
          try {
            waitUntil(backgroundRun(jobId));
            console.log(`[usechaplin] scheduled backgroundRun via waitUntil for ${jobId}`);
          } catch (e) {
            console.warn("[usechaplin] waitUntil scheduling failed:", e?.message || e);
          }
        } else {
          console.log(`[usechaplin] did not win executor for ${jobId}`);
        }

        // attach listeners
        childHandler = (snap) => {
          const chunk = snap.val();
          send(chunk);
          if (chunk && chunk.type === "done") {
            try {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (e) {}
            try {
              controller.close();
            } catch (e) {}
            cleanup();
          }
        };
        try {
          progressRef.on("child_added", childHandler);
        } catch (e) {
          console.warn("[usechaplin] failed attach child_added", e?.message || e);
        }

        statusHandler = (snap) => {
          const s = snap.val();
          if (s === "done") {
            try {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (e) {}
            try {
              controller.close();
            } catch (e) {}
            cleanup();
          }
        };
        try {
          jobRef.child("status").on("value", statusHandler);
        } catch (e) {
          console.warn("[usechaplin] failed attach status", e?.message || e);
        }

        // expose nothing else: cleanup will be used on close/done
      },

      cancel(reason) {
        // If consumer aborts, remove DB listeners via the cleanup closure in start
        // (start's cleanup is in scope and will run when we close in that path).
        // We can't directly call cleanup from here (different scope), but listeners
        // will be removed by the stream close path above when appropriate in our code.
        // If you want explicit logging for cancel, add it here:
        console.log("[usechaplin] stream cancel called, reason:", reason);
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
    console.error("[usechaplin] setup error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const OPTIONS = withCorsEdge(async () => new Response(null, { status: 204 }));
export const POST = withCorsEdge(handler);
