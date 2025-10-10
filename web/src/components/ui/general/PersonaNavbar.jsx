import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// --- ÍCONES E ASSETS ---
// Verifique se os caminhos estão corretos para o seu projeto
import { Plus } from 'iconoir-react';
import { LogOut, Star, ChevronDown } from 'lucide-react';
import hatIcon from "../../../assets/hatIcon.svg";
import Avatar from "../../../assets/Avatar.png";
import Persona from "../../../assets/Persona.png";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { SignOutButton, useUser } from "@clerk/clerk-react";

// --- SUB-COMPONENTES DA NAVBAR ---

function NavbarHeader() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 px-5 pt-0 pb-0 mt-5">
      <div className="font-mali w-min font-medium text-2xl text-white tracking-[-0.04em] cursor-pointer" onClick={() => navigate("/home")}>Chaplin</div>
      <button className="flex p-1.5 px-3 gap-1 bg-[#202024] w-32 items-center rounded-full text-[#FAFAFA] text-[0.84em] border-[1px] border-[#26272B] cursor-pointer hover:bg-[#3B3B41]" onClick={() => navigate("/create")}>
        <Plus color="#94949C" height={36} width={36} />
        Create
      </button>
    </div>
  );
}

function PersonaPage({ viewMode, setViewMode }) {
  const navigate = useNavigate();
  const baseButtonClasses = "flex items-center gap-3 p-3.5 text-[0.84em] rounded-lg transition-all duration-200 active:scale-95 cursor-pointer";
  const activeClasses = "bg-[#26272B] text-white font-semibold";
  const inactiveClasses = "text-white hover:bg-[#1F1F22] font-normal";

  const handleNavigation = (targetView) => {
    navigate("/home");
    setViewMode(targetView);
  };

  return (
    <div className="flex flex-col gap-2 font-semibold text-[#817676] px-5">
      <button className={`${baseButtonClasses} ${viewMode === 'all' ? activeClasses : inactiveClasses}`} onClick={() => handleNavigation('all')}>
        <img className="w-5" src={hatIcon} alt="All Chaplins" />
        Chaplins
      </button>
      <button className={`${baseButtonClasses} ${viewMode === 'favorites' ? activeClasses : inactiveClasses}`} onClick={() => handleNavigation('favorites')}>
        <Star
          fill="white"
          color="white"
          size={20}
        />
        Favorites
      </button>
    </div>
  );
}

function PersonaItem({ name, image }) {
  return (
    <button className="flex items-center gap-2 hover:bg-[#262628] rounded-lg cursor-pointer">
      <div className="flex px-2.5 py-1.5 items-center gap-2">
        <img className="w-9 h-9 rounded-full" src={image} />
        <div className="font-inter text-[1.06em] text-[#FAF6F3]">{name}</div>
      </div>
    </button>
  );
}

function YourPersonas() {
  return (
    <div className="flex h-full text-[0.80em] text-[#9898A0] flex-col gap-2 px-5">
      Your Chaplins
      <SimpleBar style={{ maxHeight: "32.5rem", minHeight: "15rem" }} autoHide={false}>
        <div className="flex max-h-full flex-col gap-3">
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Miner" image={Persona} />
        </div>
      </SimpleBar>
    </div>
  );
}

function UserAccount() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const formatWalletAddress = (address, startChars = 7, endChars = 4) => {
    if (!address || address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  const walletAddress = user?.web3Wallets?.[0]?.web3Wallet;
  const displayText = walletAddress ? formatWalletAddress(walletAddress) : '1A1zP1e...22e';

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="px-5 mt-4 mb-4">
      <div className="flex items-center border-t-1 border-[#26272B] relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex mt-3 px-2 py-1.5 w-full items-center gap-3 hover:bg-[#3F3F46] rounded-lg cursor-pointer"
        >
          <img className="w-9 h-9 rounded-full shadow-xl" src={user?.imageUrl || Avatar} />
          <div className="flex w-full items-center px-1 justify-between">
            <span className="font-inter text-[#F4F1F4] font-light text-[0.78em]">
              {displayText}
            </span>
            <ChevronDown size={16} color="#A2A2AB" />
          </div>
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute bottom-14 left-0 w-62 bg-[#202024] rounded-lg shadow-lg overflow-hidden z-10"
          >
            <SignOutButton>
              <button className="flex w-full items-center justify-between gap-3 px-4 py-3 hover:bg-[#3F3F46] text-[#EDEFF1] font-inter text-sm cursor-pointer">
                <span>Logout</span>
                <LogOut size={18} />
              </button>
            </SignOutButton>
          </div>
        )}
      </div>
    </div>
  );
}


// --- COMPONENTE PRINCIPAL DA NAVBAR ---

function PersonaNavbar({ viewMode, setViewMode }) {
  return (
    <div className="fixed left-0 top-0 h-screen w-[15%] bg-[#131316] border-r-[1px] border-[#26272B] font-inter flex flex-col justify-between">
      <div className="flex flex-col gap-8 h-full">
        <div className="flex flex-col gap-5">
          <NavbarHeader />
          <PersonaPage viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <div className="flex flex-col">
          <YourPersonas />
        </div>
      </div>
      <UserAccount />
    </div>
  );
}

export default PersonaNavbar;