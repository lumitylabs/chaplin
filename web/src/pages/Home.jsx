import React, { useState } from "react";
import PersonaNavbar from "../components/ui/general/PersonaNavbar";

import { Search } from 'lucide-react';
import FavoriteIcon from "../assets/star_icon.svg";

// Importe as imagens das personas - substitua pelos seus caminhos corretos
import OrcImage from "../assets/persona.png"; 
import MinerImage from "../assets/persona.png";
import AnalystImage from "../assets/persona.png";
import ApiModal from "../components/ui/general/ApiModal";
import TryModal from "../components/ui/general/TryModal";

// Dados das Personas para tornar a lista dinâmica
const personasData = [
  {
    id: 1,
    name: "ORC",
    image: OrcImage,
    desc: "Um putasso, mas que tem um coração...",
    apiUrl: "http://persona.request/orc-1832",
  },
  {
    id: 2,
    name: "Minerador",
    image: MinerImage,
    desc: "Um ego minerador que fala com o jogador.",
    apiUrl: "http://persona.request/miner-4512",
  },
  {
    id: 3,
    name: "Analista Market",
    image: AnalystImage,
    desc: "Um auxiliar para criação de propagandas para...",
    apiUrl: "http://persona.request/analyst-7734",
  },
  // Adicione mais personas aqui se necessário
];


// SEU CÓDIGO ORIGINAL - SEM ALTERAÇÕES DE LAYOUT
function TopBar() {
  return (
    <div className="flex justify-between items-center">
      <div className="font-inter font-semibold text-[1em] text-[#D0D0D0] ">All</div>
      <div className="flex items-center gap-2 px-6 p-3.5  w-90 rounded-full bg-[#202024]">
        <Search color="#FAFAFA" size={14} />
        <div className="w-30 text-[#959BA5] text-sm">Search</div>
      </div>
    </div>
  );
}

function FilterTag({ name }) {
  return (
    <button className="flex items-center justify-center font-inter font-medium text-[0.90em] p-3 px-4 rounded-xl bg-[#26272B] text-[#A2A2AB] hover:text-white cursor-pointer">
      {name}
    </button>
  );
}

function FilterBar() {
  return (
    <div className="flex gap-2">
      <FilterTag name="Assistant" />
      <FilterTag name="Anime" />
      <FilterTag name="Creativity & Writing" />
      <FilterTag name="Entertainment & Gaming" />
      <FilterTag name="History" />
      <FilterTag name="Humor" />
      <FilterTag name="Learning" />
    </div>
  );
}

// COMPONENTE MODIFICADO APENAS PARA ADICIONAR onClicks
function PersonaCard({ persona, onApiClick, onTryClick }) {
  return (
    <div className="flex gap-3 h-40 w-84 bg-[#202024] rounded-2xl justify-center items-center p-4 relative">
      <div className="absolute top-0 right-0">
        <img src={FavoriteIcon} className="w-4 h-4 mr-2 mt-2 cursor-pointer" />
      </div>

      <img src={persona.image} className="w-auto h-full rounded-2xl" />
      <div className="flex flex-col gap-1 h-full">
        <div className="font-semibold text-[#989898]">{persona.name}</div>
        <div className="text-sm text-[#989898] mb-2 line-clamp-2 w-40 h-60">{persona.desc}</div>
        {/* Adicionando a funcionalidade de clique aos divs originais */}
        <div 
          onClick={() => onApiClick(persona)}
          className="bg-[#4A4343] w-auto rounded-full flex items-center justify-center text-[#989898] cursor-pointer"
        >
          API
        </div>
        <div 
          onClick={() => onTryClick(persona)}
          className="bg-[#CECECE] w-auto rounded-full flex items-center justify-center text-[#989898] cursor-pointer"
        >
          TRY
        </div>
      </div>
    </div>
  );
}

// COMPONENTE MODIFICADO PARA USAR DADOS DINÂMICOS
function PersonaList({ onApiClick, onTryClick }) {
  return (
    <div className="mt-5 flex flex-wrap gap-10">
      {personasData.map((persona) => (
        <PersonaCard
          key={persona.id}
          persona={persona}
          onApiClick={onApiClick}
          onTryClick={onTryClick}
        />
      ))}
    </div>
  );
}


function Home() {
  // LÓGICA PARA CONTROLAR OS MODAIS
  const [activeModal, setActiveModal] = useState(null); // 'api', 'try', or null
  const [selectedPersona, setSelectedPersona] = useState(null);

  const handleApiClick = (persona) => {
    setSelectedPersona(persona);
    setActiveModal("api");
  };

  const handleTryClick = (persona) => {
    setSelectedPersona(persona);
    setActiveModal("try");
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedPersona(null);
  };

  return (
    <>
      <div className="bg-[#18181B] w-screen h-screen font-inter">
        <div className="flex h-full w-[75%] ml-[15%]">
          <PersonaNavbar />
          <div className="flex flex-col gap-3 p-6 w-full">
            <TopBar />
            <FilterBar />
            <PersonaList onApiClick={handleApiClick} onTryClick={handleTryClick} />
          </div>
        </div>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL DOS MODAIS (FORA DO LAYOUT PRINCIPAL) */}
      {activeModal === "api" && selectedPersona && (
        <ApiModal persona={selectedPersona} onClose={handleCloseModal} />
      )}
      {activeModal === "try" && selectedPersona && (
        <TryModal persona={selectedPersona} onClose={handleCloseModal} />
      )}
    </>
  );
}

export default Home;