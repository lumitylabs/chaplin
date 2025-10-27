import React from 'react';
import { Search } from 'lucide-react';
import { SendSolid } from 'iconoir-react';
import HomeImage from '../assets/home.png';
import HoloCard from './HoloCard';

// Componente de Input reutilizável (MODIFICADO)
const ChatInput = ({ userInput, setUserInput, handleSendMessage, isProcessing }) => (
    <div className="w-full max-w-2xl mx-auto">
        <div className="relative shadow-[0_0_900px_50px_rgba(108,56,172,0.4)] rounded-full">
            <Search size={14} color='#3E394B' className="absolute left-6 top-1/2 -translate-y-1/2" />
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Search"
                disabled={isProcessing}
                className="font-mono text-sm w-full bg-[#0C0B0F] text-white placeholder:text-[#3E394B] rounded-full py-4 pl-14 pr-16 border border-[#2b2031] focus:outline-none focus:ring-1 focus:ring-[#663c99] transition-all"
            />
            {/* 
              MODIFICAÇÃO: 
              - Removido 'p-2.5'
              - Adicionado 'w-10 h-10' para um tamanho fixo maior.
              - Adicionado 'flex items-center justify-center' para centralizar o ícone.
              - Ajustado o posicionamento para 'right-2' para alinhar melhor o botão maior.
            */}
            <button
                onClick={handleSendMessage}
                disabled={isProcessing || !userInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            >
                <SendSolid height={15} width={15} color='#242424' />
            </button>
        </div>
    </div>
);


// Tela Final - "Web 3 Museum" (sem alterações)
const MuseumDisplay = ({ imageUrl, result, originalInput, userInput, setUserInput, handleSendMessage, isProcessing }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-white">
        <h1 className="text-3xl text-[#EADAFF] font-bold mb-12">Web 3 Museum</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl w-full">
            <div className="w-full h-[600px] aspect-[1/1.4] cursor-pointer">
                {imageUrl ? (
                    <HoloCard imageUrl={imageUrl} title={originalInput} />
                ) : (
                    <div className="flex items-center justify-center h-full bg-[#1F1F22] rounded-2xl">
                        <p className="text-gray-400">Loading Card...</p>
                    </div>
                )}
            </div>
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

// Tela Inicial (sem alterações nesta etapa)
const InitialScreen = ({ userInput, setUserInput, handleSendMessage, isProcessing }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-[#060606] border border-[#312637] rounded-3xl overflow-hidden max-w-lg w-full">
            <img src={HomeImage} alt="Web3 Digital Museum" className="w-full h-auto object-cover" />
            <hr className="border-[#312637]" />
            <div className="flex flex-col p-8 gap-1">
                <h2 className="text-[#faf6ff] font-mono text-xl">Web3 Digital Museum</h2>
                <p className="font-mono font-semibold text-[#703172] mb-8 text-sm">Search for an object, person or historical event</p>

                <ChatInput
                    userInput={userInput}
                    setUserInput={setUserInput}
                    handleSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                />
            </div>
        </div>
    </div>
);


// Componente principal (sem alterações)
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