import React, { useState } from "react";
import PersonaNavbar from "../components/ui/general/PersonaNavbar";
import InputBox from "../components/ui/general/InputBox";
import InputBoxClean from "../components/ui/general/InputBoxClean";

import BackIcon from "../assets/back_icon.svg";
import EditIcon from "../assets/edit_icon.svg";
import GenerateWandIcon from "../assets/generate_wand_icon.svg";
import Persona from "../assets/persona.png";
import PublicIcon from "../assets/public_icon.svg";
import LockOpenIcon from "../assets/open_lock_icon.svg";
import LockClosedIcon from "../assets/closed_lock_icon.svg";
import OutputIcon from "../assets/output_icon.svg";
import PlayIcon from "../assets/play_icon.svg";

function BasicForm({ formData, setFormData }) {
  return (
    <div className="flex flex-col gap-3 ">
      Visibility
      <div className="flex gap-2 border w-25 items-center justify-center p-2 rounded-xl cursor-not-allowed">
        <img src={PublicIcon} alt="" />
        Public
      </div>
      <InputBox
        label={"Persona Name"}
        size="15rem"
        formData={formData}
        setFormData={setFormData}
        field="name"
      />
      <InputBox
        label={"Category"}
        size="15rem"
        formData={formData}
        setFormData={setFormData}
        field="category"
      />
      <InputBox
        label={"Tag"}
        size="15rem"
        formData={formData}
        setFormData={setFormData}
        field="tag"
      />
    </div>
  );
}

function PersonaImage() {
  return (
    <div className="relative w-30 h-30">
      <img src={Persona} alt="" className="w-30 h-30 rounded-2xl" />
      <div className="bg-[#747171] rounded-full absolute p-2 bottom-0 right-0 cursor-pointer -m-1">
        <img src={EditIcon} alt="" />
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <div className="">
      <img src={BackIcon} alt="" />
    </div>
  );
}

function SaveButton() {
  return (
    <div className="p-2 bg-[#D9D9D9] h-6 w-20 flex items-center justify-center rounded-xl cursor-pointer text-[#989898]">
      Save
    </div>
  );
}

function ProjectDescription({ formData, setFormData }) {
  return (
    <div className="flex flex-col gap-3 mt-20">
      <div className="flex items-center gap-2">
        Persona Description
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#D9D9D9]"></div>
          <div className="h-0.5 w-50 bg-[#585858]"></div>
        </div>
      </div>
      <InputBoxClean
        size={"15rem"}
        formData={formData}
        setFormData={setFormData}
        field="personaDescription"
      />
    </div>
  );
}

function Specialist({ number, name, prompt }) {
  const [formData, setFormData] = useState({
    prompt: prompt,
  });

  return (
    <div className="w-80 h-50 border border-[#585858] rounded-xl font-inter text-sm flex flex-col justify-between">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex justify-between">
          <div className="flex flex-row gap-2">
            <div className="text-[#6E6E6E]">{number}</div>
            <div className="font-semibold">{name}</div>
          </div>
          <div className="flex gap-2">
            <img src={LockOpenIcon} alt="" className="w-4 h-4" />
            <img src={PlayIcon} alt="" className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[#989898]">Prompt</div>
          <InputBoxClean
            size={"18rem"}
            formData={formData}
            setFormData={setFormData}
            field="prompt"
          />
        </div>
      </div>
      <div className="w-full h-10 bg-[#555555] rounded-b-xl flex items-center justify-end gap-3 px-4">
        Reponse
        <img src={OutputIcon} alt="" />
      </div>
    </div>
  );
}

function WorkGroup() {
  return (
    <div className="">
      <div className="min-h-80 w-100 border border-[#585858] rounded-xl">
        {/** header */}
        <div className="flex items-center justify-between p-5">
          <div className="">Workgroup</div>
          <div className="flex gap-2 p-1 px-2 bg-[#D9D9D9] w-30 text-sm text-[#989898] rounded-full cursor-pointer">
            <img src={GenerateWandIcon} alt="" />
            AI Generate
          </div>
        </div>
        {/** body */}
        <div className="flex flex-col items-center justify-center gap-10 mb-10">
          <Specialist number={1} name={"Orc"} prompt={"Orc putasso"} />
          <Specialist number={1} name={"Orc"} prompt={"Orc putasso"} />
        </div>
      </div>
    </div>
  );
}

function Output() {
  const [formData, setFormData] = useState({
    prompt: prompt,
  });

  return (
    <div className="flex items-baseline">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-[#D9D9D9]"></div>
        <div className="h-0.5 w-20 bg-[#585858]"></div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="text-[#989898] font-semibold text-md">Output</div>
        <InputBoxClean
          size={"18rem"}
          formData={formData}
          setFormData={setFormData}
          field="prompt"
          hasButton={true}
          buttonName={"Run"}
          maxLength={200}
        />
        <div
          className="flex flex-col gap-1 text-sm text-[#B0B0B0] border border-[#666] rounded-md px-3 py-2 h-30"
          style={{ width: "18rem" }}
        >
            Waiting prompt...
        </div>
      </div>
    </div>
  );
}

function CreateWorkGroup({ formData, setFormData }) {
  return (
    <div className="flex">
      <ProjectDescription formData={formData} setFormData={setFormData} />
      <WorkGroup />
      <Output />
    </div>
  );
}

function Create() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    tag: "",
  });

  return (
    <>
<div className="bg-[#4A4A4A] min-h-screen font-inter ">
        <div className="flex h-full w-full">
          <PersonaNavbar />
         <div className="ml-[15%] w-[75%] p-12 flex flex-col gap-5 text-[#D0D0D0] ">
            <BackButton></BackButton>
            <div className="flex flex-row justify-between">
              <div className="flex gap-20 ">
                <BasicForm formData={formData} setFormData={setFormData} />
                <PersonaImage />
              </div>
              <SaveButton />
            </div>
            <CreateWorkGroup />
          </div>
        </div>
      </div>
    </>
  );
}

export default Create;
