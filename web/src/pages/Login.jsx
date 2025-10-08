import React from "react";
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
    <div className="flex items-center w-full max-w-xs mt-5 md:mt-5 md:mb-5">
      <div className="flex-grow border-t border-neutral-700"></div>
      <span className="mx-4 text-sm font-medium text-gray-400">Sign In</span>
      <div className="flex-grow border-t border-neutral-700"></div>
    </div>
  );
}

function IconGrid() {
  return (
    <div className="flex justify-center gap-2">
      {[Icon1, Icon2, Icon3, Icon4, Icon5, Icon6, Icon7].map((icon, i) => (
        <IconButton key={i} icon={icon} />
      ))}
    </div>
  );
}

// --- COMPONENTES PRINCIPAIS ---

function LoginModal() {
  return (
    <div
      className="
        absolute z-20 top-60
        w-[90%] max-w-sm sm:max-w-md
        bg-[#26272B] text-white p-8 flex flex-col items-center rounded-3xl
        shadow-neutral-950 shadow-lg select-none
        mx-auto
        md:absolute md:top-[45%] md:-translate-y-1/2 md:left-[5%] md:translate-x-[30%]
        md:w-[380px] lg:w-[400px]
      "
    >
      <div className="flex flex-col items-center text-center justify-between py-1 space-y-6">
        <div className="space-y-2">
          <div className="font-inter font-extrabold text-3xl leading-[1.2]">
            <h1>Get access to create</h1>
            <h1>and use your Chaplins</h1>
          </div>
          <div className="text-base text-gray-400 tracking-tight">
            <p>Personas for games, projects,</p>
            <p>assistants and challenging tasks</p>
          </div>
        </div>

        <IconGrid />
        <Separator />

        <div className="w-full flex flex-col items-center gap-4">
          <button className="w-full h-12 bg-white text-black rounded-xl hover:bg-[#E3E3E4] transition-colors flex items-center justify-center gap-3 text-[0.92em] tracking-tight cursor-pointer">
            <img src={MetaMaskIcon} className="w-6 h-6" alt="MetaMask Icon" />
            Continue with MetaMask
          </button>
          <div className="text-xs text-gray-500 text-center max-w-[18rem] pt-2">
            By continuing, you agree with the{" "}
            <a
              href="#"
              className="font-medium text-gray-400 hover:text-white transition-colors"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="font-medium text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageBg() {
  return (
    <div
      className="
        absolute lg:top-20 lg:right-60 w-full h-[40vh] sm:h-[50vh]
        md:h-[600px] md:w-[60%] 
        lg:h-[650px] lg:w-[60%]
        flex items-center justify-center overflow-hidden
        rounded-none md:rounded-[2rem] lg:rounded-[2rem]
      "
    >
      <img
        src={LoginBg}
        className="w-full h-full object-contain md:object-cover"
        alt="Background"
      />
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full py-8 flex flex-col items-center justify-center gap-4 bg-[#18181B] select-none">
      <div className="flex text-[#818182] gap-5 text-sm">
        <a href="#" className="hover:text-white transition-colors">
          How it Works
        </a>
        <a href="#" className="hover:text-white transition-colors">
          Blog
        </a>
      </div>
      <img src={LumityFooter} alt="Powered by Lumity" />
    </footer>
  );
}

function Login() {
  return (
    <div className="bg-[#18181B] font-inter text-white overflow-hidden">
      <Navbar />

      <main
        className="
          relative min-h-screen flex flex-col justify-start items-center
          md:flex-row md:justify-center md:items-center
          md:overflow-visible pb-16 md:pb-0
        "
      >
        <ImageBg />
        <LoginModal />
      </main>

      <Footer />
    </div>
  );
}

export default Login;
