import React, { useState, useRef, useEffect } from "react";
import { Copy, X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

function ApiModal({ persona, onClose }) {
  const [activeTab, setActiveTab] = useState("py");
  const [copiedKey, setCopiedKey] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  const apiUrl = `${API_BASE_URL}/usechaplin`;

  // --- Snippets de Código ---
  const codeSnippets = {
    curl: `curl -N -X POST '${apiUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "chaplin_id": "${persona.id}",
    "input": "Your message here..."
  }'`,
    js: `// Use in an async function
const response = await fetch('${apiUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chaplin_id: '${persona.id}',
    input: 'Your message here...',
  }),
});
// Handle the Server-Sent Events stream from response.body
// (See MDN docs for ReadableStream examples)`,
    py: `import requests
import json

api_url = '${apiUrl}'
payload = {
    'chaplin_id': '${persona.id}',
    'input': 'Your message here...'
}

with requests.post(api_url, json=payload, stream=True) as r:
    for line in r.iter_lines():
        if line.startswith(b'data:'):
            data = json.loads(line.decode('utf-8')[5:])
            print(data)`,
  };

  // --- Lógica de Cópia ---
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  const handleCopy = async (key, text) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // --- Renderização ---
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#26272B] rounded-2xl w-[700px] max-w-[90vw] p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho e Divisor (Layout Original) */}
        <div className="flex justify-between items-center">
          <h2 className="text-md font-semibold text-[#E3E3E4]">API</h2>
          <button onClick={onClose} className="cursor-pointer p-1">
            <X color="#BFBCBC" size={22} />
          </button>
        </div>
        <div className="w-full h-px bg-[#303135] mt-1 mb-4"></div>

        {/* Conteúdo Principal */}
        <div className="flex flex-col gap-4">
          {/* Campo de URL (Layout Original) */}
          <div className="relative">
            <input
              type="text"
              readOnly
              value={apiUrl}
              className="bg-[#333437] w-full pl-4 pr-12 py-3.5 rounded-lg text-[#E3E3E4] text-sm font-mono"
            />
            <button
              onClick={() => handleCopy('url', apiUrl)}
              className="absolute top-1/2 -translate-y-1/2 right-1.5 p-2.5 rounded-full hover:bg-[#424344] cursor-pointer"
              title={copiedKey === 'url' ? "Copied!" : "Copy URL"}
            >
              <Copy color="#BFBCBC" size={15} />
            </button>
            {copiedKey === 'url' && (
              <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-14 z-20 rounded bg-white/90 text-gray-900 text-xs px-2 py-1 shadow">
                Copied!
              </span>
            )}
          </div>

          {/* Bloco de Código com Abas */}
          <div className="bg-[#333437] text-white p-4 rounded-lg font-mono text-sm relative h-[350px]">
            {/* Botão de Copiar para o Bloco de Código */}
            <button
              onClick={() => handleCopy(activeTab, codeSnippets[activeTab])}
              className="absolute top-1.5 right-2 p-2.5 rounded-full hover:bg-[#424344] cursor-pointer"
              title={copiedKey === activeTab ? "Copied!" : "Copy Code"}
            >
              <Copy color="#BFBCBC" size={15} />
            </button>
            {copiedKey === activeTab && (
              <span className="pointer-events-none absolute top-3 right-12 z-20 rounded bg-white/90 text-gray-900 text-xs px-2 py-1 shadow">
                Copied!
              </span>
            )}

            {/* Abas de Seleção */}
            <div className="flex items-center gap-2 mb-3 ">
              <button onClick={() => setActiveTab('py')} className={`px-3 py-1 text-xs rounded ${activeTab === 'py' ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'}`}>Python</button>
              <button onClick={() => setActiveTab('js')} className={`px-3 py-1 text-xs rounded ${activeTab === 'js' ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'}`}>JavaScript</button>
              
              <button onClick={() => setActiveTab('curl')} className={`px-3 py-1 text-xs rounded ${activeTab === 'curl' ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'}`}>cURL</button>
              
            </div>

            {/* Conteúdo do Código */}
            <pre className="whitespace-pre-wrap">
              <code>{codeSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiModal;