

import GeminiBase from "./GeminiBase.js";

export default class GeminiFlashLiteModel extends GeminiBase {
  constructor(opts = {}) {
    super({ ...opts, modelName: opts.modelName || process.env.GEMINI_FLASH_MODEL || "gemini-flash-lite-lastest" });
    this.key = opts.key || "geminiflashlite";
  }


}
