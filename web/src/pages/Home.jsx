import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // Importar useLocation
import { Search, Star, Menu } from 'lucide-react';

// --- COMPONENTES E ASSETS ---
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
    <header className="flex justify-end md:justify-between items-center w-full gap-4 pl-12 md:pl-0">
      <h1 className="hidden md:block font-inter font-semibold text-lg text-[#FAFAFA] whitespace-nowrap">
        {viewMode === 'favorites' ? 'Favorites' : 'Community Chaplins'}
      </h1>
      <div className="flex items-center gap-2 px-4 py-4 w-full max-w-xs rounded-full bg-[#202024]">
        <Search color="#959BA5" size={16} />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent text-[#FAFAFA] placeholder:text-[#959BA5] text-sm focus:outline-none w-full"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
    </header>
  );
}

function FilterTag({ name, isActive, onClick }) {
  const baseClasses = "flex items-center justify-center font-inter font-medium text-[0.90em] p-3 px-4 rounded-xl cursor-pointer transition-colors whitespace-nowrap";
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
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2">
        {categories.map((category) => (
          <FilterTag key={category} name={category} isActive={activeCategory === category} onClick={onCategorySelect} />
        ))}
      </div>
    </div>
  );
}

function PersonaCard({ persona, onApiClick, onTryClick, isFavorite, onToggleFavorite }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 h-auto sm:h-40 w-full bg-[#202024] rounded-2xl p-4 relative items-center">
      <button onClick={() => onToggleFavorite(persona.id)} className="absolute top-3.5 right-4 p-1 z-10 cursor-pointer" aria-label="Toggle Favorite">
        <Star size={15} className={`transition-colors ${isFavorite ? 'text-yellow-400' : 'text-[#9C9CA5] hover:text-[#FAFAFA]'}`} fill={isFavorite ? 'currentColor' : 'transparent'} />
      </button>
      <img src={persona.image} className="w-24 h-32 object-cover rounded-2xl flex-shrink-0" alt={persona.name} />
      <div className="flex flex-col gap-1 h-full w-full">
        <div className="font-inter font-bold text-sm text-[#F7F7F7]">{persona.name}</div>
        <div className="text-sm text-[#88888F] mb-2 line-clamp-2 h-10">{persona.desc}</div>
        <div className="flex gap-2 justify-end mt-auto">
          <button onClick={() => onApiClick(persona)} className="flex w-20 py-1.5 px-5 border-[#303136] border rounded-full text-white text-sm justify-center items-center cursor-pointer transition duration-200 active:scale-95 hover:bg-[#1F1F23]">API</button>
          <button onClick={() => onTryClick(persona)} className="flex w-20 py-1.5 px-5 bg-white text-black text-sm rounded-full justify-center items-center cursor-pointer transition duration-200 active:scale-95 hover:bg-[#E3E3E4]">Try</button>
        </div>
      </div>
    </div>
  );
}

function PersonaList({ personas, onApiClick, onTryClick, favorites, onToggleFavorite }) {
  return (
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {personas.map((persona) => (
        <PersonaCard key={persona.id} persona={persona} onApiClick={onApiClick} onTryClick={onTryClick} isFavorite={favorites.includes(persona.id)} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
function Home() {
  const location = useLocation();
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    if (location.state?.desiredView) {
      setViewMode(location.state.desiredView);
    }
  }, [location.state]);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setIsNavbarOpen(isDesktop);
  }, []);

  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('favoritePersonas');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });

  useEffect(() => {
    localStorage.setItem('favoritePersonas', JSON.stringify(favorites));
  }, [favorites]);

  const handleMobileNavClick = () => {
    if (window.innerWidth < 1024) {
      setIsNavbarOpen(false);
    }
  };

  const handleApiClick = (persona) => { setSelectedPersona(persona); setActiveModal("api"); };
  const handleTryClick = (persona) => { setSelectedPersona(persona); setActiveModal("try"); };
  const handleCloseModal = () => { setActiveModal(null); setSelectedPersona(null); };
  const handleCategorySelect = (category) => setActiveCategory(category);
  const handleToggleFavorite = (personaId) => {
    setFavorites((currents) =>
      currents.includes(personaId)
        ? currents.filter((id) => id !== personaId)
        : [...currents, personaId]
    );
  };

  const filteredPersonas = personasData
    .filter((p) => viewMode === 'favorites' ? favorites.includes(p.id) : true)
    .filter((p) => activeCategory === "All" ? true : p.category === activeCategory)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-[#18181B] min-h-screen font-inter text-white">
      <PersonaNavbar
        isOpen={isNavbarOpen}
        setIsOpen={setIsNavbarOpen}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleMobileNavClick={handleMobileNavClick}
      />

      <button
        onClick={() => setIsNavbarOpen(true)}
        className={`fixed top-5 left-2 z-20 p-2 rounded-full hover:bg-[#1F1F22] transition-all duration-200 cursor-pointer ${isNavbarOpen ? 'opacity-0 -translate-x-16' : 'opacity-100 translate-x-0'}`}
        aria-label="Open Menu"
      >
        <Menu color="#A2A2AB" size={23} />
      </button>

      <main
        className={`transition-all duration-300 ease-in-out ${isNavbarOpen ? 'lg:ml-[260px]' : 'lg:ml-0'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 py-6">
            <TopBar
              searchTerm={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
              viewMode={viewMode}
            />
            <h1 className="md:hidden font-inter font-semibold text-lg text-[#FAFAFA]">
              {viewMode === 'favorites' ? 'Favorites' : 'Community Chaplins'}
            </h1>
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
      </main>

      {activeModal === "api" && selectedPersona && <ApiModal persona={selectedPersona} onClose={handleCloseModal} />}
      {activeModal === "try" && selectedPersona && <TryModal persona={selectedPersona} onClose={handleCloseModal} />}
    </div>
  );
}

export default Home;