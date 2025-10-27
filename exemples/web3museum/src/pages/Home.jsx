import React, { useEffect, useState, useRef, useCallback } from "react"; // Adicionado useCallback
import "simplebar-react/dist/simplebar.min.css";
import { useLocation } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import ChatInterface from "../components/ChatInterface";
import { Layers } from "lucide-react";
import { startChaplinStream } from "../services/apiService";
import { mockState } from '../_mockData';
const USE_MOCK_DATA = false;

// Funções utilitárias (sem alterações)
function getClientSessionId() {
  let id = localStorage.getItem("clientSessionId");
  if (!id) {
    id = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    try { localStorage.setItem("clientSessionId", id); } catch (e) { }
  }
  return id;
}
async function generateImageFromPrompt(imagePrompt) {
  const workerUrl = import.meta.env.VITE_IMAGE_WORKER_URL;
  if (!workerUrl) { console.error("VITE_IMAGE_WORKER_URL não está definido no .env"); return null; }
  const url = `${workerUrl}/?prompt=${encodeURIComponent(imagePrompt)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) { throw new Error(`Image generation failed with status: ${response.status}`); }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) { console.error("Failed to generate image:", error); return null; }
}

function App() {
  const location = useLocation();
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [originalInput, setOriginalInput] = useState(USE_MOCK_DATA ? mockState.originalInput : '');
  const [isProcessing, setIsProcessing] = useState(USE_MOCK_DATA ? mockState.isProcessing : false);
  const [finalResult, setFinalResult] = useState(USE_MOCK_DATA ? mockState.finalResult : null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(USE_MOCK_DATA ? mockState.generatedImageUrl : null);
  const [progressSteps, setProgressSteps] = useState([]);

  const streamControllerRef = useRef(null);
  const imageGenerationTriggeredRef = useRef(false);
  const jobIdRef = useRef(null);
  const pausedDueToHiddenRef = useRef(false);

  // <<< CORREÇÃO 1: `startStream` agora é envolvida em `useCallback` e não depende de nenhum estado. >>>
  // Ela recebe tudo o que precisa como argumentos, tornando-a pura e previsível.
  const startStream = useCallback((jobId = null, inputForApi) => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
    }

    // Validação para garantir que o input nunca seja nulo aqui.
    if (!inputForApi) {
        console.error("startStream foi chamada sem um input válido!");
        setIsProcessing(false); // Para a animação de loading
        return;
    }

    const payload = {
      chaplin_id: "-OcHgnjtDj7ezNOTCrY0",
      input: inputForApi, // Usa o argumento diretamente
      clientSessionId: getClientSessionId(),
      jobId: jobId,
    };

    streamControllerRef.current = startChaplinStream(payload, {
      // A lógica de onData, onError, onClose permanece a mesma de antes
      onData: (chunk) => {
        if (chunk.type === "start" && chunk.jobId && !jobIdRef.current) {
          jobIdRef.current = chunk.jobId;
        }

        if (chunk.type === 'integrator_result') {
          if (imageGenerationTriggeredRef.current) return;
          imageGenerationTriggeredRef.current = true;
          setFinalResult(chunk.data.final);
          setProgressSteps(prevSteps => [
            ...prevSteps.map(step =>
              step.type === 'integrator'
                ? { ...step, status: 'processing', content: 'output formatter is working...' }
                : step
            ),
            { id: prevSteps.length + 1, name: "Generate Image", status: "processing", type: "image", content: "building image..." }
          ]);
          setTimeout(() => {
            setProgressSteps(currentSteps => currentSteps.map(step =>
              step.type === 'integrator'
                ? { ...step, status: 'completed', content: chunk.data.final }
                : step
            ));
          }, 500);
          generateImageFromPrompt(chunk.data.final.image_prompt).then(
            (imageUrl) => {
              if (imageUrl) {
                setGeneratedImageUrl(imageUrl);
                setProgressSteps(currentSteps => currentSteps.map(step =>
                  step.type === 'image' ? { ...step, status: 'completed', content: 'Image generated successfully.' } : step
                ));
              } else {
                setProgressSteps(currentSteps => currentSteps.map(step =>
                  step.type === 'image' ? { ...step, status: 'error', content: 'Failed to generate image.' } : step
                ));
              }
              setIsProcessing(false);
              jobIdRef.current = null;
            }
          );
          return;
        }

        setProgressSteps((prevSteps) => {
          let newSteps = [...prevSteps];
          if ((chunk.type === "agent_start" || chunk.type === "start") && newSteps.length > 0 && newSteps[0].type === "connection" && newSteps[0].status === "processing") {
            newSteps[0].status = "completed";
            newSteps[0].content = "Connection established.";
          }
          switch (chunk.type) {
            case "agent_start":
              if (!newSteps.some((step) => step.name === chunk.data.name)) {
                newSteps.push({ id: prevSteps.length + 1, name: chunk.data.name, status: "processing", type: "agent", content: "requesting to cortensor..." });
              }
              break;
            case "agent_attempt": {
              const agentIndex = newSteps.findIndex((step) => step.name === chunk.data.name);
              if (agentIndex > -1) { newSteps[agentIndex].content = `waiting for cortensor ${chunk.data.attempt} of ${chunk.data.maxAttempts}`; }
              break;
            }
            case "agent_result": {
              const agentIndex = newSteps.findIndex((step) => step.name === chunk.data.name);
              if (agentIndex > -1) { newSteps[agentIndex].status = "generated"; newSteps[agentIndex].content = chunk.data.output; }
              break;
            }
            case "integrator_start":
              if (!newSteps.some((step) => step.type === "integrator")) {
                newSteps.push({ id: prevSteps.length + 1, name: "Output", status: "processing", type: "integrator", content: "requesting to output formatter..." });
              }
              break;
          }
          return newSteps;
        });
      },
      onError: (err) => {
        console.error("Stream error:", err);
        setIsProcessing(false);
        setProgressSteps((prev) => [...prev, { id: prev.length + 1, name: "Error", status: "error", type: "error", content: err.message }]);
      },
      onClose: () => { if (!finalResult) { setIsProcessing(false); } },
    });
  }, [finalResult]); // Adicionado finalResult como dependência para que a lógica de onClose seja sempre a mais recente.

  // <<< CORREÇÃO 2: `handleSendMessage` agora é uma função "pura" que orquestra tudo com variáveis locais. >>>
  const handleSendMessage = () => {
    const currentInput = userInput.trim();
    if (!currentInput || isProcessing) return;

    // 1. Atualiza os estados da UI com o novo input
    console.log("User input enviado:", currentInput);
    setOriginalInput(currentInput);
    setIsProcessing(true);

    // 2. Reseta completamente o estado da execução anterior
    setFinalResult(null);
    setGeneratedImageUrl(null);
    setProgressSteps([
      { id: 1, name: "Connect to Chaplin", status: "processing", type: "connection", content: "Connecting..." },
    ]);
    imageGenerationTriggeredRef.current = false;
    jobIdRef.current = null;

    // 3. Chama a API com o dado fresco e local
    startStream(null, currentInput);

    // 4. Limpa o campo de input para o usuário
    setUserInput("");
  };

  // useEffect para visibilidade (sem alterações, mas agora mais robusto por causa do useCallback em startStream)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (streamControllerRef.current) {
          pausedDueToHiddenRef.current = true;
          streamControllerRef.current.abort();
          streamControllerRef.current = null;
        }
      } else {
        if (pausedDueToHiddenRef.current && jobIdRef.current) {
          // A dependência [originalInput] garante que este valor é o mais recente ao retomar.
          startStream(jobIdRef.current, originalInput);
        }
        pausedDueToHiddenRef.current = false;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [originalInput, startStream]); // Adicionado startStream à lista de dependências

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setIsNavbarOpen(isDesktop);
  }, []);

  return (
    <div className="bg-[#18181B] min-h-screen font-inter text-white flex">
      <Navbar
        isOpen={isNavbarOpen}
        setIsOpen={setIsNavbarOpen}
        progressSteps={progressSteps}
      />
      <button
        onClick={() => setIsNavbarOpen(true)}
        className={`fixed top-5 left-2 z-20 p-2 rounded-full cursor-pointer hover:bg-[#1F1F22] lg:hidden ${isNavbarOpen ? "hidden" : "block"}`}
      >
        <Layers color="#A2A2AB" size={21} />
      </button>
      <main className={`flex-grow transition-all duration-300 relative ${isNavbarOpen ? "lg:ml-[340px]" : "ml-0"}`}>
        {!isNavbarOpen && (
          <button
            onClick={() => setIsNavbarOpen(true)}
            className="fixed top-5 left-4 z-20 p-2 rounded-full cursor-pointer hover:bg-[#1F1F22] hidden lg:block"
          >
            <Layers color="#A2A2AB" size={21} />
          </button>
        )}
        <ChatInterface
          isProcessing={isProcessing}
          finalResult={finalResult}
          generatedImageUrl={generatedImageUrl}
          userInput={userInput}
          setUserInput={setUserInput}
          handleSendMessage={handleSendMessage}
          originalInput={originalInput}
        />
      </main>
    </div>
  );
}

export default App;