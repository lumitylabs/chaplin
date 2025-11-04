import { Redis } from "@upstash/redis";
import { Client } from "@upstash/qstash";
import { withCorsEdge } from "../lib/withCorsEdge"; // Supondo que você use isso para CORS

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
});

async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: 'jobId is required' }), { status: 400 });
    }

    const jobKey = `job:${jobId}`;
    const jobDataArr = await redis.json.get(jobKey, "$");
    const jobData = jobDataArr && jobDataArr.length > 0 ? jobDataArr[0] : null;

    if (!jobData) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
    }

    if (jobData.status !== 'failed') {
      return new Response(JSON.stringify({ error: `Job status is '${jobData.status}', not 'failed'. Cannot retry.` }), { status: 409 });
    }
    
    console.log(`[retry-job] Re-queuing job ${jobId}.`);

    const p = redis.pipeline();
    // 1. Resetar o status para 'queued'
    p.json.set(jobKey, "$.status", '"queued"');
    // 2. Limpar o erro antigo
    p.json.del(jobKey, "$.error");
    await p.exec();

    // 3. Publicar novamente na fila para ser processado
    await qstash.publishJSON({
      url: `${process.env.BACKEND_URL}/api/process-job`,
      body: { jobId },
      delay: 1, 
    });

    return new Response(JSON.stringify({ success: true, message: 'Job re-queued successfully.' }), { status: 200 });

  } catch (err) {
    console.error("[retry-job] Error:", err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', detail: err.message }), { status: 500 });
  }
}

export const OPTIONS = withCorsEdge(async () => new Response(null, { status: 204 }));
export const POST = withCorsEdge(handler);