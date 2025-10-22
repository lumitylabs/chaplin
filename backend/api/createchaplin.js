// api/createchaplin.js
import { withMiddleware } from "../lib/withMiddleware.js";
import { withCors } from "../lib/withCors.js";
import { db } from "../lib/firebase.js";
import { validatePersona, validateResponseFormat, validateWorkgroup } from "../lib/validators.js";

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

async function createChaplinHandler(req, res) {
  try {
    const {
      name, category, imagebase64, instructions, description,
      responseformat, workgroup
    } = req.body;
    
    // Em um ambiente de produção, o middleware de autenticação anexaria o usuário ao `req`.
    // Ex: export const requireAuth = (req) => { req.user = await verifyToken(req.headers.authorization); }
    const creator_id = req.user?.id || "anonymous_user"; // Usando "anonymous" como fallback


    validatePersona({ name, category, description, instructions });
    validateResponseFormat(responseformat);
    validateWorkgroup(workgroup);
    if (!instructions) throw new ValidationError("Missing required field: instructions");

    const newChaplinRef = db.ref('chaplin_full').push();
    const chaplin_id = newChaplinRef.key;

    const now = new Date().toISOString();

    const fullChaplinData = {
      name,
      category,
      imagebase64: imagebase64 || null,
      instructions,
      description,
      responseformat,
      workgroup,
      creator_id,
      visibility: 'public',
      created_at: now
    };


    const simpleChaplinData = {
      name,
      category,
      imagebase64: imagebase64 || null,
      instructions,
      creator_id
    };

    const userChaplinEntry = { [chaplin_id]: true };

    const updates = {};
    updates[`/chaplin_full/${chaplin_id}`] = fullChaplinData;
    updates[`/chaplins/${chaplin_id}`] = simpleChaplinData;
    updates[`/users/${creator_id}/chaplins/${chaplin_id}`] = true;

    // Executa a atualização atômica
    await db.ref().update(updates);

    return res.status(201).json({ 
      message: "Chaplin created successfully",
      chaplin_id: chaplin_id 
    });

  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    console.error("createChaplinHandler error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}

export default withCors(withMiddleware(createChaplinHandler, {
  allowedMethods: ["POST"],
  requireJson: true,
  parseJson: true,
  maxBodyBytes: 500 * 1024,

}));