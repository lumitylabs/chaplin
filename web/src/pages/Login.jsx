import React from "react";
import { useState } from "react";

import LoginBg from "../assets/login_bg.png";
import Icon1 from "../assets/login_app_icon_1.svg";
import Icon2 from "../assets/login_app_icon_2.svg";
import Icon3 from "../assets/login_app_icon_3.svg";
import Icon4 from "../assets/login_app_icon_4.svg";
import Icon5 from "../assets/login_app_icon_5.svg";
import Icon6 from "../assets/login_app_icon_6.svg";
import Icon7 from "../assets/login_app_icon_7.svg";
import MetaMaskIcon from "../assets/metamask_icon.png";
import Navbar from "../components/ui/general/Navbar";

function IconButton({ icon }) {
  return (
    <div className="p-2 bg-[#363639] rounded-xl">
      <img src={icon} />
    </div>
  );
}

function IconGrid() {
  return (
    <div className="flex gap-2">
      <IconButton icon={Icon1} />
      <IconButton icon={Icon2} />
      <IconButton icon={Icon3} />
      <IconButton icon={Icon4} />
      <IconButton icon={Icon5} />
      <IconButton icon={Icon6} />
      <IconButton icon={Icon7} />
    </div>
  );
}

function LoginModal() {
  return (
    <div className="w-[420px] h-[420px] bg-[#26272B] text-white p-10 flex flex-col items-center justify-between rounded-2xl">
      <div className=" flex flex-col items-center gap-5">
        <div className="flex flex-col items-center font-extrabold text-3xl">
          <p>Get access to create</p>
          <p>and use your personas</p>
        </div>
        <div className="flex flex-col items-center text-sm">
          <p>Perfeito para jogos, projetos,</p>
          <p>assistentes e tarefas desafiadoras</p>
        </div>
        <IconGrid />
      </div>
      Sign In
      <button className="w-full h-10 text-black bg-[#D9D9D9] rounded-lg font-semibold hover:bg-[#e4e0e0] flex items-center  justify-center gap-5">
        <img src={MetaMaskIcon} />
        Continue with MetaMask
      </button>
    </div>
  );
}

function ImageBg() {
  return (
    <div className="w-[1000px] h-[600px]">
      <img src={LoginBg} />
    </div>
  );
}

function Login() {
  return (
    <>
      <div className="w-screen h-screen bg-[#18181B] font-inter">
        <Navbar/>
        <div className="flex flex-row items-center justify-center gap-10 pt-20">
          <LoginModal />
          <ImageBg />
        </div>
      </div>
    </>
  );
}

export default Login;
