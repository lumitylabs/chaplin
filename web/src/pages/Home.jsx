import React, { useState, useEffect } from "react";
import { Search, Star } from 'lucide-react';

// --- COMPONENTES E ASSETS ---
// Verifique se os caminhos estão corretos para o seu projeto
import PersonaNavbar from "../components/ui/general/PersonaNavbar";
import ApiModal from "../components/ui/general/ApiModal";
import TryModal from "../components/ui/general/TryModal";
import OrcImage from "../assets/persona.png";
import MinerImage from "../assets/persona.png";
import AnalystImage from "../assets/persona.png";

// --- DADOS MOCKADOS ---
const personasData = [
  { id: 1, name: "Charlie Chaplin", image: OrcImage, category: "Humor", desc: "Um putasso, mas que tem um coração...", apiUrl: "http://persona.request/orc-1832" },
  { id: 2, name: "Orc Minerador", image: MinerImage, category: "Entertainment & Gaming", desc: "Um ego minerador que fala com o jogador.", apiUrl: "http://persona.request/miner-4512" },
  { id: 3, name: "Analista Market", image: AnalystImage, category: "Assistant", desc: "Um auxiliar para criação de propagandas para...", apiUrl: "http://persona.request/analyst-7734" },
];

// --- SUB-COMPONENTES DA PÁGINA HOME ---

function TopBar({ searchTerm, onSearchChange, viewMode }) {
  return (
    <div className="flex justify-between items-center">
      <div className="font-inter font-semibold text-[1em] text-[#FAFAFA]">
        {viewMode === 'favorites' ? 'Favorites' : 'Community Chaplins'}
      </div>
      <div className="flex items-center gap-2 px-6 p-3.5 w-90 rounded-full bg-[#202024]">
        <Search color="#FAFAFA" size={14} />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent text-[#FAFAFA] placeholder:text-[#959BA5] text-sm focus:outline-none w-full"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
    </div>
  );
}

function FilterTag({ name, isActive, onClick }) {
  const baseClasses = "flex items-center justify-center font-inter font-medium text-[0.90em] p-3 px-4 rounded-xl cursor-pointer transition-colors";
  const activeClasses = "bg-[#FAFAFA] text-[#1C1C1F]";
  const inactiveClasses = "bg-[#26272B] text-[#A2A2AB] hover:text-white";
  return (
    <button className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`} onClick={() => onClick(name)}>
      {name}
    </button>
  );
}

function FilterBar({ activeCategory, onCategorySelect }) {
  const categories = ["All", "Assistant", "Anime", "Creativity & Writing", "Entertainment & Gaming", "History", "Humor", "Learning"];
  return (
    <div className="flex gap-2">
      {categories.map((category) => (
        <FilterTag key={category} name={category} isActive={activeCategory === category} onClick={onCategorySelect} />
      ))}
    </div>
  );
}

function PersonaCard({ persona, onApiClick, onTryClick, isFavorite, onToggleFavorite }) {
  return (
    <div className="flex gap-3 h-40 w-88 bg-[#202024] rounded-2xl py-4 px-4 relative items-center">
      <button onClick={() => onToggleFavorite(persona.id)} className="absolute top-3.5 right-4 p-1 z-10 cursor-pointer" aria-label="Toggle Favorite">
        <Star size={15} className={`transition-colors ${isFavorite ? 'text-yellow-400' : 'text-[#9C9CA5] hover:text-[#FAFAFA]'}`} fill={isFavorite ? 'currentColor' : 'transparent'} />
      </button>
      <img src={persona.image} className="w-24 h-32 object-cover rounded-2xl" />
      <div className="flex flex-col gap-1 h-full w-full">
        <div className="font-inter font-bold text-[0.84em] text-[#F7F7F7]">{persona.name}</div>
        <div className="w-full text-[0.84em] text-[#88888F] mb-2 line-clamp-2 h-60">{persona.desc}</div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => onApiClick(persona)} className="flex w-20 py-1.5 px-5 border-[#303136] border rounded-full text-white text-[0.84em] justify-center items-center cursor-pointer transition duration-200 active:scale-95 hover:bg-[#1F1F23]">API</button>
          <button onClick={() => onTryClick(persona)} className="flex w-20 py-1.5 px-5 bg-white text-black text-[0.84em] rounded-full justify-center items-center cursor-pointer transition duration-200 active:scale-95 hover:bg-[#E3E3E4]">Try</button>
        </div>
      </div>
    </div>
  );
}

function PersonaList({ personas, onApiClick, onTryClick, favorites, onToggleFavorite }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {personas.map((persona) => (
        <PersonaCard key={persona.id} persona={persona} onApiClick={onApiClick} onTryClick={onTryClick} isFavorite={favorites.includes(persona.id)} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}


// --- COMPONENTE PRINCIPAL ---

function Home() {
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState('all');

  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('favoritePersonas');
    if (savedFavorites) {
      return JSON.parse(savedFavorites);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('favoritePersonas', JSON.stringify(favorites));
  }, [favorites]);

  const handleApiClick = (persona) => { setSelectedPersona(persona); setActiveModal("api"); };
  const handleTryClick = (persona) => { setSelectedPersona(persona); setActiveModal("try"); };
  const handleCloseModal = () => { setActiveModal(null); setSelectedPersona(null); };

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
  };

  const handleToggleFavorite = (personaId) => {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(personaId)
        ? currentFavorites.filter((id) => id !== personaId)
        : [...currentFavorites, personaId]
    );
  };

  const filteredPersonas = personasData
    .filter((persona) => {
      return viewMode === 'favorites' ? favorites.includes(persona.id) : true;
    })
    .filter((persona) => {
      return activeCategory === "All" ? true : persona.category === activeCategory;
    })
    .filter((persona) => {
      return persona.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

  return (
    <>
      <div className="bg-[#18181B] w-screen h-screen font-inter">
        <div className="flex h-full w-[75%] ml-[15%]">
          <PersonaNavbar viewMode={viewMode} setViewMode={setViewMode} />
          <div className="flex flex-col gap-3 p-6 w-full">
            <TopBar
              searchTerm={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
              viewMode={viewMode}
            />
            <FilterBar
              activeCategory={activeCategory}
              onCategorySelect={handleCategorySelect}
            />
            <PersonaList
              personas={filteredPersonas}
              onApiClick={handleApiClick}
              onTryClick={handleTryClick}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        </div>
      </div>
      {activeModal === "api" && selectedPersona && <ApiModal persona={selectedPersona} onClose={handleCloseModal} />}
      {activeModal === "try" && selectedPersona && <TryModal persona={selectedPersona} onClose={handleCloseModal} />}
    </>
  );
}

export default Home;