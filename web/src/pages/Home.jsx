import React from "react";
import PersonaNavbar from "../components/ui/general/PersonaNavbar";

import SearchIcon from "../assets/search_icon.svg";
import FavoriteIcon from "../assets/star_icon.svg";
import Persona from "../assets/Persona.png";

function TopBar() {
  return (
    <div className="flex justify-between items-center">
      <div className="text-xl text-[#D0D0D0] font-semibold">Personas</div>
      <div className="flex items-center gap-2 px-2 p-1 rounded-full bg-[#D9D9D9]">
        <img src={SearchIcon} />
        <div className="w-30 font-semibold text-[#989898] text-sm">Search</div>
      </div>
    </div>
  );
}

function FilterTag({ name }) {
  return (
    <div className="p-2 px-4 rounded-xl bg-[#A3A3A3] text-[#E6E5E5] flex items-center justify-center">
      {name}
    </div>
  );
}

function FilterBar() {
  return (
    <div className="flex gap-2">
      <FilterTag name="Assistantes" />
      <FilterTag name="Assistantes" />
      <FilterTag name="Assistantes" />
      <FilterTag name="Assistantes" />
      <FilterTag name="Assistantes" />
      <FilterTag name="Assistantes" />
    </div>
  );
}

function PersonaCard({ name, image, desc, api }) {
  return (
    <div className="flex gap-3 h-40 w-84 bg-[#D9D9D9] rounded-2xl justify-center items-center p-4 relative">
      <div className="absolute top-0 right-0">
        <img src={FavoriteIcon} className="w-4 h-4 mr-2 mt-2 cursor-pointer" />
      </div>

      <img src={image} className="w-auto h-full rounded-2xl" />
      <div className="flex flex-col gap-1 h-full">
        <div className="font-semibold text-[#989898]">{name}</div>
        <div className="text-sm text-[#989898] mb-2 line-clamp-2 w-40 h-60">{desc}</div>
        <div className="bg-[#4A4343] w-auto rounded-full flex items-center justify-center text-[#989898] cursor-pointer">
          {api}
        </div>
        <div className="bg-[#CECECE] w-auto rounded-full flex items-center justify-center text-[#989898] cursor-pointer">
          TRY
        </div>
      </div>
    </div>
  );
}

function PersonaList() {
  return (
    <div className="mt-5 flex flex-wrap gap-10">
      <PersonaCard
        name={"ORC"}
        image={Persona}
        desc={"orc putasso, mas que tem um coração muito grande"}
        api={"API"}
      />
      <PersonaCard
        name={"ORC"}
        image={Persona}
        desc={"orc putasso, mas que tem um coração muito grande"}
        api={"API"}
      />
      <PersonaCard
        name={"ORC"}
        image={Persona}
        desc={"orc putasso, mas que tem um coração muito grande"}
        api={"API"}
      />
      <PersonaCard
        name={"ORC"}
        image={Persona}
        desc={"orc putasso, mas que tem um coração muito grande"}
        api={"API"}
      />
    </div>
  );
}

function Home() {
  return (
    <>
      <div className="bg-[#4A4A4A] w-screen h-screen font-inter">
        <div className="flex h-full w-full">
          <PersonaNavbar />
          <div className="flex flex-col gap-3 p-6 w-full">
            <TopBar />
            <FilterBar />
            <PersonaList />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
