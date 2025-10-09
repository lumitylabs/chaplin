import React from "react";

import Avatar from "../../../assets/Avatar.png";
import Persona from "../../../assets/Persona.png";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Plus } from 'iconoir-react';
import { CandyCane, Star, ChevronDown } from 'lucide-react';
import hatIcon from "../../../assets/hatIcon.svg";

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
      <SimpleBar
        className="flex"
        style={{ maxHeight: "32.5rem", minHeight: "15rem" }}
        autoHide={false}
        id="scrollbar"
      >
        <div className="flex max-h-full flex-col gap-3">
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />
          <PersonaItem name="Orc" image={Persona} />

        </div>
      </SimpleBar>

    </div>
  );
}

function UserAccount() {
  return (
    <div className="px-5 mt-4 mb-4">
      <div className="flex items-center border-t-1 border-[#26272B]">
        <button className="flex mt-3 px-2 py-1.5 w-full items-center gap-3 hover:bg-[#3F3F46] rounded-lg cursor-pointer">
          <img className="w-10 h-10 rounded-full shadow-xl" src={Avatar} />
          <div className="flex w-full items-center px-1 justify-between">
            <span className="font-inter text-[#F4F1F4] font-light text-[0.78em]">1A1zP1e...22e</span>
            <ChevronDown size={16} color="#A2A2AB" />
          </div>
        </button>
      </div>
    </div>
  );
}

function PersonaPage() {
  return (
    <div className="flex flex-col gap-2 font-semibold text-[#817676] px-5">
      <button className="flex items-center gap-3 p-3.5 bg-[#26272B] rounded-lg text-white text-[0.84em] cursor-pointer">
        <img className="w-5" src={hatIcon} alt="All Chaplins" />
        {/* <CandyCane fill="white" color="white" size={20}></CandyCane> */}
        All
      </button>
      <button className="flex items-center gap-3 p-3.5 text-[0.84em] text-white hover:bg-[#1F1F22] rounded-lg cursor-pointer">
        <Star fill="white" color="white" size={20} />
        Favorites
      </button>
    </div>
  );
}

function NavbarHeader() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-0 pb-0 mt-5">
      <div className="font-mali font-medium text-2xl text-white tracking-[-0.04em]">Chaplin</div>
      <button className="flex p-1.5 px-3 gap-1 bg-[#202024] w-32 items-center rounded-full text-[#FAFAFA] text-[0.84em] border-[1px] border-[#26272B] cursor-pointer hover:bg-[#3B3B41]">
        <Plus color="#94949C" height={36} width={36} />
        Create
      </button>
    </div>
  );
}

function PersonaNavbar() {
  return (
    <div className="fixed left-0 top-0 h-screen w-[15%] bg-[#131316] border-r-[1px] border-[#26272B] font-inter flex flex-col justify-between">

      <div className="flex flex-col gap-8 h-full">
        <div className="flex flex-col gap-5">
          <NavbarHeader />
          <PersonaPage />
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
