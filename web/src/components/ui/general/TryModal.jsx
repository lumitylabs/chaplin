// src/components/ui/general/TryModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { Wrench, X } from "lucide-react";
import { SendSolid } from "iconoir-react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import Avatar from "../../../assets/Avatar.png";
import ChaplinImage from "../../../assets/persona.png";
import { startChaplinStream } from "../../../services/apiService";

/**
 * sessionStorage keys:
 *  - SESSION_MAP_KEY: map persona.id -> jobId (only while modal open in this tab)
 *  - modalOpen key per persona: `chaplin_modal_open_<personaId>` set to "1" while modal open
 */
const SESSION_MAP_KEY = "chaplin_jobs_map_session";
function readJobsMap() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_MAP_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeJobsMap(map) {
  try {
    sessionStorage.setItem(SESSION_MAP_KEY, JSON.stringify(map));
  } catch {}
}
function removeJobFromMap(personaId) {
  try {
    const m = readJobsMap();
    if (m && m[personaId]) {
      delete m[personaId];
      writeJobsMap(m);
    }
  } catch {}
}
function setModalOpenFlag(personaId, value) {
  try {
    if (value) sessionStorage.setItem(`chaplin_modal_open_${personaId}`, "1");
    else sessionStorage.removeItem(`chaplin_modal_open_${personaId}`);
  } catch {}
}
function isModalOpenFlag(personaId) {
  try {
    return sessionStorage.getItem(`chaplin_modal_open_${personaId}`) === "1";
  } catch {
    return false;
  }
}

function getClientSessionId() {
  let id = localStorage.getItem("clientSessionId");
  if (!id) {
    id = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    try { localStorage.setItem("clientSessionId", id); } catch (e) {}
  }
  return id;
}

