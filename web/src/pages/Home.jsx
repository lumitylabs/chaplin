import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, Star, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
// 1. Importando a função de animação do framer-motion
import { animate } from "framer-motion";
import { getChaplins } from "../services/apiService";
import "simplebar-react/dist/simplebar.min.css";
import SimpleBar from 'simplebar-react';

// --- COMPONENTES E ASSETS ---
import PersonaNavbar from "../components/ui/general/PersonaNavbar";
import ApiModal from "../components/ui/general/ApiModal";
import TryModal from "../components/ui/general/TryModal";
import ChaplinImage from "../assets/persona.png";

const CHAPLIN_SESSION_MAP_KEY = "chaplin_jobs_map_session";

function TopBar({ searchTerm, onSearchChange, viewMode }) {
  return (
    <header className="flex justify-end md:justify-between items-center w-full gap-4">
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

// ---------- FilterBar: Implementado com animação de scroll suave via Framer Motion ----------
function FilterBar({ activeCategory, onCategorySelect }) {
  const categories = ["All", "Assistant", "Anime", "Creativity & Writing", "Entertainment & Gaming", "History", "Humor", "Learning", "Lifestyle", "Parody", "RPG & Puzzles"];
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const firstItem = container.querySelector('.snap-start:first-child');
    const lastItem = container.querySelector('.snap-start:last-child');
    if (!firstItem || !lastItem) return;

    container.scrollLeft = 0;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === firstItem) setCanScrollLeft(!entry.isIntersecting);
        if (entry.target === lastItem) setCanScrollRight(!entry.isIntersecting);
      });
    }, { root: container, threshold: 1.0 });

    observer.observe(firstItem);
    observer.observe(lastItem);

    const handleMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - container.offsetLeft;
      scrollLeftStart.current = container.scrollLeft;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };
    const handleMouseLeave = () => { isDragging.current = false; container.style.cursor = 'grab'; container.style.userSelect = 'auto'; };
    const handleMouseUp = () => { isDragging.current = false; container.style.cursor = 'grab'; container.style.userSelect = 'auto'; };
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      container.scrollLeft = scrollLeftStart.current - walk;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleScrollByButton = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

    if (prefersReducedMotion) {
      container.scrollLeft = newScrollLeft;
    } else {
      // 2. Usando a função animate para controlar a propriedade scrollLeft
      animate(container.scrollLeft, newScrollLeft, {
        type: "spring",
        stiffness: 400,
        damping: 40,
        onUpdate: (latest) => {
          container.scrollLeft = latest;
        }
      });
    }
  };

  return (
    <div className="relative w-full group">
      {/* 3. Removida a classe 'scroll-smooth' para evitar conflito com a animação do framer-motion */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto hide-scrollbar snap-x snap-mandatory cursor-grab"
      >
        <div className="flex gap-2 px-6 py-2">
          {categories.map((category) => (
            <div key={category} className="snap-start">
              <FilterTag name={category} isActive={activeCategory === category} onClick={onCategorySelect} />
            </div>
          ))}
        </div>
      </div>

      {canScrollLeft && (
        <button
          onClick={() => handleScrollByButton('left')}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 z-20 w-24 h-full flex items-center justify-start
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300
                     bg-gradient-to-r from-[#18181B] to-transparent cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} className="text-white/80 ml-2" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => handleScrollByButton('right')}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 z-20 w-24 h-full flex items-center justify-end
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300
                     bg-gradient-to-l from-[#18181B] to-transparent cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} className="text-white/80 mr-2" />
        </button>
      )}
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
  } catch (e) { }
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

  useEffect(() => { if (location.state?.desiredView) setViewMode(location.state.desiredView); }, [location.state]);
  useEffect(() => { setIsNavbarOpen(window.innerWidth >= 1024); }, []);

  useEffect(() => {
    async function fetchChaplins() {
      setIsLoading(true);
      setError(null);
      const result = await getChaplins();
      if (result.error) {
        setError(result.error);
        setAllPersonas([]);
      } else {
        const personasArray = Object.keys(result.data).map(key => ({ id: key, ...result.data[key] }));
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

  useEffect(() => { localStorage.setItem('favoritePersonas', JSON.stringify(favorites)); }, [favorites]);

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
                <h1 className="md:hidden font-inter font-semibold text-lg text-[#FAFAFA]">
                  {viewMode === 'favorites' ? 'Favorites' : 'Community Chaplins'}
                </h1>
                <FilterBar activeCategory={activeCategory} onCategorySelect={handleCategorySelect} />
              </div>

              <div className="flex flex-col">
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
        {activeModal === "try" && selectedPersona && <TryModal persona={selectedPersona} onClose={handleCloseModal} />}
      </div>
    </SimpleBar>
  );
}

export default Home;