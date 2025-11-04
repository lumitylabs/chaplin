import React, { useState } from "react";
import LoginBg from "../assets/login_bg.png";
import Icon1 from "../assets/login_app_icon_1.svg";
import Icon2 from "../assets/login_app_icon_2.svg";
import Icon3 from "../assets/login_app_icon_3.svg";
import Icon4 from "../assets/login_app_icon_4.svg";
import Icon5 from "../assets/login_app_icon_5.svg";
import Icon6 from "../assets/login_app_icon_6.svg";
import Icon7 from "../assets/login_app_icon_7.svg";
import MetaMaskIcon from "../assets/metamask_icon_large.png";
import LumityFooter from "../assets/login_powered_by_lumity.svg";
import Navbar from "../components/ui/general/Navbar";
import "simplebar-react/dist/simplebar.min.css";
import SimpleBar from 'simplebar-react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';

// ----- Modal para instalar MetaMask -----
function InstallMetaMaskModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xs bg-opacity-70 z-50 flex justify-center items-center">
      <div className="bg-[#26272B] text-white p-8 flex flex-col items-center rounded-3xl shadow-lg w-[90%] max-w-sm">
        <img src={MetaMaskIcon} className="w-16 h-16 mb-4" alt="MetaMask Icon" />
        <h2 className="font-inter font-bold text-2xl mb-2 text-center">MetaMask not detected</h2>
        <p className="text-gray-400 text-center mb-6">
          To continue, you need to install the MetaMask extension in your browser.
        </p>
        <div className="w-full flex flex-col gap-3">
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center h-12 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all active:scale-95 duration-200 flex items-center justify-center gap-3 text-[0.92em] tracking-tight cursor-pointer"
          >
            Install MetaMask
          </a>
          <button
            onClick={onClose}
            className="w-full h-12 bg-neutral-600 text-white rounded-xl hover:bg-neutral-700 transition-all active:scale-95 duration-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- UI helpers -----
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


function detectPreferredEthereumProvider() {
  if (typeof window === 'undefined') return null;

  const eth = window.ethereum;

  if (eth && Array.isArray(eth.providers)) {

    const mm = eth.providers.find((p) => p && p.isMetaMask);
    if (mm && typeof mm.request === 'function') return mm;


    const any = eth.providers.find((p) => p && typeof p.request === 'function');
    if (any) return any;

    return null;
  }

  // single provider
  if (eth && typeof eth.request === 'function') return eth;

  return null;
}

