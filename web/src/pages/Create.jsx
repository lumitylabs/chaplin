// src/pages/Create.jsx

import React, { useRef, useState, useEffect } from "react";
import { Menu, Scan, WandSparkles, ChevronDown, Plus, Trash2, PenLine, Play, Loader2 } from "lucide-react";
// Componentes e Assets existentes
import PersonaNavbar from "../components/ui/general/PersonaNavbar";
import Persona from "../assets/persona.png";
import PublicIcon from "../assets/public_icon.svg";
import LockOpenIcon from "../assets/open_lock_icon.svg";
import OutputIcon from "../assets/output_icon.svg";
import PlayIcon from "../assets/play_icon.svg";
import ResponseIcon from "../assets/reponse_icon.svg";
import CloseIcon from "../assets/close_icon.svg";
import ExpandBox from "../components/ui/general/ExpandBox";
import { generateWorkgroup, generateImage, runAgent } from "../services/apiService";
import SpecialistSkeleton from "../components/ui/create/SpecialistSkeleton";

/* ------------------ constantes ------------------ */
const NAME_MAX = 25;
const INSTR_MAX = 200;
const STEP2_KEY_MAX = 15;
const STEP2_DESC_MAX = 100;
const MAX_STEP2_GROUPS = 5;
const CATEGORY_OPTIONS = [
  "Assistant", "Anime", "Creativity & Writing", "Entertainment & Gaming",
  "History", "Humor", "Learning",
];

