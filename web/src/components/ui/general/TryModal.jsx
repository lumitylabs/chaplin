// src/components/ui/general/TryModal.jsx

import React, { useState, useRef, useEffect } from "react";
import { Wrench, X } from "lucide-react";
import { SendSolid } from 'iconoir-react';
import Avatar from "../../../assets/Avatar.png";
import SimpleBar from "simplebar-react";
import 'simplebar-react/dist/simplebar.min.css';
import ChaplinImage from "../../../assets/persona.png";
import { useChaplinStream } from "../../../services/apiService";

// Componente para renderizar a tabela de resultados final
function ResultsTable({ data }) {
  if (!data || typeof data !== 'object') {
    const errorMessage = data?.error || data?.raw || "An unknown error occurred.";
    return <div className="text-sm text-red-400 p-3 bg-[#1B1B1B] rounded-xl">{String(errorMessage)}</div>;
  }

  return (
    <div className="table w-full max-w-lg rounded-xl overflow-hidden border border-[#303135]">
      {Object.entries(data).map(([key, value], index) => (
        <div
          key={key}
          className={`table-row ${index % 2 === 0 ? 'bg-[#2A2A2A]' : 'bg-[#1B1B1B]'}`}
        >
          <div className="table-cell p-3 w-0 whitespace-nowrap align-middle">
            <p className="font-mono text-center text-xs px-2 py-1 bg-[#363636] rounded-full">
              {key}
            </p>
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
  const personaImage = persona.imagebase64 || ChaplinImage;

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


function TryModal({ persona, onClose }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const simpleBarRef = useRef(null);
  const streamControllerRef = useRef(null);

  // Efeito para fechar o modal com a tecla ESC
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

  useEffect(() => {
    if (simpleBarRef.current) {
      const scrollElement = simpleBarRef.current.getScrollElement();
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (!userInput.trim() || isProcessing) return;

    const newUserMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: userInput.trim(),
    };

    const newChaplinMessage = {
      id: `chaplin-${Date.now()}`,
      type: 'chaplin',
      status: 'processing',
      statusText: 'Connecting to Chaplin...',
      content: null,
    };

    setMessages(prev => [...prev, newUserMessage, newChaplinMessage]);
    setUserInput("");
    setIsProcessing(true);

    streamControllerRef.current = useChaplinStream(
      { chaplin_id: persona.id, input: userInput.trim() },
      {
        onData: (chunk) => {
          console.log('Received chunk:', chunk); // Debug
          setMessages(prevMessages =>
            prevMessages.map(msg => {
              if (msg.id === newChaplinMessage.id) {
                const updatedMsg = { ...msg };

                if (chunk.type === 'start') {
                  updatedMsg.statusText = 'Processing your request...';
                } else if (chunk.type === 'agent_start') {
                  updatedMsg.statusText = `${chunk.data?.name || 'Agent'} is working...`;
                } else if (chunk.type === 'agent_result') {
                  updatedMsg.statusText = `${chunk.data?.name || 'Agent'} completed`;
                } else if (chunk.type === 'integrator_start') {
                  updatedMsg.statusText = 'Assembling final response...';
                } else if (chunk.type === 'integrator_result') {
                  updatedMsg.status = 'complete';
                  updatedMsg.content = chunk.data?.final || {};
                  updatedMsg.statusText = '';
                } else if (chunk.type === 'done') {
                  // Mantém o estado atual
                } else if (chunk.type === 'error') {
                  updatedMsg.status = 'complete';
                  updatedMsg.content = { Error: chunk.data?.message || 'Unknown error' };
                  updatedMsg.statusText = '';
                }

                return updatedMsg;
              }
              return msg;
            })
          );
        },
        onError: (error) => {
          console.error('Stream error:', error);
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === newChaplinMessage.id
                ? { ...msg, status: 'complete', content: { Error: error.message }, statusText: '' }
                : msg
            )
          );
          setIsProcessing(false);
        },
        onClose: () => {
          console.log('Stream closed');
          setIsProcessing(false);
          streamControllerRef.current = null;
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-[#26272B] rounded-2xl w-[750px] h-[500px] p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-md font-semibold text-[#E3E3E4]">{persona.name}</h2>
            <button onClick={onClose} className="cursor-pointer p-1"><X color="#BFBCBC" size={22} /></button>
          </div>
          <div className="w-full h-px bg-[#303135] mt-1"></div>
        </div>

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

              {messages.map((msg) =>
                msg.type === 'user' ? (
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
                )
              )}
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
              className="w-full bg-[#37393D] text-[#FAFAFA] text-sm placeholder:text-[#7C7C7C] rounded-full py-3 pl-5 pr-14 border border-[#505050] focus:outline-none focus:ring-1 focus:ring-[#C7C7C7] transition-all duration-200 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !userInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white p-2.5 rounded-full font-semibold hover:bg-[#E3E3E4] transition-all duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <SendSolid color="#242424" height={15} width={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TryModal;