import React from "react";
import { Wrench, X } from "lucide-react";
import { SendSolid } from 'iconoir-react';
import Avatar from "../../../assets/Avatar.png"; // Certifique-se que o caminho para o Avatar está correto
import SimpleBar from "simplebar-react";
import 'simplebar-react/dist/simplebar.min.css';

function TryModal({ persona, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#26272B] rounded-2xl w-[750px] h-[500px] p-6 flex flex-col"
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
                <div className="flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-linear-to-r from-[#0A0A0A] to-[#2B2B2B] drop-shadow-lg">
                  <Wrench color="#B3B3B3" size={21} />
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-sm font-semibold text-[#E3E3E4] mb-1">Instructions</p>
                  <div className="flex flex-col gap-1 bg-linear-to-r from-[#1B1B1B] to-[#2B2B2B] rounded-xl p-4 max-w-xl drop-shadow-lg">
                    <p className="text-justify text-sm text-[#BDBBBE]">Esse personagem você precisa digitar uma frase grande de um tema ou conteudo que você gosta, ele vai pegar esse tema ou conteudo escolhido e vai escrever para você 3 piadas com esse conteudo escolhido</p>
                  </div>
                </div>
              </div>

              {/* Mensagem do Usuário */}
              <div className="flex justify-end items-start gap-3">
                <div className="flex flex-col items-end">
                  <p className="text-sm font-semibold text-[#E3E3E4] mb-1">user</p>
                  <div className="bg-[#35373B] rounded-xl p-3 max-w-md">
                    <p className="text-sm text-[#C1C1C2]">Hello?</p>
                  </div>
                </div>
                <img src={Avatar} alt={"user"} className="w-10 h-10 rounded-full" />
              </div>

              {/* Mensagem da Chaplin */}
              <div className="flex justify-start items-start gap-3">
                <img src={persona.imagebase64} alt={persona.name} className="w-10 h-10 rounded-full" />
                <div className="flex flex-col items-start w-full">
                  <p className="text-sm font-semibold text-[#E3E3E4] mb-1">{persona.name}</p>
                  <div className="table w-full max-w-lg rounded-xl overflow-hidden">
                    {/* Linha 1: Dialogue */}
                    <div className="table-row bg-[#1B1B1B]">
                      <div className="table-cell p-3 w-0 whitespace-nowrap align-middle">
                        <p className="font-mono text-center text-xs px-2 py-1 bg-[#363636] rounded-full">
                          dialogue_test
                        </p>
                      </div>
                      <div className="table-cell p-3 pl-4 border-l border-l-[#353535] align-middle">
                        <p className="text-sm text-[#C1C1C2]">
                          How are you? Time is money friend... How are Time is money friend...How are you? Time is money friend... How are Time is money friend...How are you? Time is money friend... How are Time is money friend...How are you? Time is money friend... How are Time is money friend...
                        </p>
                      </div>
                    </div>
                    {/* Linha 2: Action */}
                    <div className="table-row bg-[#2A2A2A]">
                      <div className="table-cell p-3 w-0 whitespace-nowrap align-middle border-t border-t-[#303135]">
                        <p className="font-mono text-center text-xs px-2 py-1 bg-[#363636] rounded-full">
                          action
                        </p>
                      </div>
                      <div className="table-cell p-3 pl-4 border-l border-l-[#353535] align-middle border-t border-t-[#303135]">
                        <p className="text-sm text-[#C1C1C2]">
                          Walk (10,10)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SimpleBar>
        </div>

        {/* --- ÁREA DE INPUT CORRIGIDA --- */}
        <div className="flex-shrink-0 mt-4">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={`Ask ${persona.name}...`}
              className="w-full bg-[#37393D] text-[#FAFAFA] text-sm placeholder:text-[#7C7C7C] placeholder:font-medium placeholder:tracking-tight rounded-full py-3 pl-5 pr-14 border border-[#505050] focus:outline-none focus:ring focus:ring-[#C7C7C7] transition-all duration-200"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white p-2.5 rounded-full font-semibold hover:bg-[#E3E3E4] cursor-pointer">
              <SendSolid color="#242424" height={15} width={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TryModal;