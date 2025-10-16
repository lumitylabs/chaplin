

import GeminiBase from "./GeminiBase.js";

export default class GeminiProModel extends GeminiBase {
  constructor(opts = {}) {
    super({ ...opts, modelName: opts.modelName || process.env.GEMINI_PRO_MODEL || "gemini-2.5-pro" });
    this.key = opts.key || "geminipro";
  }

}
