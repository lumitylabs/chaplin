import React from "react";
import { Wrench, X } from "lucide-react";
import { SendSolid } from 'iconoir-react';
import Avatar from "../../../assets/Avatar.png";
import SimpleBar from "simplebar-react";
import 'simplebar-react/dist/simplebar.min.css';

function TryModal({ persona, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#26272B] rounded-2xl w-[750px] h-[500px] p-6 flex flex-col" // <-- MUDANÇA: Removido justify-between para controle manual do layout
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-md font-semibold text-[#E3E3E4]">{persona.name}</h2>
            <button onClick={onClose} className="cursor-pointer pb-5">
              <X color="#BFBCBC" size={22} />
            </button>
          </div>
          <div className="w-full gap-0 border-t-1 border-[#303135] mt-1"></div>
        </div>

        {/* Área de Chat*/}
        <div className="flex-grow overflow-hidden">
          <SimpleBar className="category-dropdown-scrollbar h-full">
            <div className="flex flex-col gap-8 pr-3 pb-5">

              {/* Mensagem de Instruções */}
              <div className="flex justify-start items-start gap-3 pt-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black drop-shadow-md">
                  <Wrench color="#B3B3B3" size={21} />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-semibold text-[#E3E3E4] mb-1">Instructions</p>
                  <div className="flex flex-col gap-1 bg-linear-to-r from-[#1B1B1B] to-[#2B2B2B] rounded-xl p-4 max-w-xl drop-shadow-md">
                    <p className="text-justify text-sm text-[#BDBBBE]">Esse personagem você precisa digitar uma frase grande de um tema ou conteudo que você gosta, ele vai pegar esse tema ou conteudo escolhido e vai escrever para você 3 piadas com esse conteudo escolhido</p>
                  </div>
                </div>
              </div>

              {/* Mensagem do Usuário */}
              <div className="flex justify-end items-start gap-3">
                <div className="flex flex-col items-end">
                  <p className="text-sm font-semibold text-[#E3E3E4] mb-1">user</p>
                  <div className="bg-[#35373B] rounded-xl p-3 max-w-md">
                    <p className="text-sm text-[#C1C1C2]">Hello, Goblin?</p>
                  </div>
                </div>
                <img src={Avatar} alt={"user"} className="w-10 h-10 rounded-full" />
              </div>

              {/* Mensagem da Chaplin */}
              <div className="flex justify-start items-start gap-3">
                <img src={persona.imagebase64} alt={persona.name} className="w-10 h-10 rounded-full" />
                <div className="flex flex-col items-start">
                  <p className="text-sm font-semibold text-[#E3E3E4] mb-1">{persona.name}</p>
                  <div className="flex bg-[#35373B] rounded-xl p-3 max-w-md">
                    <p className="font-regular bg-[#4B4D50] rounded-full">
                      speech
                    </p>
                    <p className="text-sm text-[#C1C1C2]">How are you? Time is money friend...</p>
                  </div>
                </div>
              </div>
            </div>
          </SimpleBar>
        </div>

        {/* Área de Input (não cresce) */}
        <div className="flex-shrink-0 flex items-center gap-3 bg-[#37393D] rounded-full border-1 border-[#505050] p-1">
          <input
            type="text"
            placeholder={`Ask ${persona.name}...`}
            className="flex-grow bg-transparent text-[#FAFAFA] focus:outline-none pl-5 text-sm placeholder:text-[#7C7C7C] placeholder:font-medium"
          />
          <button className="bg-white px-3 py-3 rounded-full font-semibold hover:bg-[#E3E3E4] cursor-pointer">
            <SendSolid color="#242424" height={15} width={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TryModal;