

import React, { useRef, useState } from "react";
import PersonaNavbar from "../components/ui/general/PersonaNavbar";
import InputBox from "../components/ui/general/InputBox";
import BackIcon from "../assets/back_icon.svg";
import EditIcon from "../assets/edit_icon.svg";
import GenerateWandIcon from "../assets/generate_wand_icon.svg";
import Persona from "../assets/persona.png";
import PublicIcon from "../assets/public_icon.svg";
import LockOpenIcon from "../assets/open_lock_icon.svg";
// import LockClosedIcon from "../assets/closed_lock_icon.svg";
import OutputIcon from "../assets/output_icon.svg";
import PlayIcon from "../assets/play_icon.svg";
import ResponseIcon from "../assets/reponse_icon.svg";
import CloseIcon from "../assets/close_icon.svg";
import ExpandBox from "../components/ui/general/ExpandBox";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  return (
    <div className="cursor-pointer" onClick={()=>navigate("/home")}>
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


function ProjectDescription({ description, onOpenModal }) { 
  return (
    <div className="flex flex-col gap-3 mt-20">
      <div className="flex items-center gap-2">
        Persona Description
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#D9D9D9]"></div>
          <div className="h-0.5 w-50 bg-[#585858]"></div>
        </div>
      </div>
      <ExpandBox
        size={"15rem"}
        value={description} 
        placeholder="Persona description..."
        onOpenModal={onOpenModal}
      />
    </div>
  );
}

function Specialist({ number, name, prompt, onOpenModal }) {
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
          <ExpandBox
            size={"18rem"}
            value={prompt} 
            placeholder="Specialist prompt..."
            onOpenModal={onOpenModal}
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

function WorkGroup({ workgroupData, onOpenSpecialistModal }) { 
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

          {workgroupData.map((specialist, index) => (
            <Specialist
              key={specialist.id}
              number={index + 1}
              name={specialist.name}
              prompt={specialist.prompt}
              onOpenModal={() => onOpenSpecialistModal(index)} // Pass the index
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Output({ input, output, onOpenModal }) {
  return (
    <div className="flex items-baseline">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-[#D9D9D9]"></div>
        <div className="h-0.5 w-20 bg-[#585858]"></div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="text-[#989898] font-semibold text-md">Input</div>
        <ExpandBox
          size={"18rem"}
          value={input} 
          placeholder="Input prompt..."
          onOpenModal={onOpenModal}
          hasButton={true}
          buttonName={"Run"}
          maxLength={200}
        />
        <div className="text-[#989898] font-semibold text-md">Output</div>
        <div
          className="flex flex-col gap-1 text-sm text-[#B0B0B0] border border-[#666] rounded-md px-3 py-2 h-30"
          style={{ width: "18rem" }}
        >
          {output}
        </div>
      </div>
    </div>
  );
}

function CreateWorkGroup({ formData, onOpenModal }) { 
  return (
    <div className="flex">

      <ProjectDescription
        description={formData.personaDescription}
        onOpenModal={() => onOpenModal({ type: "description" })}
      />
      <WorkGroup
        workgroupData={formData.workgroup}
        onOpenSpecialistModal={(index) => onOpenModal({ type: "specialist", index })}
      />
      <Output
        input={formData.io.input}
        output={formData.io.output}
        onOpenModal={() => onOpenModal({ type: "io_input" })}
      />
    </div>
  );
}



function Modal({ initialText, onSave, onClose }) {
  const modalRef = useRef(null);
  const [currentText, setCurrentText] = useState(initialText);

  const handleAttemptClose = () => {
    const hasUnsavedChanges = initialText !== currentText;

    if (hasUnsavedChanges) {
      const userConfirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (userConfirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  function handleClickOutside(e) {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleAttemptClose();
    }
  }

  function handleSave() {
    onSave(currentText);
    onClose();
  }

  return (
    <div
      className="bg-black/30 w-screen h-screen fixed z-10 top-0 left-0 backdrop-blur-sm flex items-center justify-center"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="w-250 h-150 bg-[#2D2D2D] rounded-4xl border border-[#6C6C6C] p-10 flex flex-col"
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <div>
              <img src={ResponseIcon} alt="" />
            </div>
            <div className="flex items-baseline flex-col">
              <div className="text-sm font-semibold text-white">
                Edit Content
              </div>
              <div className="text-sm text-[#747474]">
                Modify the content below and click save.
              </div>
            </div>
          </div>
          <div className="cursor-pointer" onClick={handleAttemptClose}>
            <img src={CloseIcon} alt="" />
          </div>
        </div>

        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          className="mt-5 w-full flex-grow bg-[#363636] rounded-2xl p-5 text-white text-sm outline-none resize-none"
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            className="bg-[#E0E0E0] text-black font-semibold py-2 px-6 rounded-lg hover:bg-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}




function Create() {



  const [formData, setFormData] = useState({
    name: "",
    category: "",
    tag: "",
    personaDescription: "",
    workgroup: [
      { id: 1, name: "Orc", prompt: "An Orc chieftain who is angry." },
      { id: 2, name: "Elf", prompt: "A wise Elf loremaster." },
    ],
    io: {
      input: "",
      output: "Waiting for input...",
    },
  });

  const [showModal, setShowModal] = useState(false);

  const [editingField, setEditingField] = useState(null);

  function handleOpenModal(fieldIdentifier) {
    setEditingField(fieldIdentifier);
    setShowModal(true);
  }
  

  function handleCloseModal() {
    setShowModal(false);
    setEditingField(null); 
  }


  function handleSaveModal(newText) {
    if (!editingField) return;

    const { type, index } = editingField;

    setFormData((prevData) => {
        const newData = { ...prevData };
        if(type === 'description') {
            newData.personaDescription = newText;
        } else if (type === 'specialist') {
            const newWorkgroup = [...newData.workgroup];
            newWorkgroup[index] = { ...newWorkgroup[index], prompt: newText };
            newData.workgroup = newWorkgroup;
        } else if (type === 'io_input') {
            newData.io = { ...newData.io, input: newText };
        }
        return newData;
    });
  }


  function getInitialTextForModal() {
    if (!editingField) return "";

    const { type, index } = editingField;
    if(type === 'description') {
        return formData.personaDescription;
    } else if (type === 'specialist') {
        return formData.workgroup[index]?.prompt || "";
    } else if (type === 'io_input') {
        return formData.io.input;
    }
    return "";
  }


  return (
    <>
      <div className="bg-[#4A4A4A] min-h-screen font-inter ">

        {showModal && (
          <Modal
            onClose={handleCloseModal}
            onSave={handleSaveModal}
            initialText={getInitialTextForModal()}
          />
        )}
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

            <CreateWorkGroup
              formData={formData}
              onOpenModal={handleOpenModal}
            />
          </div>
        </div>
      </div>
    </>
  );
}


export default Create;