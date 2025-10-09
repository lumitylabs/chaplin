import React from "react";

function Navbar() {
  return (
    <div className="flex items-center justify-between p-5 lg:px-10">
      <div className="font-mali text-white text-3xl tracking-[-0.04em] font-medium">Chaplin</div>
      <div className="flex gap-3">
        {/* 
          Botão "Discord" (Secundário)
          - A cor de hover foi alterada para bg-neutral-700 (#404040)
          - Isso cria um contraste claro com a borda (#303136)
        */}
        <button className="flex w-25 py-2 px-5 border-[#303136] border rounded-full text-white text-[0.92em] justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-[#1F1F23]">
          Discord
        </button>

        {/* 
          Botão "Docs" (Primário)
          - A cor de hover foi alterada para bg-gray-200 para corresponder
            exatamente ao botão "Continue with MetaMask".
        */}
        <button className="flex w-25 py-2 px-5 bg-white text-black text-[0.92em] rounded-full justify-center items-center cursor-pointer transition-colors duration-200 hover:bg-[#E3E3E4]">
          Docs
        </button>
      </div>
    </div>
  );
}

export default Navbar;