import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, CheckCircle2, Zap, Loader, FileJson, Image as ImageIcon, AlertTriangle, ChevronDown } from "lucide-react";
import SimpleBar from 'simplebar-react';

// Componente para cada passo do progresso
const ProgressStep = ({ step }) => {
  const isCompleted = step.status === 'completed';
  const isProcessing = step.status === 'processing';
  const isError = step.status === 'error';

  const getIcon = () => {
    if (isProcessing) return <Loader size={18} className="animate-spin text-gray-400" />;
    if (isCompleted) return <CheckCircle2 size={18} className="text-green-500" />;
    if (isError) return <AlertTriangle size={18} className="text-red-500" />;
    
    switch(step.type) {
        case 'connection': return <Zap size={18} />;
        case 'agent': return <Zap size={18} />; // Pode mudar o ícone se quiser
        case 'integrator': return <FileJson size={18} />;
        case 'image': return <ImageIcon size={18} />;
        default: return <Zap size={18} />;
    }
  };

  const borderColor = isCompleted ? 'border-green-500' : isError ? 'border-red-500' : 'border-[#3a3a3f]';

  return (
    <details className="bg-[#1F1F22] rounded-lg border open:shadow-lg" open={isProcessing}>
      <summary className={`p-4 flex items-center justify-between cursor-pointer list-none ${borderColor} border rounded-lg`}>
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="font-medium text-white">{step.name}</span>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 capitalize">{step.status}</span>
            <ChevronDown size={20} className="text-gray-500 transition-transform duration-300 group-open:rotate-180" />
        </div>
      </summary>
      <div className="p-4 border-t border-[#26272B]">
        {typeof step.content === 'string' ? (
          <p className="text-[#A2A2AB] text-sm whitespace-pre-wrap">{step.content}</p>
        ) : (
          <pre className="text-xs text-[#A2A2AB] bg-[#131316] p-3 rounded-md overflow-x-auto">
            <code>{JSON.stringify(step.content, null, 2)}</code>
          </pre>
        )}
      </div>
    </details>
  );
};

function NavbarHeader({ closeNavbar }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-5 pr-2 pt-5 pb-4 flex-shrink-0">
      <div className="font-mali w-min font-medium text-2xl text-white tracking-[-0.04em] cursor-pointer" onClick={() => navigate("/home")}>
        Workgroup
      </div>
      <button onClick={closeNavbar} className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1F1F22] transition duration-200 cursor-pointer">
        <ChevronsLeft color="#86868E" size={17} />
      </button>
    </div>
  );
}

function Navbar({ isOpen, setIsOpen, progressSteps }) {
  const variants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={variants}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="fixed top-0 left-0 w-[340px] h-screen bg-[#131316] border-r-[1px] border-[#26272B] font-inter flex flex-col z-40"
      >
        <NavbarHeader closeNavbar={() => setIsOpen(false)} />
        <div className="flex-grow overflow-hidden px-5">
            <SimpleBar style={{ maxHeight: 'calc(100vh - 80px)' }}>
                <div className="flex flex-col gap-3 pb-5 pr-2">
                    {progressSteps.map((step) => (
                        <ProgressStep key={step.id} step={step} />
                    ))}
                </div>
            </SimpleBar>
        </div>
      </motion.nav>
    </>
  );
}

export default Navbar;