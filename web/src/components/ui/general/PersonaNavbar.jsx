import React from "react";

import Avatar from "../../../assets/Avatar.png";
import Persona from "../../../assets/Persona.png";
import FavoriteIcon from "../../../assets/star_icon.svg";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

function PersonaItem({ name, image }) {
  return (
    <div className="flex items-center gap-2">
      <img className="w-8 h-8 rounded-md" src={image} />
      <div className="">{name}</div>
    </div>
  );
}

function YourPersonas() {
  return (
    <div className="flex flex-col gap-3">
      Your Personas
      <div className="">
        <SimpleBar
          style={{ maxHeight: "15rem", minHeight: "15rem" }}
          autoHide={false}
          className="pl-4 pr-6"
          id="scrollbar"
        >
          <div className="flex flex-col gap-3">
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
    </div>
  );
}

function UserAccount() {
  return (
    <div className="flex gap-3 items-center">
      <img className="w-8 h-8 rounded-full" src={Avatar} />
      0xfffffffffffffff
    </div>
  );
}

function PersonaPage() {
  return (
    <div className="flex flex-col gap-3 font-semibold text-[#817676]">
      <div className="flex gap-3 items-center">
        <div className="">All</div>
      </div>
      <div className="flex gap-3 items-center">
        <div className="">Favorites</div>
      </div>
      
    </div>
  );
}

function NavbarHeader() {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xl font-semibold">persona</div>
      <div className="p-1 bg-[#BEBEBE] w-20 flex items-center justify-center rounded-full">
        New
      </div>
    </div>
  );
}

function PersonaNavbar() {
  return (
    <div className="w-[15%] h-full bg-[#D9D9D9] font-inter p-5 flex flex-col justify-between">
      <div className="flex flex-col gap-8">
        <NavbarHeader />
        <PersonaPage />
        <YourPersonas />
      </div>
      <UserAccount />
    </div>
  );
}

export default PersonaNavbar;