// ----- Modal / Login principal -----
function LoginModal() {
  const signInHook = useSignIn();
  const signUpHook = useSignUp();


  const signIn = signInHook ? signInHook.signIn : null;
  const setActive = signInHook ? signInHook.setActive : null;
  const signUp = signUpHook ? signUpHook.signUp : null;

  const [isLoading, setIsLoading] = useState(false);
  const [showInstallMetaMaskModal, setShowInstallMetaMaskModal] = useState(false);
  const [lastError, setLastError] = useState(null);


  const handleMetaMaskSignIn = async () => {
    setLastError(null);


    const preferredProvider = detectPreferredEthereumProvider();

    if (!preferredProvider) {
      console.warn('Nenhum provider Ethereum compatível detectado.');
      setShowInstallMetaMaskModal(true);
      return;
    }


    if (!signIn || typeof signIn.authenticateWithMetamask !== 'function') {
      console.error('Clerk signIn.authenticateWithMetamask não disponível.');
      setLastError('Authentication subsystem is not ready. Please try again later.');
      return;
    }

    setIsLoading(true);


    const originalWindowEthereum = window.ethereum;
    try {

      window.ethereum = preferredProvider;

      if (typeof preferredProvider.request === 'function') {
        try {
          await preferredProvider.request({ method: 'eth_requestAccounts' });
        } catch (reqErr) {
          console.error('Usuário recusou permissão eth_requestAccounts ou request falhou:', reqErr);
          setLastError('Wallet permission was not granted.');
          return;
        }
      }

      try {
        const signInAttempt = await signIn.authenticateWithMetamask();
        if (signInAttempt && signInAttempt.status === 'complete') {
          if (typeof setActive === 'function') {
            await setActive({ session: signInAttempt.createdSessionId });
          }
          return; // sucesso
        }

        console.warn('signIn.authenticateWithMetamask result:', signInAttempt);
      } catch (signinError) {
        console.error('Erro durante signIn.authenticateWithMetamask:', signinError);

        if (signUp && typeof signUp.authenticateWithMetamask === 'function') {
          try {
            const signUpAttempt = await signUp.authenticateWithMetamask();
            if (signUpAttempt && signUpAttempt.status === 'complete') {
              if (typeof setActive === 'function') {
                await setActive({ session: signUpAttempt.createdSessionId });
              }
              return;
            }
            console.warn('signUp.authenticateWithMetamask result:', signUpAttempt);
          } catch (signupErr) {
            console.error('Erro no cadastro com MetaMask:', signupErr);
            setLastError('Failed to register using the wallet.');
          }
        } else {
          setLastError('Sign-in failed and signup flow is not available.');
        }
      }
    } finally {
      try {
        window.ethereum = originalWindowEthereum;
      } catch (restoreErr) {
        console.warn('Could not restore original window.ethereum:', restoreErr);
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="
          absolute z-20 top-60 w-[90%] max-w-sm sm:max-w-md
          bg-[#26272B] text-white p-8 flex flex-col items-center rounded-3xl
          shadow-neutral-950 shadow-lg select-none mx-auto
          md:absolute md:top-[45%] md:-translate-y-1/2 md:left-[5%] md:translate-x-[30%]
          md:w-[380px] lg:w-[400px]
        "
      >
        <div className="flex flex-col items-center text-center justify-between py-1 space-y-6">
          <div className="space-y-2">
            <div className="font-inter font-bold text-3xl leading-[1.2]">
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
            <button
              onClick={handleMetaMaskSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white text-black rounded-xl hover:bg-[#E3E3E4] transition-all active:scale-95 duration-200 flex items-center justify-center gap-3 text-[0.92em] tracking-tight cursor-pointer disabled:opacity-50"
            >
              <img src={MetaMaskIcon} className="w-6 h-6" alt="MetaMask Icon" />
              <span>{isLoading ? 'Conecting...' : 'Continue with MetaMask'}</span>
            </button>

            {lastError && (
              <div className="text-xs text-red-400 text-center max-w-[18rem] pt-2">
                {lastError}
              </div>
            )}

            <div className="text-xs text-gray-500 text-center max-w-[18rem] pt-2">
              By continuing, you agree with the{" "}
              <a href="#" className="font-medium text-gray-400 hover:text-white transition-colors">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="font-medium text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      <InstallMetaMaskModal
        isOpen={showInstallMetaMaskModal}
        onClose={() => setShowInstallMetaMaskModal(false)}
      />
    </>
  );
}

// ----- Imagem de fundo -----
function ImageBg() {
  return (
    <div
      className="
        absolute lg:top-20 lg:right-60 w-full h-[40vh] sm:h-[50vh]
        md:h-[600px] md:w-[60%] lg:h-[650px] lg:w-[60%]
        flex items-center justify-center overflow-hidden
        rounded-none md:rounded-[2rem] lg:rounded-[2rem]
      "
    >
      <img
        src={LoginBg}
        className="w-full h-full object-contain md:object-cover select-none"
        alt="Background"
      />
    </div>
  );
}

// ----- Footer -----
function Footer() {
  return (
    <footer className="w-full py-8 flex flex-col items-center justify-center gap-4 bg-[#18181B] select-none">
      <div className="flex text-[#818182] gap-5 text-sm">
        <a href="https://discord.com/channels/1174034150462861324/1433186185253093517" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
          Discord
        </a>
        <a href="https://github.com/lumitylabs/chaplin" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
      <a href="https://lumitylabs.com/" className="text-xs text-[#818182] hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
        <img src={LumityFooter} alt="Powered by Lumity" />
      </a>
    </footer>
  );
}

// ----- Componente principal de Login (com SimpleBar) -----
function Login() {
  return (
    <SimpleBar style={{ maxHeight: '100vh' }} className="login-page-scrollbar">
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

        {/* Elemento necessário pelo Clerk para inicializar Smart CAPTCHA widget.
            O log "Cannot initialize Smart CAPTCHA widget because the clerk-captcha DOM element was not found"
            desaparece se esse elemento existir quando Clerk tentar inicializar. */}
        <div id="clerk-captcha" style={{ display: 'none' }} />

        <Footer />
      </div>
    </SimpleBar>
  );
}

export default Login;
