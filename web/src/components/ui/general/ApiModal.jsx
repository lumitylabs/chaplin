import React, { useState, useRef, useEffect } from "react";
import CloseIcon from "../../../assets/close_icon.svg";
import CopyIcon from "../../../assets/copy_icon.svg";

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
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#EFEFEF] rounded-2xl w-[700px] p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#333]">API</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <img src={CloseIcon} alt="" />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            readOnly
            value={persona.apiUrl}
            className="bg-white w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 text-gray-700 font-mono"
          />
          <button
            onClick={handleCopyUrl}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-gray-100 text-gray-600"
            title={copiedUrl ? "Copiado!" : "Copiar URL"}
            aria-label="Copiar URL"
          >
            <img src={CopyIcon} className="w-4 h-4" alt="Copiar" />
          </button>
          {copiedUrl && (
            <span className="pointer-events-none absolute -top-7 right-2 z-20 rounded bg-gray-800 text-white text-xs px-2 py-1 shadow">
              Copied!
            </span>
          )}
        </div>

        <div className="bg-[#292929] text-white p-4 rounded-lg font-mono text-sm relative overflow-visible">
          <button
            onClick={handleCopyCurl}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
            title={copiedCurl ? "Copiado!" : "Copiar comando"}
            aria-label="Copiar comando cURL"
          >
            <img src={CopyIcon} className="w-4 h-4" alt="" />
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
  );
}

export default ApiModal;