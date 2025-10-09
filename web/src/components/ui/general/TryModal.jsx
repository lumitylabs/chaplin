import React from "react";
import CloseIcon from "../../../assets/close_icon.svg";

function TryModal({ persona, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#EFEFEF] rounded-2xl w-[700px] p-6 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#333]">{persona.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <img src={CloseIcon} alt="" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col gap-4 h-80 overflow-y-auto pr-2">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="bg-white rounded-lg p-3 max-w-md">
              <p className="text-sm text-gray-800">Hello, Goblin?</p>
            </div>
          </div>

          {/* Persona Message */}
          <div className="flex justify-start items-end gap-3">
            <img src={persona.image} alt={persona.name} className="w-10 h-10 rounded-full" />
            <div className="bg-white rounded-lg p-3 max-w-md">
              <p className="text-sm text-gray-800">How are you? Time is money friend...</p>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-300">
          <input
            type="text"
            placeholder={`Pergunte para o ${persona.name}...`}
            className="flex-grow bg-transparent focus:outline-none text-gray-700"
          />
          <button className="bg-[#4A4A4A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default TryModal;