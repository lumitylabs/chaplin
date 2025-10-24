// src/components/ChatInterface.js

import React from 'react';
import { Send } from 'lucide-react';
import HomeImage from '../assets/home.png';
import HoloCard from './HoloCard'; // <<< PASSO 1: Importe o novo componente

// Componente de Input reutilizável (permanece o mesmo)
const ChatInput = ({ userInput, setUserInput, handleSendMessage, isProcessing }) => (
    <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Choose an object, person or historical event"
                disabled={isProcessing}
                className="w-full bg-[#2a2a2e] text-white placeholder:text-[#777] rounded-full py-4 pl-6 pr-16 border border-[#3a3a3f] focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
            <button
                onClick={handleSendMessage}
                disabled={isProcessing || !userInput.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white p-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
            >
                <Send size={20} className="text-black" />
            </button>
        </div>
    </div>
);


// Tela Final - "Web 3 Museum"
const MuseumDisplay = ({ imageUrl, result, originalInput, userInput, setUserInput, handleSendMessage, isProcessing }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-white">
        <h1 className="text-3xl font-bold mb-12">Web 3 Museum</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl w-full">
            
            {/* <<< PASSO 2: Substitua o <img> pelo HoloCard >>> */}
            <div className="w-full h-[600px] aspect-[1/1.4] cursor-pointer">
                {imageUrl ? (
                    <HoloCard imageUrl={imageUrl} title={originalInput} />
                ) : (
                    <div className="flex items-center justify-center h-full bg-[#1F1F22] rounded-2xl">
                        <p className="text-gray-400">Loading Card...</p>
                    </div>
                )}
            </div>
            {/* <<< FIM DA MUDANÇA >>> */}

            <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold">{originalInput}</h2>
                <p className="text-gray-300 leading-relaxed">
                    {result.museum_label}
                </p>
            </div>
        </div>
        <div className="mt-16 w-full">
            <ChatInput 
                userInput={userInput}
                setUserInput={setUserInput}
                handleSendMessage={handleSendMessage}
                isProcessing={isProcessing}
            />
        </div>
    </div>
);

// Tela Inicial (permanece a mesma)
const InitialScreen = ({ userInput, setUserInput, handleSendMessage, isProcessing }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md mb-12">
            <img src={HomeImage} alt="Abstract 3D art" className="w-full h-auto" />
        </div>
        <ChatInput 
            userInput={userInput}
            setUserInput={setUserInput}
            handleSendMessage={handleSendMessage}
            isProcessing={isProcessing}
        />
    </div>
);


export default function ChatInterface({ 
    isProcessing, 
    finalResult, 
    generatedImageUrl,
    userInput,
    setUserInput,
    handleSendMessage,
    originalInput
}) {
    if (finalResult) {
        return <MuseumDisplay 
            imageUrl={generatedImageUrl}
            result={finalResult}
            originalInput={originalInput}
            userInput={userInput}
            setUserInput={setUserInput}
            handleSendMessage={handleSendMessage}
            isProcessing={isProcessing}
        />;
    }

    return <InitialScreen 
        userInput={userInput}
        setUserInput={setUserInput}
        handleSendMessage={handleSendMessage}
        isProcessing={isProcessing}
    />;
}