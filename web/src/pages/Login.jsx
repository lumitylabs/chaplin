import React from "react";
import { useState } from "react";

// Seus imports de assets permanecem os mesmos
import LoginBg from "../assets/login_bg.png";
import Icon1 from "../assets/login_app_icon_1.svg";
import Icon2 from "../assets/login_app_icon_2.svg";
import Icon3 from "../assets/login_app_icon_3.svg";
import Icon4 from "../assets/login_app_icon_4.svg";
import Icon5 from "../assets/login_app_icon_5.svg";
import Icon6 from "../assets/login_app_icon_6.svg";
import Icon7 from "../assets/login_app_icon_7.svg";
import MetaMaskIcon from "../assets/metamask_icon.png";
import LumityFooter from "../assets/login_powered_by_lumity.svg";
import Navbar from "../components/ui/general/Navbar";

// --- COMPONENTES AUXILIARES ---

function IconButton({ icon }) {
  return (
    <div className="flex p-1 bg-[#363639] rounded-xl w-10 h-10 justify-center items-center">
      <img src={icon} alt="App Icon" />
    </div>
  );
}

function Separator() {
  return (
    <div className="flex items-center w-full max-w-xs mt-10 mb-5">
      <div className="flex-grow border-t border-neutral-700"></div>
      <span className="mx-4 text-sm font-medium text-gray-400">Sign In</span>
      <div className="flex-grow border-t border-neutral-700"></div>
    </div>
  );
}

function IconGrid() {
  return (
    <div className="flex justify-center gap-2">
      <IconButton icon={Icon1} />
      <IconButton icon={Icon2} />
      <IconButton icon={Icon3} />
      <IconButton icon={Icon4} />
      <IconButton icon={Icon5} />
      <IconButton icon={Icon6} />
      <IconButton icon={Icon7} />
    </div>
  );
}

// --- COMPONENTES PRINCIPAIS (REFINADOS) ---

function LoginModal() {
  return (
    // Posicionado para sobrepor a imagem à esquerda, com z-index para ficar na frente
    <div className="absolute top-1/2 -translate-y-1/2 -left-17 w-[406px] bg-[#26272B] text-white p-8 flex flex-col items-center rounded-3xl shadow-neutral-950 shadow-lg z-20 select-none">

      {/* Container flex para distribuir o conteúdo verticalmente */}
      <div className="flex flex-col items-center text-center h-full justify-between py-1">

        {/* Bloco de Conteúdo Superior */}
        <div className="space-y-2">
          <div className="font-inter font-extrabold text-3xl leading-[1.2]">
            <h1>Get access to create</h1>
            <h1>and use your Personas</h1>
          </div>
          <div className="text-base text-gray-400 pb-4 tracking-tight">
            <p>Perfect for games, projects,</p>
            <p>assistants and challenging tasks</p>
          </div>
        </div>

        {/* Grid de Ícones posicionado no centro do espaço restante */}
        <IconGrid />


        <Separator />


        {/* Bloco de Conteúdo Inferior */}
        <div className="w-full flex flex-col items-center gap-4">

          <button className="w-full h-12 bg-white text-black rounded-xl  hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 text-[0.92em] tracking-tight cursor-pointer">
            <img src={MetaMaskIcon} className="w-6 h-6" alt="MetaMask Icon" />
            Continue with MetaMask
          </button>
          <div className="text-xs text-gray-500 text-center max-w-[18rem] pt-2">
            By continuing, you agree with the <a href="#" className="font-medium text-gray-400 hover:text-white transition-colors">Terms</a> and <a href="#" className="font-medium text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageBg() {
  return (
    // Ancorado à direita, com z-index para ficar atrás do modal. Dimensões fixas para manter proporção.
    <div className="absolute top-1/2 -translate-y-1/2 -right-15 w-[1080px] h-[580px] hidden lg:block z-10 select-none">
      <img src={LoginBg} className="w-full h-full object-cover rounded-4xl" alt="Background" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full py-8 flex flex-col items-center justify-center gap-4 bg-[#18181B] select-none">
      <div className="flex text-[#818182] gap-5 text-sm">
        <a href="#" className="hover:text-white transition-colors">How it Works</a>
        <a href="#" className="hover:text-white transition-colors">Blog</a>
      </div>
      <img src={LumityFooter} alt="Powered by Lumity" />
    </footer>
  );
}

function Login() {
  return (
    <div className="bg-[#18181B] font-inter text-white">
      <Navbar />

      {/* 'main' ocupa a altura da tela e tem padding inferior para forçar a rolagem */}
      <main className="min-h-screen flex items-center justify-center relative pb-15">
        {/* Este é o "palco" relativo que contém a cena de login. */}
        <div className="relative w-full max-w-7xl h-[600px] ">
          <LoginModal />
          <ImageBg />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Login;