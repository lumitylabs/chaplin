import React from "react";
import { X } from "lucide-react";
import { SendSolid } from 'iconoir-react';
import Avatar from "../../../assets/Avatar.png";

function TryModal({ persona, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#26272B] rounded-2xl w-[700px] p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-md font-semibold text-[#E3E3E4]">{persona.name}</h2>
          <button onClick={onClose} className="cursor-pointer pb-5">
            <X color="#BFBCBC" size={22} />
          </button>
        </div>
        <div className="w-full gap-0 border-t-1 border-[#303135] mt-1 mb-6"></div>

        {/* Chat Area */}
        <div className="flex flex-col gap-6 h-80 overflow-y-auto pr-2"> {/* Aumentado o gap para separar melhor as mensagens */}

          {/* Persona Message */}
          <div className="flex justify-start items-start gap-3">
            <img src={persona.image} alt={persona.name} className="w-10 h-10 rounded-full" />
            <div className="flex flex-col items-start">
              <p className="text-sm font-semibold text-[#E3E3E4] mb-1">{persona.name}</p>
              <div className="bg-[#35373B] rounded-xl p-3 max-w-md">
                <p className="text-sm text-[#C1C1C2]">How are you? Time is money friend...</p>
              </div>
            </div>
          </div>

          {/* User Message */}
          <div className="flex justify-end items-start gap-3">
            <div className="flex flex-col items-end">
              <p className="text-sm font-semibold text-[#E3E3E4] mb-1">user</p>
              <div className="bg-[#35373B] rounded-xl p-3 max-w-md">
                <p className="text-sm text-[#C1C1C2]">Hello, Goblin?</p>
              </div>
            </div>
            <img src={Avatar} alt={"user"} className="w-10 h-10 rounded-full" />
          </div>

        </div>

        {/* Input Area */}
        <div className="flex items-center gap-3 mt-4 p-1 bg-[#37393D] rounded-full border-1 border-[#505050]">
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