function ResultsTable({ data }) {
  if (!data || typeof data !== "object") {
    const errorMessage = data?.error || data?.raw || "An unknown error occurred.";
    return <div className="text-sm text-red-400 p-3 bg-[#1B1B1B] rounded-xl">{String(errorMessage)}</div>;
  }

  return (
    <div className="table w-full max-w-lg rounded-xl overflow-hidden border border-[#303135]">
      {Object.entries(data).map(([key, value], index) => (
        <div key={key} className={`table-row ${index % 2 === 0 ? 'bg-[#2A2A2A]' : 'bg-[#1B1B1B]'}`}>
          <div className="table-cell p-3 w-0 whitespace-nowrap align-middle">
            <p className="font-mono text-center text-xs px-2 py-1 bg-[#363636] rounded-full">{key}</p>
          </div>
          <div className="table-cell p-3 pl-4 border-l border-l-[#353535] align-middle">
            <p className="text-sm text-[#C1C1C2] whitespace-pre-wrap">{String(value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChaplinMessage({ persona, message }) {
  const personaImage = persona.image_url || ChaplinImage;

  return (
    <div className="flex justify-start items-start gap-3">
      <img src={personaImage} alt={persona.name} className="w-10 h-10 rounded-full" />
      <div className="flex flex-col items-start w-full">
        <p className="text-sm font-semibold text-[#E3E3E4] mb-1">{persona.name}</p>
        {message.status === 'processing' ? (
          <div className="text-sm text-[#9e9e9e] italic">{message.statusText}</div>
        ) : (
          <ResultsTable data={message.content} />
        )}
      </div>
    </div>
  );
}

export default function TryModal({ persona, onClose }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const simpleBarRef = useRef(null);

  // stream controller returned by startChaplinStream (has abort)
  const streamControllerRef = useRef(null);

  // track a single chaplin message id while processing
  const currentChaplinMessageIdRef = useRef(null);

  // avoid processing same chunk twice
  const processedChunkIdsRef = useRef(new Set());

  // paused due to visibility; when hidden we abort SSE (but executor continues background),
  // on visible we reattach using saved jobId (if any)
  const pausedDueToHiddenRef = useRef(false);

  // set modalOpen flag in sessionStorage so temporary unmounts don't clear mapping
  useEffect(() => {
    setModalOpenFlag(persona.id, true);

    // If there's a jobId saved and modalOpen was already true, reattach on mount
    const map = readJobsMap();
    const saved = map[persona.id];
    if (saved) {
      // reattach existing job automatically
      setIsProcessing(true);
      const payload = { chaplin_id: persona.id, input: "", clientSessionId: getClientSessionId(), jobId: saved };
      startStreamWithPayload(payload, true);
    }

    return () => {
      // DON'T remove job mapping here! (important)
      // Only cleanup stream and remove mapping when user explicitly closes modal (handleClose).
      if (streamControllerRef.current && typeof streamControllerRef.current.abort === 'function') {
        try { streamControllerRef.current.abort(); } catch (e) {}
        streamControllerRef.current = null;
      }
      // Do NOT call removeJobFromMap(persona.id) here.
      // Just clear processing UI refs:
      processedChunkIdsRef.current.clear();
      currentChaplinMessageIdRef.current = null;
      pausedDueToHiddenRef.current = false;
      // Do NOT touch sessionStorage modal flag here — handleClose will remove it.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (simpleBarRef.current) {
      const el = simpleBarRef.current.getScrollElement();
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]); // Adiciona onClose como dependência

  // Visibility handler: abort SSE when hidden (to avoid accidental reconnect races),
  // on visible, if pausedDueToHidden reattach using saved jobId (if exists).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        // abort SSE but do NOT remove job mapping; executor continues.
        if (streamControllerRef.current && typeof streamControllerRef.current.abort === 'function') {
          try { streamControllerRef.current.abort(); } catch (e) {}
          streamControllerRef.current = null;
        }
        pausedDueToHiddenRef.current = true;
      } else {
        // visible again
        if (pausedDueToHiddenRef.current) {
          pausedDueToHiddenRef.current = false;
          const map = readJobsMap();
          const jobId = map[persona.id];
          if (jobId) {
            // reattach to existing job
            const payload = { chaplin_id: persona.id, input: "", clientSessionId: getClientSessionId(), jobId };
            startStreamWithPayload(payload, true);
            setIsProcessing(true);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Stream helpers ----
  function startStreamWithPayload(payload, isReattach = false) {
    // abort existing controller if any
    if (streamControllerRef.current && typeof streamControllerRef.current.abort === 'function') {
      try { streamControllerRef.current.abort(); } catch (e) {}
      streamControllerRef.current = null;
    }

    // Start stream using service
    streamControllerRef.current = startChaplinStream(payload, {
      onData: (chunk) => {
        // If the start chunk includes jobId and this was a fresh (not reattach) request,
        // store jobId in session map for reattach and future reconnections while modal open.
        if (chunk && chunk.type === "start" && chunk.jobId) {
          try {
            const m = readJobsMap();
            m[persona.id] = chunk.jobId;
            writeJobsMap(m);
          } catch (e) {}
          // do not restart here: we only restart if we intentionally want to reattach.
        }

        // If the page is hidden, buffer nothing (we aborted on hidden). If needed we could buffer,
        // but we opted to abort/reattach behavior to avoid duplicate job creation.
        if (document.hidden) {
          // just ignore incoming chunks while hidden (they'll be delivered after reattach/historical fetch)
          return;
        }

        // ensure there is a chaplin message object in the UI
        if (!currentChaplinMessageIdRef.current) {
          const newChaplinMessage = {
            id: `chaplin-${Date.now()}`,
            type: "chaplin",
            status: "processing",
            statusText: "Processing...",
            content: null,
            meta: { reattached: !!payload.jobId, jobId: payload.jobId || null },
          };
          currentChaplinMessageIdRef.current = newChaplinMessage.id;
          setMessages((prev) => [...prev, newChaplinMessage]);
        }

        // dedupe by chunk id (best-effort)
        const chunkId =
          chunk.id ||
          `${chunk.type}-${JSON.stringify(chunk.data || {})}-${chunk.ts || ""}`;
        if (processedChunkIdsRef.current.has(chunkId)) return;
        processedChunkIdsRef.current.add(chunkId);

        // apply chunk to the current chaplin message
        applyChunkToMessage(chunk, currentChaplinMessageIdRef.current);
      },

      onError: (err) => {
        // Mark message as complete with error if we have one
        const mid = currentChaplinMessageIdRef.current;
        if (mid) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === mid
                ? {
                    ...m,
                    status: "complete",
                    content: { Error: err?.message || String(err) },
                    statusText: "",
                  }
                : m
            )
          );
        }
        setIsProcessing(false);
        streamControllerRef.current = null;
      },

      onClose: () => {
        setIsProcessing(false);
        streamControllerRef.current = null;
      },
    });
  }

  function applyChunkToMessage(chunk, mid) {
  if (!mid || !chunk) return;
  setMessages(prev => prev.map(m => {
    if (m.id !== mid) return m;
    const updated = { ...m };

    // friendly name fallback: prefer chunk.data.name, then chunk.data.agentName, then "Agent"
    const name = chunk.data?.name || chunk.data?.agentName || 'Agent';

    if (chunk.type === 'start') {
      updated.statusText = 'Processing your request...';
    } else if (chunk.type === 'agent_start') {
      // e.g. "Cortensor started..."
      updated.statusText = `${name} started...`;
    } else if (chunk.type === 'agent_attempt') {
      // Normalized attempt/max fields (be tolerant to different shapes)
      const attempt = chunk.data?.attempt ?? chunk.data?.attemptNumber ?? 0;
      const max = chunk.data?.maxAttempts ?? chunk.data?.max ?? '?';
      // EXACT format requested:
      updated.statusText = `Waiting for ${name} attempt ${attempt} of ${max}...`;
    } else if (chunk.type === 'agent_result') {
      updated.statusText = `${name} responded`;
    } else if (chunk.type === 'integrator_start') {
      updated.statusText = 'Assembling final response...';
    } else if (chunk.type === 'integrator_result') {
      updated.status = 'complete';
      updated.content = chunk.data?.final || {};
      updated.statusText = '';
    } else if (chunk.type === 'error' || chunk.type === 'agent_error') {
      updated.status = 'complete';
      updated.content = { Error: chunk.data?.message || chunk.data?.error || 'Unknown error' };
      updated.statusText = '';
    } else if (chunk.type === 'done') {
      if (!updated.content) {
        updated.status = 'complete';
        updated.statusText = '';
      }
    } else if (chunk._raw) {
      updated.statusText = (updated.statusText ? updated.statusText + "\n" : "") + `[raw] ${String(chunk.raw).slice(0, 1000)}`;
    }

    return updated;
  }));
}

  // ---- User actions ----
  const handleSendMessage = () => {
    if (!userInput.trim() || isProcessing) return;
    const text = userInput.trim();

    // add user + chaplin placeholder to UI
    const userMsg = { id: `user-${Date.now()}`, type: 'user', text };
    const chapMsg = { id: `chaplin-${Date.now()}`, type: 'chaplin', status: 'processing', statusText: 'Connecting to Chaplin...', content: null };
    currentChaplinMessageIdRef.current = chapMsg.id;

    setMessages(prev => [...prev, userMsg, chapMsg]);
    setUserInput("");
    setIsProcessing(true);
    processedChunkIdsRef.current.clear();

    // always create a new job for a new question (payload without jobId)
    const payload = { chaplin_id: persona.id, input: text, clientSessionId: getClientSessionId() };
    startStreamWithPayload(payload, false);
  };

  // Explicit close by the user: abort stream, clear messages, remove job mapping and modal flag
  const handleCloseExplicit = () => {
    // abort stream
    if (streamControllerRef.current && typeof streamControllerRef.current.abort === 'function') {
      try { streamControllerRef.current.abort(); } catch (e) {}
      streamControllerRef.current = null;
    }

    // remove stored job mapping and modal open flag (so reopen won't reattach)
    removeJobFromMap(persona.id);
    setModalOpenFlag(persona.id, false);

    // clear UI state
    setMessages([]);
    processedChunkIdsRef.current.clear();
    currentChaplinMessageIdRef.current = null;
    setIsProcessing(false);

    // call parent close
    if (typeof onClose === 'function') onClose();
  };

  // cleanup when the component is unmounted (but do NOT remove mapping)
  useEffect(() => {
    return () => {
      // abort stream if still open
      if (streamControllerRef.current && typeof streamControllerRef.current.abort === 'function') {
        try { streamControllerRef.current.abort(); } catch (e) {}
        streamControllerRef.current = null;
      }
      // DO NOT remove job mapping here. keep mapping while modalOpen flag present.
      processedChunkIdsRef.current.clear();
      currentChaplinMessageIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50" onClick={handleCloseExplicit}>
      <div className="bg-[#26272B] rounded-2xl w-[750px] h-[500px] p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-md font-semibold text-[#E3E3E4]">{persona.name}</h2>
          <button onClick={handleCloseExplicit} className="cursor-pointer p-1"><X color="#BFBCBC" size={22} /></button>
        </div>

        <div className="w-full h-px bg-[#303135] mt-1"></div>

        <div className="flex-grow overflow-hidden my-4">
          <SimpleBar ref={simpleBarRef} className="category-dropdown-scrollbar h-full">
            <div className="flex flex-col gap-8 pr-3 pb-5">
              <div className="flex justify-start items-start gap-3 pt-5">
                <div className="flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#0A0A0A] to-[#2B2B2B] shadow-lg flex">
                  <Wrench color="#B3B3B3" size={21} />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-semibold text-[#E3E3E4] mb-1">Instructions</p>
                  <div className="bg-gradient-to-r from-[#1B1B1B] to-[#2B2B2B] rounded-xl p-4 max-w-xl shadow-lg">
                    <p className="text-justify text-sm text-[#BDBBBE]">{persona.instructions}</p>
                  </div>
                </div>
              </div>

              {messages.map((msg) => msg.type === 'user' ? (
                <div key={msg.id} className="flex justify-end items-start gap-3">
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-semibold text-[#E3E3E4] mb-1">You</p>
                    <div className="bg-[#35373B] rounded-xl p-3 max-w-md">
                      <p className="text-sm text-[#C1C1C2] whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                  <img src={Avatar} alt="user" className="w-10 h-10 rounded-full" />
                </div>
              ) : (
                <ChaplinMessage key={msg.id} persona={persona} message={msg} />
              ))}
            </div>
          </SimpleBar>
        </div>

        <div className="flex-shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={`Ask ${persona.name}...`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isProcessing}
              className="w-full bg-[#37393D] text-[#FAFAFA] text-sm placeholder:text-[#7C7C7C] rounded-full py-3 pl-5 pr-14 border border-[#505050] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA] transition-all duration-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !userInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white p-2.5 rounded-full font-semibold hover:bg-[#E4E4E5] transition-all duration-200 cursor-pointer "
            >
              <SendSolid color="#242424" height={15} width={15} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
