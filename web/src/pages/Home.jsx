import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, Star, Menu } from 'lucide-react';
import { getChaplins } from "../services/apiService";
import "simplebar-react/dist/simplebar.min.css";
import SimpleBar from 'simplebar-react';

// --- COMPONENTES E ASSETS ---
import PersonaNavbar from "../components/ui/general/PersonaNavbar";
import ApiModal from "../components/ui/general/ApiModal";
import TryModal from "../components/ui/general/TryModal";
import ChaplinImage from "../assets/persona.png";


const CHAPLIN_SESSION_MAP_KEY = "chaplin_jobs_map_session";

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
  const imageUrl = persona.image_url || ChaplinImage;

  return (
    <div className="flex flex-col sm:flex-row gap-4 h-auto sm:h-40 w-full bg-[#202024] rounded-2xl p-4 relative items-center select-none">
      <button onClick={() => onToggleFavorite(persona.id)} className="absolute top-3.5 right-4 p-1 z-10 cursor-pointer" aria-label="Toggle Favorite">
        <Star size={15} className={`transition-colors ${isFavorite ? 'text-yellow-400' : 'text-[#9C9CA5] hover:text-[#FAFAFA]'}`} fill={isFavorite ? 'currentColor' : 'transparent'} />
      </button>
      <img src={imageUrl} className="w-24 h-32 object-cover rounded-2xl flex-shrink-0" alt={persona.name} />
      <div className="flex flex-col gap-1 h-full w-full">
        <div className="font-inter font-bold text-sm text-[#F7F7F7]">{persona.name}</div>
        <div className="text-sm text-[#88888F] mb-2 line-clamp-2 h-10">{persona.instructions}</div>
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

function CardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 h-auto sm:h-40 w-full bg-[#202024] rounded-2xl p-4 relative items-center select-none">
      <button className="absolute top-3.5 right-4 p-1 z-10 cursor-pointer" aria-label="Toggle Favorite"></button>
      <div className="w-24 h-32 object-cover rounded-2xl flex-shrink-0 animate-pulse bg-gray-400" />
      <div className="flex flex-col gap-1 h-full w-full">
        <div className="font-inter font-bold text-sm text-[#F7F7F7] w-40 h-[14px] animate-pulse bg-gray-400"></div>
        <div className="">
          <div className="text-sm text-[#88888F] mb-1 line-clamp-2 w-60 h-[14px] animate-pulse bg-gray-400"></div>
          <div className="text-sm text-[#88888F] mb-2 line-clamp-2 w-60 h-[14px] animate-pulse bg-gray-400"></div>
        </div>
        <div className="flex gap-2 justify-end mt-auto">
          <button className="flex w-20 py-1.5 px-5 border-[#303136] border rounded-full text-white text-sm justify-center items-center cursor-pointer transition duration-200 active:scale-95 hover:bg-[#1F1F23]">API</button>
          <button className="flex w-20 py-1.5 px-5 bg-white text-black text-sm rounded-full justify-center items-center cursor-pointer transition duration-200 active:scale-95 hover:bg-[#E3E3E4]">Try</button>
        </div>
      </div>
    </div>
  );
}

function removeChaplinSessionKeys(personaId) {
  try {
    const raw = sessionStorage.getItem(CHAPLIN_SESSION_MAP_KEY) || "{}";
    const map = JSON.parse(raw);
    if (map && map[personaId]) {
      delete map[personaId];
      sessionStorage.setItem(CHAPLIN_SESSION_MAP_KEY, JSON.stringify(map));
    }
  } catch (e) {
    // swallow
  }

  try {
    sessionStorage.removeItem(`chaplin_modal_open_${personaId}`);
  } catch (e) { }
}

function Home() {
  const location = useLocation();
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState('all');
  const [allPersonas, setAllPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.desiredView) {
      setViewMode(location.state.desiredView);
    }
  }, [location.state]);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setIsNavbarOpen(isDesktop);
  }, []);

  useEffect(() => {
    async function fetchChaplins() {
      setIsLoading(true);
      setError(null);
      const result = await getChaplins();

      if (result.error) {
        setError(result.error);
        setAllPersonas([]);
      } else {
        const personasArray = Object.keys(result.data).map(key => ({
          id: key,
          ...result.data[key]
        }));
        setAllPersonas(personasArray);
      }
      setIsLoading(false);
    }

    fetchChaplins();
  }, []);


  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('favoritePersonas');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });

  useEffect(() => {
    localStorage.setItem('favoritePersonas', JSON.stringify(favorites));
  }, [favorites]);

  const handleMobileNavClick = () => { if (window.innerWidth < 1024) setIsNavbarOpen(false); };
  const handleApiClick = (persona) => { setSelectedPersona(persona); setActiveModal("api"); };
  const handleTryClick = (persona) => { removeChaplinSessionKeys(persona.id); setSelectedPersona(persona); setActiveModal("try"); };
  const handleCloseModal = () => { setActiveModal(null); setSelectedPersona(null); };
  const handleCategorySelect = (category) => setActiveCategory(category);
  const handleToggleFavorite = (personaId) => {
    setFavorites((currents) => currents.includes(personaId) ? currents.filter((id) => id !== personaId) : [...currents, personaId]);
  };

  const filteredPersonas = allPersonas
    .filter((p) => viewMode === 'favorites' ? favorites.includes(p.id) : true)
    .filter((p) => activeCategory === "All" ? true : p.category === activeCategory)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <SimpleBar style={{ maxHeight: '100vh' }} className="login-page-scrollbar">
      <div className="bg-[#18181B] min-h-screen font-inter text-white">
        <PersonaNavbar isOpen={isNavbarOpen} setIsOpen={setIsNavbarOpen} viewMode={viewMode} setViewMode={setViewMode} handleMobileNavClick={handleMobileNavClick} />
        <button onClick={() => setIsNavbarOpen(true)} className={`fixed top-5 left-2 z-20 p-2 rounded-full cursor-pointer hover:bg-[#1F1F22] ...`}>
          <Menu color="#A2A2AB" size={23} />
        </button>

        <main className={`transition-all duration-300 ease-in-out ${isNavbarOpen ? 'lg:ml-[260px]' : 'lg:ml-0'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col py-5">
              <div className="flex flex-col gap-5">
                <TopBar searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} viewMode={viewMode} />
                <h1 className="md:hidden font-inter font-semibold text-lg text-[#FAFAFA]">{viewMode === 'favorites' ? 'Favorites' : 'Community Chaplins'}</h1>
                <FilterBar activeCategory={activeCategory} onCategorySelect={handleCategorySelect} />
              </div>

              <div className="flex flex-col gap-5">
                {isLoading ? (
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"> <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> </div>
                ) : error ? (
                  <div className="col-span-full text-center text-red-400 py-10">{`Error: ${error}`}</div>
                ) : (
                  <PersonaList personas={filteredPersonas} onApiClick={handleApiClick} onTryClick={handleTryClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} />
                )}
              </div>

            </div>
          </div>
        </main>

        {activeModal === "api" && selectedPersona && <ApiModal persona={selectedPersona} onClose={handleCloseModal} />}
        {/* CORREÇÃO: A propriedade foi alterada de 'persona' para 'chaplin' para corresponder à nova API do TryModal */}
        {activeModal === "try" && selectedPersona && <TryModal chaplin={selectedPersona} onClose={handleCloseModal} />}
      </div>
    </SimpleBar>
  );
}

export default Home;