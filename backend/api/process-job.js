// /api/process-job.js
import { Redis } from "@upstash/redis";
import { Receiver } from "@upstash/qstash";
import { executeWorkgroupStream } from "../lib/workgroupEngine";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

async function handler(req, res) {
  let jobId = "unknown";
  let jobKey = `job:${jobId}`;

  try {
    const rawBody = await getRawBody(req);
    const isValid = await receiver.verify({
      signature: req.headers["upstash-signature"],
      body: rawBody,
    });

    if (!isValid) {
      return res.status(401).send("Invalid signature");
    }

    const body = JSON.parse(rawBody);
    jobId = body.jobId;
    jobKey = `job:${jobId}`;

    if (!jobId) {
      return res.status(400).send("Missing jobId");
    }

    console.log(`[Worker] Iniciando processamento do job: ${jobId}`);
    
    const jobDataArr = await redis.json.get(jobKey, "$");
    const jobData = jobDataArr && jobDataArr.length > 0 ? jobDataArr[0] : null;

    if (!jobData) {
      console.error(`[Worker] Job ${jobId} não encontrado no Redis.`);
      return res.status(404).send("Job not found");
    }
    
    if (jobData.status === 'running' || jobData.status === 'done' || jobData.status === 'failed') {
        console.warn(`[Worker] Job ${jobId} já está em um estado final ou em andamento (${jobData.status}). Ignorando.`);
        return res.status(200).send("Job already processed or in progress");
    }

    await redis.json.set(jobKey, "$.status", '"running"');
    

    const onProgressCallback = async (progressChunk) => {
        if (progressChunk) {
            try {
                await redis.json.arrappend(jobKey, "$.progress", progressChunk);
            } catch (e) {
                console.warn(`[Worker] Falha ao registrar progresso para o job ${jobId}:`, e.message);
            }
        }
    };

    const stream = executeWorkgroupStream({
        input: jobData.input,
        description: jobData.chaplinData.description,
        instructions: jobData.chaplinData.instructions,
        workgroup: jobData.chaplinData.workgroup,
        responseformat: jobData.chaplinData.responseformat,
        options: { 
            executorJobId: jobId,
            onProgress: onProgressCallback,
            existingProgress: jobData.progress || [] 
        },
    });


    for await (const chunk of stream) {

        await redis.json.arrappend(jobKey, "$.progress", chunk);
    }

    await redis.json.set(jobKey, "$.status", '"done"');
    console.log(`[Worker] Job ${jobId} finalizado com sucesso.`);

    res.status(200).send("OK");

  } catch (err) {
    console.error(`[Worker] Erro ao executar o job ${jobId}:`, err);
    await redis.json.set(jobKey, "$.status", '"failed"');
    await redis.json.set(jobKey, "$.error", `"${err.message}"`);
    
    res.status(500).send("Internal Server Error");
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

export default handler;