/* ------------------ Subcomponentes ------------------ */
function Specialist({
  number,
  name,
  prompt,
  response,
  isRunning,
  onRun,
  onOpenModal,
  onOpenResponseModal
}) {
  const hasResponse = !!response;

  return (
    <div className="w-full border border-[#3A3A3A] rounded-xl font-inter text-sm flex flex-col justify-between">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex justify-between">
          <div className="flex flex-row gap-2">
            <div className="text-[#6E6E6E]">{number}</div>
            <div className="font-semibold">{name}</div>
          </div>
          <div className="flex gap-2 items-center">
            <img src={LockOpenIcon} alt="Public" className="w-4 h-4" />
            <button onClick={onRun} disabled={isRunning} className="disabled:cursor-not-allowed p-1">
              {isRunning ? (
                <Loader2 size={16} className="animate-spin text-gray-400" />
              ) : (
                <img src={PlayIcon} alt="Run Agent" className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[#989898] text-sm">Prompt</div>
          <ExpandBox
            size={"100%"}
            value={prompt}
            placeholder="Specialist prompt..."
            onOpenModal={onOpenModal}
          />
        </div>
      </div>

      <button
        onClick={hasResponse ? onOpenResponseModal : undefined}
        disabled={!hasResponse}
        className={`w-full h-10 rounded-b-xl flex items-center justify-end gap-3 px-4 transition-colors ${hasResponse
          ? "bg-white text-black font-semibold cursor-pointer hover:bg-gray-200"
          : "bg-[#2B2B2B] text-[#B0B0B0] cursor-default"
          }`}
      >
        Response
        <img src={OutputIcon} alt="Output" />
      </button>
    </div>
  );
}

function WorkGroup({
  workgroupData,
  workgroupResponses,
  runningAgentIndex,
  onRunAgent,
  onOpenSpecialistModal,
  onOpenResponseModal,
  isGenerating,
}) {
  return (
    <div>
      <div className="flex flex-col gap-6">
        {isGenerating ? (
          <><SpecialistSkeleton /><SpecialistSkeleton /><SpecialistSkeleton /></>
        ) : workgroupData && workgroupData.length > 0 ? (
          workgroupData.map((specialist, index) => (
            <Specialist
              key={index}
              number={index + 1}
              name={specialist.name}
              prompt={specialist.prompt}
              response={workgroupResponses[specialist.name]}
              isRunning={runningAgentIndex === index}
              onRun={() => onRunAgent(index, specialist.name)}
              onOpenModal={() => onOpenSpecialistModal(index)}
              onOpenResponseModal={() => onOpenResponseModal(index)}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-10">
            <p>Your AI specialists will appear here.</p>
            <p className="mt-1">Click "AI Generate" to create them.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Modal({ initialText, onSave, onClose, title = "Edit Content", subtitle, readOnly = false }) {
  const modalRef = useRef(null);
  const [currentText, setCurrentText] = useState(initialText);

  useEffect(() => { setCurrentText(initialText ?? ""); }, [initialText]);

  const handleAttemptClose = () => {
    if (!readOnly && initialText !== currentText) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) onClose();
    } else {
      onClose();
    }
  };

  function handleClickOutside(e) {
    if (modalRef.current && !modalRef.current.contains(e.target)) handleAttemptClose();
  }

  function handleSave() {
    onSave(currentText);
    onClose();
  }

  return (
    <div className="bg-black/30 w-screen h-screen fixed z-40 top-0 left-0 backdrop-blur-sm flex items-center justify-center" onClick={handleClickOutside}>
      <div ref={modalRef} className="w-[45rem] max-h-[80vh] bg-[#2D2D2D] rounded-3xl border border-[#6C6C6C] p-8 flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-start">
            <img src={ResponseIcon} alt="" />
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-white">{title}</div>
              {subtitle && <div className="text-sm text-[#747474]">{subtitle}</div>}
            </div>
          </div>
          <div className="cursor-pointer" onClick={handleAttemptClose}><img src={CloseIcon} alt="" /></div>
        </div>
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          readOnly={readOnly}
          className={`mt-5 w-full flex-grow bg-[#363636] rounded-2xl p-5 text-white text-sm outline-none resize-none ${readOnly ? 'cursor-default' : ''}`}
        />

        {!readOnly && (
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} className="bg-[#E0E0E0] text-black font-semibold py-2 px-6 rounded-lg hover:bg-white transition-colors">Save</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------ Componente Principal Create ------------------ */
function Create() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    instructions: "",
    personaDescription: "",
    avatarUrl: Persona,
    step2: { groups: [{ key: "", description: "" }] },
    workgroup: [],
    io: { input: "", output: "Waiting for input..." },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [runningAgentIndex, setRunningAgentIndex] = useState(null);
  const [workgroupResponses, setWorkgroupResponses] = useState({});
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarButtonRef = useRef(null);
  const avatarMenuRef = useRef(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);
  const categoryMenuRef = useRef(null);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setIsNavbarOpen(isDesktop);
  }, []);

  useEffect(() => {
    function handleDocClick(e) {
      if (isAvatarMenuOpen && avatarMenuRef.current && !avatarMenuRef.current.contains(e.target) && avatarButtonRef.current && !avatarButtonRef.current.contains(e.target)) {
        setIsAvatarMenuOpen(false);
      }
      if (isCategoryOpen && categoryMenuRef.current && !categoryMenuRef.current.contains(e.target) && categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    }
    window.addEventListener("pointerdown", handleDocClick);
    return () => window.removeEventListener("pointerdown", handleDocClick);
  }, [isAvatarMenuOpen, isCategoryOpen]);

  /* ---------- API / ações ---------- */
  const handleGenerateWorkgroup = async () => {
    if (!formData.name || !formData.category || !formData.personaDescription) {
      alert("Please fill in Name, Category, and Description before generating.");
      return;
    }
    setIsGenerating(true);
    setApiError(null);
    const result = await generateWorkgroup({
      name: formData.name,
      category: formData.category,
      description: formData.personaDescription,
    });
    if (result.error) {
      console.error(result.error);
      setApiError(`Failed to generate: ${result.error}`);
      setFormData((prev) => ({ ...prev, workgroup: [] }));
    } else {
      setFormData((prev) => ({ ...prev, workgroup: result.data }));
      setWorkgroupResponses({});
    }
    setIsGenerating(false);
  };

  // LÓGICA REIMPLEMENTADA
  const handleGenerateImage = async () => {
    if (!formData.name || !formData.category || !formData.personaDescription) {
      alert("Please fill in Name, Category, and Description to generate an image.");
      return;
    }
    setIsGeneratingAvatar(true);
    setIsAvatarMenuOpen(false);
    setApiError(null);

    const result = await generateImage({
      name: formData.name,
      category: formData.category,
      description: formData.personaDescription,
    });

    if (result.error) {
      console.error(result.error);
      setApiError(`Failed to generate image: ${result.error}`);
    } else {
      setFormData(prev => ({ ...prev, avatarUrl: result.data.base64 }));
    }
    setIsGeneratingAvatar(false);
  };

  // LÓGICA REIMPLEMENTADA
  const handleRunAgent = async (index, agentName) => {
    setRunningAgentIndex(index);
    setApiError(null);

    const newResponses = { ...workgroupResponses };
    delete newResponses[agentName];
    setWorkgroupResponses(newResponses);

    const input = formData.io.input || "Please proceed with your task.";

    const result = await runAgent({
      input,
      workgroup: formData.workgroup,
      workgroupresponse: newResponses,
      targetAgentName: agentName
    });

    if (result.error) {
      console.error(result.error);
      setApiError(`Failed to run agent ${agentName}: ${result.error}`);
    } else {
      setWorkgroupResponses(result.data);
    }

    setRunningAgentIndex(null);
  };

  const handleRunWorkgroup = () => {
    setFormData((prev) => ({ ...prev, io: { ...prev.io, output: "Running workgroup..." } }));
    setTimeout(() => {
      setFormData((prev) => ({ ...prev, io: { ...prev.io, output: "Run complete — results ready." } }));
    }, 1200);
  };

  const handleMobileNavClick = () => {
    if (window.innerWidth < 1024) setIsNavbarOpen(false);
  };

  /* ---------- modal helpers ---------- */
  function handleOpenModal(fieldIdentifier) {
    setEditingField(fieldIdentifier);
    setShowModal(true);
    setIsAvatarMenuOpen(false);
    setIsCategoryOpen(false);
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
      if (type === "description") {
        newData.personaDescription = newText;
      } else if (type === "specialist") {
        const newWorkgroup = [...newData.workgroup];
        newWorkgroup[index] = { ...newWorkgroup[index], prompt: newText };
        newData.workgroup = newWorkgroup;
      } else if (type === "io_input") {
        newData.io = { ...newData.io, input: newText };
      } else if (type === "step2_key") {
        const groups = [...newData.step2.groups];
        groups[index] = { ...groups[index], key: newText.slice(0, STEP2_KEY_MAX) };
        newData.step2.groups = groups;
      } else if (type === "step2_description") {
        const groups = [...newData.step2.groups];
        groups[index] = { ...groups[index], description: newText.slice(0, STEP2_DESC_MAX) };
        newData.step2.groups = groups;
      }
      return newData;
    });
  }

  function getInitialTextForModal() {
    if (!editingField) return "";
    const { type, index } = editingField;
    if (type === "description") return formData.personaDescription;
    if (type === "specialist") return formData.workgroup[index]?.prompt || "";
    if (type === "specialist_response") {
      const agentName = formData.workgroup[index]?.name;
      return workgroupResponses[agentName] || "No response generated yet.";
    }
    if (type === "io_input") return formData.io.input;
    if (type === "step2_key") return formData.step2.groups[index]?.key || "";
    if (type === "step2_description") return formData.step2.groups[index]?.description || "";
    return "";
  }

  function addStep2Group() {
    setFormData((prev) => {
      const groups = [...prev.step2.groups];
      if (groups.length >= MAX_STEP2_GROUPS) return prev;
      groups.push({ key: "", description: "" });
      return { ...prev, step2: { ...prev.step2, groups } };
    });
  }

  function removeStep2Group(i) {
    setFormData((prev) => {
      const groups = prev.step2.groups.filter((_, idx) => idx !== i);
      if (groups.length === 0) {
        groups.push({ key: "", description: "" });
      }
      return { ...prev, step2: { ...prev.step2, groups } };
    });
  }

  function updateStep2Field(i, field, value) {
    setFormData((prev) => {
      const groups = [...prev.step2.groups];
      groups[i] = { ...groups[i], [field]: value };
      return { ...prev, step2: { ...prev.step2, groups } };
    });
  }

  function toggleCategory() {
    setIsCategoryOpen((s) => !s);
    setIsAvatarMenuOpen(false);
  }

  function selectCategory(value) {
    setFormData((prev) => ({ ...prev, category: value }));
    setIsCategoryOpen(false);
  }

  /* ---------- render ---------- */
  return (
    <div className="bg-[#18181B] min-h-screen font-inter text-[#D0D0D0]">
      {showModal && (
        <Modal
          onClose={handleCloseModal}
          onSave={handleSaveModal}
          initialText={getInitialTextForModal()}
          readOnly={editingField?.type === "specialist_response"}
          title={(() => {
            if (!editingField) return "Edit";
            if (editingField.type === "description") return "Edit Persona Description";
            if (editingField.type === "specialist") return "Edit Specialist Prompt";
            if (editingField.type === "specialist_response") return `Response from ${formData.workgroup[editingField.index].name}`;
            if (editingField.type === "io_input") return "Edit Input";
            if (editingField.type === "step2_key") return "Edit Key";
            if (editingField.type === "step2_description") return "Edit Description";
            return "Edit";
          })()}
          subtitle={(() => {
            if (!editingField) return "";
            if (editingField.type === "specialist") return "Modify the specialist prompt and save.";
            if (editingField.type === "specialist_response") return "This is the output generated by the specialist.";
            return "";
          })()}
        />
      )}
      <PersonaNavbar
        isOpen={isNavbarOpen}
        setIsOpen={setIsNavbarOpen}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleMobileNavClick={handleMobileNavClick}
      />

      <button
        onClick={() => setIsNavbarOpen(true)}
        className={`fixed top-5 left-5 z-20 p-2 rounded-full hover:bg-[#1F1F22] transition-all duration-200 cursor-pointer ${isNavbarOpen ? "opacity-0 -translate-x-16" : "opacity-100 translate-x-0"
          }`}
        aria-label="Open Menu"
      >
        <Menu color="#A2A2AB" size={23} />
      </button>

      <main className={`transition-all duration-300 ease-in-out ${isNavbarOpen ? "lg:ml-[260px]" : "lg:ml-0"}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-2xl font-semibold text-white">Create</h1>
            <button className="bg-[#89898A] text-[#18181B] px-5 py-2 rounded-full font-medium cursor-pointer">Publish</button>
          </div>

          {/* ---------- Principal form (Name, Category, Instructions, Visibility) ---------- */}
          <div className="flex flex-col gap-4 max-w-xl">
            {/* NAME */}
            <div>
              <label className="text-sm text-[#FAFAFA]">Name</label>
              <div className="mt-2">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, NAME_MAX) })}
                  placeholder="e.g. Charles Chaplin"
                  className="w-full text-sm bg-transparent border border-[#3A3A3A] text-white rounded-xl px-4 py-4 outline-none focus:ring-1 focus:ring-[#FAFAFA]"
                  maxLength={NAME_MAX}
                />
                <div className="w-full flex justify-end mt-1">
                  <div className="text-xs text-[#8C8C8C]">{formData.name.length}/{NAME_MAX}</div>
                </div>
              </div>
            </div>

            {/* CATEGORY */}
            <div>
              <label className="text-sm text-[#FAFAFA]">Category</label>
              <div className="mt-2 relative pb-3" ref={categoryRef}>
                <button
                  onClick={toggleCategory}
                  className={`w-full flex items-center justify-between bg-transparent border border-[#3A3A3A] rounded-xl text-sm  px-4 py-4  text-left outline-none focus:ring-1 focus:ring-[#FAFAFA] ${formData.category ? "text-white" : "text-[#A3A3A3]"
                    }`}
                  aria-haspopup="listbox"
                  aria-expanded={isCategoryOpen}
                >
                  <span className={`${formData.category ? "" : "text-[#A3A3A3]"}`}>
                    {formData.category || "Select your Chaplin category"}
                  </span>
                  <ChevronDown size={18} className={`${isCategoryOpen ? "rotate-180" : "rotate-0"} transition-transform`} />
                </button>

                {isCategoryOpen && (
                  <ul
                    ref={categoryMenuRef}
                    className="absolute z-50 mt-2 w-full bg-[#1F1F22] border border-[#333] rounded-lg shadow-lg max-h-60 overflow-auto"
                    role="listbox"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <li key={opt}>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-[#2B2B2B] focus:bg-[#2B2B2B] transition"
                          onClick={() => selectCategory(opt)}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* INSTRUCTIONS */}
            <div>
              <label className="text-sm text-[#FAFAFA]">Instructions</label>
              <div className="mt-2">
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value.slice(0, INSTR_MAX) })}
                  placeholder="How to use this Chaplin?"
                  className="w-full bg-transparent border border-[#3A3A3A] text-white text-sm rounded-xl px-4 py-4 outline-none resize-none focus:ring-1 focus:ring-[#FAFAFA]"
                  rows={4}
                  maxLength={INSTR_MAX}
                />
                <div className="w-full flex justify-end mt-1">
                  <div className="text-xs text-[#8C8C8C]">{formData.instructions.length}/{INSTR_MAX}</div>
                </div>
              </div>
            </div>

            {/* VISIBILITY */}
            <div>
              <label className="text-sm text-[#FAFAFA]">Visibility</label>
              <div className="flex items-center gap-2 border border-[#3A3A3A] p-2.5 rounded-lg mt-2 text-sm text-gray-300 w-fit bg-transparent">
                <img src={PublicIcon} alt="" className="w-4 h-4" />
                Public
              </div>
            </div>
          </div>

          {/* Steps area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-14">
            {/* ---------------- Step 1: Input Data ---------------- */}
            <div>
              <div className="mb-3">
                <div className="text-4xl font-semibold text-[#2E2E31]">Step 1</div>
              </div>
              <div className="border border-[#3A3A3A] rounded-xl">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[#FAFAFA] font-medium text-sm py-[5px]">Input Data</div>
                  </div>
                </div>

                <div className="h-px w-full bg-[#3A3A3A]" />

                <div className="p-4">
                  <div className="flex flex-col gap-3 mb-4">
                    <label className="text-xs text-[#A3A3A3]">Chaplin Description</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.personaDescription}
                        onChange={(e) => setFormData({ ...formData, personaDescription: e.target.value.slice(0, INSTR_MAX) })}
                        placeholder="Enter persona description"
                        className="w-full bg-transparent border border-[#3A3A3A] text-white rounded-lg px-4 py-2 pr-10 outline-none focus:ring-0"
                        maxLength={INSTR_MAX}
                      />
                      <button
                        onClick={() => handleOpenModal({ type: "description" })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#2B2B2B] transition-colors cursor-pointer"
                        aria-label="Expand description"
                      >
                        <Scan size={16} color="#A3A3A3" />
                      </button>
                    </div>
                  </div>

                  {/* --- ÁREA DO AVATAR ATUALIZADA --- */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#A3A3A3]">Avatar</label>
                    <div className="relative w-36 h-36">
                      <img src={formData.avatarUrl} alt="persona" className="w-full h-full object-cover rounded-2xl border border-[#3A3A3A]" />

                      {isGeneratingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}

                      <div className="absolute bottom-0 right-0">
                        <button
                          ref={avatarButtonRef}
                          onClick={() => setIsAvatarMenuOpen(prev => !prev)}
                          className="bg-[#202024] p-3 shadow-md rounded-full transition-colors cursor-pointer"
                          aria-label="Avatar options"
                          aria-expanded={isAvatarMenuOpen}
                        >
                          <PenLine size={16} color="#F3F3F3" />
                        </button>
                      </div>

                      {isAvatarMenuOpen && (
                        <div
                          ref={avatarMenuRef}
                          className="absolute bottom-4 left-36.5 z-50 w-51 bg-[#202024] rounded-lg p-1 shadow-lg"
                        >
                          <button
                            onClick={handleGenerateImage}
                            disabled={isGeneratingAvatar}
                            className="flex justify-between items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-[#2E2E31] transition cursor-pointer"
                          >
                            {isGeneratingAvatar ? "Generating..." : "Generate image"}
                            <WandSparkles size={14} color="#D9D3D3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* ---------------- Step 2: Output Format ---------------- */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-4xl font-semibold text-[#2E2E31]">Step 2</div>
              </div>
              <div className="border border-[#3A3A3A] rounded-xl">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[#FAFAFA] font-medium text-sm flex items-center gap-3">
                      <span>Output Format</span>
                    </div>

                    <div>
                      <button
                        onClick={addStep2Group}
                        className="p-2 rounded-full hover:bg-[#2B2B2B] transition cursor-pointer"
                        aria-label="Add key/description"
                        title="Add key/description"
                        disabled={formData.step2.groups.length >= MAX_STEP2_GROUPS}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-[#3A3A3A]" />

                <div className="p-4">
                  <div className="flex flex-col gap-4">
                    {formData.step2.groups.map((grp, idx) => (
                      <div key={idx} className="border border-[#3A3A3A] rounded-xl p-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[#8E8E8E] text-sm font-medium">Output {idx + 1}</span>
                          {formData.step2.groups.length > 1 && (
                            <button
                              onClick={() => removeStep2Group(idx)}
                              className="p-1 rounded-full hover:bg-[#2B2B2B] transition"
                              aria-label={`Remove group ${idx + 1}`}
                            >
                              <Trash2 size={16} color="#A3A3A3" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col items-start gap-4">
                          <div className="w-full">
                            <label className="text-xs text-[#A3A3A3]">key</label>
                            <div className="relative mt-1">
                              <input
                                type="text"
                                value={grp.key}
                                onChange={(e) => updateStep2Field(idx, "key", e.target.value.slice(0, STEP2_KEY_MAX))}
                                placeholder="action"
                                className="w-full bg-transparent border border-[#3A3A3A] text-white rounded-lg px-3 py-2 pr-10 outline-none focus:ring-0"
                                maxLength={STEP2_KEY_MAX}
                              />
                              <button
                                onClick={() => handleOpenModal({ type: "step2_key", index: idx })}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#2B2B2B] transition-colors cursor-pointer"
                                aria-label={`Expand key ${idx + 1}`}
                              >
                                <Scan size={16} color="#A3A3A3" />
                              </button>
                            </div>
                          </div>
                          <div className="w-full">
                            <label className="text-xs text-[#A3A3A3]">description</label>
                            <div className="relative mt-1">
                              <input
                                type="text"
                                value={grp.description}
                                onChange={(e) => updateStep2Field(idx, "description", e.target.value.slice(0, STEP2_DESC_MAX))}
                                placeholder="Veja a melhor ação para o orc..."
                                className="w-full bg-transparent border border-[#3A3A3A] text-white rounded-lg px-3 py-2 pr-10 outline-none focus:ring-0"
                                maxLength={STEP2_DESC_MAX}
                              />
                              <button
                                onClick={() => handleOpenModal({ type: "step2_description", index: idx })}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#2B2B2B] transition-colors cursor-pointer"
                                aria-label={`Expand description ${idx + 1}`}
                              >
                                <Scan size={16} color="#A3A3A3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {formData.step2.groups.length >= MAX_STEP2_GROUPS && (
                      <div className="text-xs text-center text-[#8C8C8C] mt-2">Max {MAX_STEP2_GROUPS} keys allowed.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* ---------------- Step 3: Workgroup ---------------- */}
            <div>
              <div className="mb-3">
                <div className="text-4xl font-semibold text-[#2E2E31]">Step 3</div>
              </div>
              <div className="border border-[#3A3A3A] rounded-xl">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[#FAFAFA] text-sm font-medium">Workgroup</div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleGenerateWorkgroup}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[#3A3A3A] text-sm text-[#D9D3D3] font-semibold rounded-full cursor-pointer hover:bg-[#1F1F22] transition duration-200 active:scale-95"
                        title="AI Generate"
                      >
                        <WandSparkles size={14} color="#D9D3D3" />
                        {isGenerating ? "Generating..." : "AI Generate"}
                      </button>
                      <button
                        onClick={handleRunWorkgroup}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#202024] text-[##D9D9D9] text-sm font-semibold rounded-full cursor-pointer hover:bg-[#3B3B42] transition duration-200 active:scale-95"
                        title="Run Workgroup"
                      >
                        <Play size={10} fill="#D9D9D9" />
                        Run
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-[#3A3A3A]" />

                <div className="p-4">
                  {/* COMPONENTE WORKGROUP ATUALIZADO COM OS PROPS NECESSÁRIOS */}
                  <WorkGroup
                    workgroupData={formData.workgroup}
                    workgroupResponses={workgroupResponses}
                    runningAgentIndex={runningAgentIndex}
                    onRunAgent={handleRunAgent}
                    onOpenSpecialistModal={(index) => handleOpenModal({ type: "specialist", index })}
                    onOpenResponseModal={(index) => handleOpenModal({ type: "specialist_response", index })}
                    isGenerating={isGenerating}
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="h-10" />
        </div>
      </main>
    </div>
  );
}
export default Create;