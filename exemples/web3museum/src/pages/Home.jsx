import React, { useEffect, useState, useRef } from "react";
import "simplebar-react/dist/simplebar.min.css";
import { useLocation } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import ChatInterface from "../components/ChatInterface";
import { Menu } from "lucide-react";
import { startChaplinStream } from "../services/apiService";
import { mockState } from '../_mockData'; // Ajuste o caminho se necessário
const USE_MOCK_DATA = false;

// Função utilitária
function getClientSessionId() {
  let id = localStorage.getItem("clientSessionId");
  if (!id) {
    id = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    try {
      localStorage.setItem("clientSessionId", id);
    } catch (e) {}
  }
  return id;
}

// Nova função para chamar a API de imagem
async function generateImageFromPrompt(imagePrompt) {
  const workerUrl = import.meta.env.VITE_IMAGE_WORKER_URL;
  if (!workerUrl) {
    console.error("VITE_IMAGE_WORKER_URL não está definido no .env");
    return null;
  }
  const url = `${workerUrl}/?prompt=${encodeURIComponent(imagePrompt)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Image generation failed with status: ${response.status}`
      );
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to generate image:", error);
    return null;
  }
}

function App() {
  const location = useLocation();
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [originalInput, setOriginalInput] = useState(USE_MOCK_DATA ? mockState.originalInput : '');
  const [isProcessing, setIsProcessing] = useState(USE_MOCK_DATA ? mockState.isProcessing : false);
  const [finalResult, setFinalResult] = useState(USE_MOCK_DATA ? mockState.finalResult : null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(USE_MOCK_DATA ? mockState.generatedImageUrl : null);
  const [progressSteps, setProgressSteps] = useState([]); // Pode deixar vazio ou mockar também
  
  const streamControllerRef = useRef(null);
  const imageGenerationTriggeredRef = useRef(false);
  const jobIdRef = useRef(null);
  const pausedDueToHiddenRef = useRef(false);

  // <<< NOVO: Função centralizada para iniciar/retomar a stream
  const startStream = (jobId = null) => {
    // Aborta qualquer stream anterior para evitar duplicatas
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
    }

    const payload = {
      chaplin_id: "-OcHgnjtDj7ezNOTCrY0",
      input: originalInput || userInput.trim(), // Usa o input original se estiver retomando
      clientSessionId: getClientSessionId(),
      jobId: jobId, // Inclui o jobId se estiver retomando
    };

    streamControllerRef.current = startChaplinStream(payload, {
      onData: (chunk) => {
        // <<< NOVO: Captura o jobId do evento 'start' (ou do primeiro evento)
        // Você precisa garantir que seu servidor envie o jobId!
        if (chunk.jobId && !jobIdRef.current) {
          jobIdRef.current = chunk.jobId;
        }

        // O resto da sua lógica de `onData` permanece aqui...
        setProgressSteps((prevSteps) => {
          let newSteps = [...prevSteps];
          if (
            chunk.type === "agent_start" &&
            newSteps.length === 1 &&
            newSteps[0].type === "connection"
          ) {
            newSteps[0].status = "completed";
            newSteps[0].content = "Connection established.";
          }
          switch (chunk.type) {
            case "agent_start":
              // Evita adicionar agentes duplicados ao retomar
              if (!newSteps.some((step) => step.name === chunk.data.name)) {
                newSteps.push({
                  id: prevSteps.length + 1,
                  name: chunk.data.name,
                  status: "processing",
                  type: "agent",
                  content: "Waiting for response...",
                });
              }
              break;
            case "agent_result":
              {const agentIndex = newSteps.findIndex(
                (step) => step.name === chunk.data.name
              );
              if (agentIndex > -1) {
                newSteps[agentIndex].status = "completed";
                newSteps[agentIndex].content = chunk.data.output;
              }
              break;}
            case "integrator_start":
              if (!newSteps.some((step) => step.type === "integrator")) {
                newSteps.push({
                  id: prevSteps.length + 1,
                  name: "Output Formatter",
                  status: "processing",
                  type: "integrator",
                  content: "Formatting final output...",
                });
              }
              break;
            case "integrator_result":
              if (!imageGenerationTriggeredRef.current) {
                imageGenerationTriggeredRef.current = true;
                const integratorIndex = newSteps.findIndex(
                  (step) => step.type === "integrator"
                );
                if (integratorIndex > -1) {
                  newSteps[integratorIndex].status = "completed";
                  newSteps[integratorIndex].content = chunk.data.final;
                  setFinalResult(chunk.data.final);
                }
                newSteps.push({
                  id: prevSteps.length + 1,
                  name: "Generate Image",
                  status: "processing",
                  type: "image",
                  content: "Building image from prompt...",
                });
                generateImageFromPrompt(chunk.data.final.image_prompt).then(
                  (imageUrl) => {
                    if (imageUrl) {
                      setGeneratedImageUrl(imageUrl);
                      setProgressSteps((currentSteps) =>
                        currentSteps.map((step) =>
                          step.type === "image"
                            ? {
                                ...step,
                                status: "completed",
                                content: "Image generated successfully.",
                              }
                            : step
                        )
                      );
                    } else {
                      setProgressSteps((currentSteps) =>
                        currentSteps.map((step) =>
                          step.type === "image"
                            ? {
                                ...step,
                                status: "error",
                                content: "Failed to generate image.",
                              }
                            : step
                        )
                      );
                    }
                    setIsProcessing(false);
                    jobIdRef.current = null; // Limpa o job ao finalizar
                  }
                );
              }
              break;
          }
          return newSteps;
        });
      },
      onError: (err) => {
        console.error("Stream error:", err);
        setIsProcessing(false);
        setProgressSteps((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            name: "Error",
            status: "error",
            type: "error",
            content: err.message,
          },
        ]);
      },
      onClose: () => {
        if (!finalResult) {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleSendMessage = () => {
    if (!userInput.trim() || isProcessing) return;

    // Limpa estados anteriores
    setFinalResult(null);
    setGeneratedImageUrl(null);
    setProgressSteps([]);
    setOriginalInput(userInput.trim());
    imageGenerationTriggeredRef.current = false;
    jobIdRef.current = null; // <<< Limpa o jobId antigo

    setIsProcessing(true);

    const initialSteps = [
      {
        id: 1,
        name: "Connect to Chaplin",
        status: "processing",
        type: "connection",
        content: "Connecting...",
      },
    ];
    setProgressSteps(initialSteps);

    startStream(); // <<< Chama a nova função centralizada
    setUserInput("");
  };

  // <<< NOVO: Efeito para gerenciar a visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Se a aba ficar oculta e houver uma stream rodando, aborte-a.
        if (streamControllerRef.current) {
          pausedDueToHiddenRef.current = true;
          streamControllerRef.current.abort();
          streamControllerRef.current = null;
        }
      } else {
        // Se a aba ficar visível novamente, e foi pausada por esse motivo,
        // e temos um jobId, retome a stream.
        if (pausedDueToHiddenRef.current && jobIdRef.current) {
          console.log(`Resuming stream with jobId: ${jobIdRef.current}`);
          startStream(jobIdRef.current);
        }
        pausedDueToHiddenRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalInput]); // Depende do input para ter o valor correto no payload ao retomar

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
        className={`fixed top-5 left-2 z-20 p-2 rounded-full cursor-pointer hover:bg-[#1F1F22] lg:hidden ${
          isNavbarOpen ? "hidden" : "block"
        }`}
      >
        <Menu color="#A2A2AB" size={23} />
      </button>
      <main
        className={`flex-grow transition-all duration-300 ${
          isNavbarOpen ? "lg:ml-[340px]" : "ml-0"
        }`}
      >
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
