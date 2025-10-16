// src/pages/Create.jsx
import React, { useRef, useState, useEffect } from "react";
import { Menu, Scan, WandSparkles, ChevronDown, Plus, Trash2, PenLine, Play } from "lucide-react";
// Componentes e Assets existentes
import PersonaNavbar from "../components/ui/general/PersonaNavbar";
import InputBox from "../components/ui/general/InputBox";
import EditIcon from "../assets/edit_icon.svg";
import GenerateWandIcon from "../assets/generate_wand_icon.svg";
import Persona from "../assets/persona.png";
import PublicIcon from "../assets/public_icon.svg";
import LockOpenIcon from "../assets/open_lock_icon.svg";
import OutputIcon from "../assets/output_icon.svg";
import PlayIcon from "../assets/play_icon.svg";
import ResponseIcon from "../assets/reponse_icon.svg";
import CloseIcon from "../assets/close_icon.svg";
import ExpandBox from "../components/ui/general/ExpandBox";
import { generateWorkgroup } from "../services/apiService";
import SpecialistSkeleton from "../components/ui/create/SpecialistSkeleton";
/* ------------------ constantes ------------------ */
const NAME_MAX = 20;
const INSTR_MAX = 200;
const STEP2_KEY_MAX = 12;
const STEP2_DESC_MAX = 100;
const MAX_STEP2_GROUPS = 5;
const CATEGORY_OPTIONS = [
  "Assistant",
  "Anime",
  "Creativity & Writing",
  "Entertainment & Gaming",
  "History",
  "Humor",
  "Learning",
];
/* ------------------ Subcomponentes ------------------ */
function Specialist({ number, name, prompt, onOpenModal }) {
  return (
    <div className="w-full border border-[#3A3A3A] rounded-xl font-inter text-sm flex flex-col justify-between">
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
          <div className="text-[#989898] text-sm">Prompt</div>
          <ExpandBox
            size={"100%"}
            value={prompt}
            placeholder="Specialist prompt..."
            onOpenModal={onOpenModal}
          />
        </div>
      </div>

      <div className="w-full h-10 bg-[#2B2B2B] rounded-b-xl flex items-center justify-end gap-3 px-4 text-[#B0B0B0]">
        Response
        <img src={OutputIcon} alt="" />
      </div>
    </div>
  );
}
function WorkGroup({
  workgroupData,
  onOpenSpecialistModal,
  isGenerating,
}) {
  return (
    <div>
      <div className="flex flex-col gap-6">
        {isGenerating ? (
          <>
            <SpecialistSkeleton />
            <SpecialistSkeleton />
            <SpecialistSkeleton />
          </>
        ) : workgroupData && workgroupData.length > 0 ? (
          workgroupData.map((specialist, index) => (
            <Specialist
              key={index}
              number={index + 1}
              name={specialist.name}
              prompt={specialist.prompt}
              onOpenModal={() => onOpenSpecialistModal(index)}
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
/* ------------------ Modal central (mantive sua lógica) ------------------ */
function Modal({ initialText, onSave, onClose, title = "Edit Content", subtitle }) {
  const modalRef = useRef(null);
  const [currentText, setCurrentText] = useState(initialText);
  useEffect(() => {
    setCurrentText(initialText ?? "");
  }, [initialText]);
  const handleAttemptClose = () => {
    const hasUnsavedChanges = initialText !== currentText;
    if (hasUnsavedChanges) {
      const userConfirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (userConfirmed) onClose();
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
      className="bg-black/30 w-screen h-screen fixed z-40 top-0 left-0 backdrop-blur-sm flex items-center justify-center"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="w-[45rem] max-h-[80vh] bg-[#2D2D2D] rounded-3xl border border-[#6C6C6C] p-8 flex flex-col"
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-start">
            <img src={ResponseIcon} alt="" />
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-white">{title}</div>
              {subtitle && <div className="text-sm text-[#747474]">{subtitle}</div>}
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
/* ------------------ Componente Principal Create (base estável + correções) ------------------ */
function Create() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    instructions: "",
    personaDescription: "",
    step2: {
      groups: [{ key: "", description: "" }],
    },
    workgroup: [],
    io: { input: "", output: "Waiting for input..." },
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null); // { type, index? }
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(null);
  // --- Avatar menu states e refs ---
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarButtonRef = useRef(null);
  const avatarMenuRef = useRef(null);
  // Category dropdown refs
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);
  const categoryMenuRef = useRef(null);
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setIsNavbarOpen(isDesktop);
  }, []);
  // Hook para fechar menus ao clicar fora
  useEffect(() => {
    function handleDocClick(e) {
      // Lógica para fechar o menu do avatar
      if (
        isAvatarMenuOpen &&
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(e.target) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(e.target)
      ) {
        setIsAvatarMenuOpen(false);
      }

      // Lógica para fechar o dropdown de categoria
      if (
        isCategoryOpen &&
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target) &&
        categoryRef.current &&
        !categoryRef.current.contains(e.target)
      ) {
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
      setFormData((prevData) => ({ ...prevData, workgroup: [] }));
    } else {
      setFormData((prevData) => ({ ...prevData, workgroup: result.data }));
    }

    setIsGenerating(false);
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
      if (type === "description") newData.personaDescription = newText;
      else if (type === "specialist") {
        const newWorkgroup = [...newData.workgroup];
        newWorkgroup[index] = { ...newWorkgroup[index], prompt: newText };
        newData.workgroup = newWorkgroup;
      } else if (type === "io_input") newData.io = { ...newData.io, input: newText };
      else if (type === "step2_key") {
        const groups = [...newData.step2.groups];
        groups[index] = { ...groups[index], key: newText.slice(0, STEP2_KEY_MAX) };
        newData.step2.groups = groups;
      } else if (type === "step2_description") {
        const groups = [...newData.step2.groups];
        groups[index] = { ...groups[index], description: newText.slice(0, STEP2_DESC_MAX) };
        newData.step2.groups = groups;
      } else if (type === "avatar") {
        // placeholder for generated avatar url if needed later
      }
      return newData;
    });
  }
  function getInitialTextForModal() {
    if (!editingField) return "";
    const { type, index } = editingField;
    if (type === "description") return formData.personaDescription;
    if (type === "specialist") return formData.workgroup[index]?.prompt || "";
    if (type === "io_input") return formData.io.input;
    if (type === "step2_key") return formData.step2.groups[index]?.key || "";
    if (type === "step2_description") return formData.step2.groups[index]?.description || "";
    if (type === "avatar") return "";
    return "";
  }
  /* ---------- Step2 group handlers ---------- */
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
      // If the last group is removed, add a new empty one to prevent empty state
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
  /* ---------- Category dropdown ---------- */
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
          title={(() => {
            if (!editingField) return "Edit";
            if (editingField.type === "description") return "Edit Persona Description";
            if (editingField.type === "specialist") return "Edit Specialist Prompt";
            if (editingField.type === "io_input") return "Edit Input";
            if (editingField.type === "step2_key") return "Edit Key";
            if (editingField.type === "step2_description") return "Edit Description";
            if (editingField.type === "avatar") return "Generate Avatar Image";
            return "Edit";
          })()}
          subtitle={(() => {
            if (!editingField) return "";
            if (editingField.type === "specialist") return "Modify the specialist prompt and save.";
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
            <button className="bg-[#2B2B2B] text-[#8C8C8C] px-5 py-2 rounded-xl font-medium cursor-pointer">Publish</button>
          </div>

          {/* ---------- Principal form (Name, Category, Instructions, Visibility) ---------- */}
          <div className="flex flex-col gap-4 max-w-2xl">
            {/* NAME */}
            <div>
              <label className="text-sm text-[#A3A3A3]">Name</label>
              <div className="mt-2">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, NAME_MAX) })}
                  placeholder="e.g. Charles Chaplin"
                  className="w-full bg-transparent border border-[#3A3A3A] text-white rounded-lg px-4 py-2 outline-none focus:ring-0"
                  maxLength={NAME_MAX}
                />
                <div className="w-full flex justify-end mt-1">
                  <div className="text-xs text-[#8C8C8C]">{formData.name.length}/{NAME_MAX}</div>
                </div>
              </div>
            </div>

            {/* CATEGORY */}
            <div>
              <label className="text-sm text-[#A3A3A3]">Category</label>
              <div className="mt-2 relative pb-3" ref={categoryRef}>
                <button
                  onClick={toggleCategory}
                  className={`w-full flex items-center justify-between bg-transparent border border-[#3A3A3A] rounded-lg px-4 py-2 text-left outline-none focus:ring-0 ${formData.category ? "text-white" : "text-[#A3A3A3]"
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
              <label className="text-sm text-[#A3A3A3]">Instructions</label>
              <div className="mt-2">
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value.slice(0, INSTR_MAX) })}
                  placeholder="Peça uma missão e o local da quest..."
                  className="w-full bg-transparent border border-[#3A3A3A] text-white rounded-lg px-4 py-2 outline-none resize-none focus:ring-0"
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
              <label className="text-sm text-[#A3A3A3]">Visibility</label>
              <div className="flex items-center gap-2 border border-[#3A3A3A] p-2 rounded-lg mt-2 text-sm text-gray-300 w-fit bg-transparent">
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
                <div className="text-2xl font-semibold text-[#232323] opacity-30">Step 1</div>
              </div>
              <div className="border border-[#3A3A3A] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[#D0D0D0] font-semibold">Input Data</div>
                </div>
                <div className="h-px bg-[#3A3A3A] mb-4" />

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
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#2B2B2B] transition-colors"
                      aria-label="Expand description"
                    >
                      <Scan size={16} color="#A3A3A3" />
                    </button>
                  </div>
                </div>

                {/* --- ÁREA DO AVATAR MODIFICADA --- */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#A3A3A3]">Avatar</label>
                  {/* Adicionado 'relative' ao contêiner para posicionar o menu */}
                  <div className="relative w-36 h-36">
                    <img src={Persona} alt="persona" className="w-full h-full object-cover rounded-2xl border border-[#3A3A3A]" />

                    <div className="absolute bottom-0 right-0">
                      <button
                        ref={avatarButtonRef}
                        onClick={() => setIsAvatarMenuOpen(prev => !prev)} // Ação de clique simplificada
                        className="bg-[#202024] p-3 shadow-md rounded-full transition-colors cursor-pointer"
                        aria-label="Avatar options"
                        aria-expanded={isAvatarMenuOpen}
                      >
                        <PenLine size={16} color="#F3F3F3" />
                      </button>
                    </div>

                    {/* Menu suspenso do avatar */}
                    {isAvatarMenuOpen && (
                      <div
                        ref={avatarMenuRef}
                        // Posicionamento absoluto relativo ao contêiner 'w-36 h-36'
                        className="absolute bottom-8 left-34 z-50 w-54 bg-[#202024] rounded-lg p-1 shadow-lg"
                      >
                        <button
                          onClick={() => {
                            handleOpenModal({ type: "avatar" });
                          }}
                          className="flex justify-between items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-[#2E2E31] transition cursor-pointer"
                        >

                          Generate Image
                          <WandSparkles size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- Step 2: Output Format ---------------- */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-2xl font-semibold text-[#232323] opacity-30">Step 2</div>
              </div>
              <div className="border border-[#3A3A3A] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[#D0D0D0] font-semibold flex items-center gap-3">
                    <span>Output Format</span>
                  </div>

                  <div>
                    <button
                      onClick={addStep2Group}
                      className="p-2 rounded-full hover:bg-[#2B2B2B] transition"
                      aria-label="Add key/description"
                      title="Add key/description"
                      disabled={formData.step2.groups.length >= MAX_STEP2_GROUPS}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-[#3A3A3A] mb-4" />

                <div className="flex flex-col gap-4">
                  {formData.step2.groups.map((grp, idx) => (
                    <div key={idx} className="border border-[#3A3A3A] rounded-xl p-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white text-sm font-semibold">Output {idx + 1}</span>
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
                        {/* KEY */}
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
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#2B2B2B] transition-colors"
                              aria-label={`Expand key ${idx + 1}`}
                            >
                              <Scan size={16} color="#A3A3A3" />
                            </button>
                          </div>
                        </div>

                        {/* DESCRIPTION */}
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
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#2B2B2B] transition-colors"
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

            {/* ---------------- Step 3: Workgroup ---------------- */}
            <div>
              <div className="mb-3">
                <div className="text-2xl font-semibold text-[#232323] opacity-30">Step 3</div>
              </div>
              <div className="border border-[#3A3A3A] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[#D0D0D0] font-semibold">Workgroup</div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateWorkgroup}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[#3A3A3A] text-sm text-[#D0D0D0] font-semibold rounded-full cursor-pointer hover:bg-[#1F1F22] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      title="AI Generate"
                    >
                      <img src={GenerateWandIcon} alt="" className="w-4 h-4" />
                      {isGenerating ? "Generating..." : "AI Generate"}
                    </button>
                    <button
                      onClick={handleRunWorkgroup}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-sm font-semibold rounded-full cursor-pointer hover:brightness-95 transition-all"
                      title="Run Workgroup"
                    >
                      <Play size={14} />
                      Run
                    </button>
                  </div>
                </div>

                <div className="h-px bg-[#3A3A3A] mb-4" />

                <WorkGroup
                  workgroupData={formData.workgroup}
                  onOpenSpecialistModal={(index) => handleOpenModal({ type: "specialist", index })}
                  isGenerating={isGenerating}
                />
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