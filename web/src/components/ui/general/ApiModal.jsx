import React, { useState, useRef, useEffect } from "react";
import { Copy, X } from "lucide-react";

function ApiModal({ persona, onClose }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const urlTimerRef = useRef(null);
  const curlTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(urlTimerRef.current);
      clearTimeout(curlTimerRef.current);
    };
  }, []);

  const curlCommand = `curl '${persona.apiUrl}' \\
  -H 'x-persona-api-key: $PERSONA_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -X POST \\
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'`;

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  const handleCopyUrl = async () => {
    await copy(persona.apiUrl);
    setCopiedUrl(true);
    clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => setCopiedUrl(false), 1500);
  };

  const handleCopyCurl = async () => {
    await copy(curlCommand);
    setCopiedCurl(true);
    clearTimeout(curlTimerRef.current);
    curlTimerRef.current = setTimeout(() => setCopiedCurl(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 bg-[black/30] backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#26272B] rounded-2xl w-[700px] p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-md font-semibold text-[#E3E3E4]">API</h2>

          <button onClick={onClose} className="cursor-pointer pb-5">
            <X color="#BFBCBC" size={22} />
          </button>
        </div>
        <div className="w-full gap-0 border-t-1 border-[#303135] mt-1 mb-4"></div>


        <div className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              readOnly
              value={persona.apiUrl}
              className="bg-[#333437] w-full pl-4 pr-10 py-3.5 rounded-lg text-[#E3E3E4] text-sm font-mono"
            />
            <button
              onClick={handleCopyUrl}
              className="absolute top-1.5 right-2 p-2.5 rounded-full hover:bg-[#424344] cursor-pointer"
              title={copiedUrl ? "Copiado!" : "Copiar URL"}
              aria-label="Copiar URL"
            >
              <Copy color="#BFBCBC" size={15} />
            </button>
            {copiedUrl && (
              <span className="pointer-events-none absolute top-3 right-12 z-20 rounded bg-white/90 text-gray-900 text-xs px-2 py-1 shadow">
                Copied!
              </span>
            )}
          </div>

          <div className="bg-[#333437] text-white p-4 rounded-lg font-mono text-sm relative overflow-visible">
            <button
              onClick={handleCopyCurl}
              className="absolute top-1.5 right-2 p-2.5 rounded-full hover:bg-[#424344] cursor-pointer"
              title={copiedCurl ? "Copy!" : "Copy"}
              aria-label="Copiar comando cURL"
            >
              <Copy color="#BFBCBC" size={15} />
            </button>
            {copiedCurl && (
              <span className="pointer-events-none absolute top-3 right-12 z-20 rounded bg-white/90 text-gray-900 text-xs px-2 py-1 shadow">
                Copied!
              </span>
            )}
            <pre>
              <code>{curlCommand}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ApiModal;