import React, { useRef, useState, useEffect } from "react";
import { X, SquareCode } from "lucide-react";
import StatusBar from "../create/StatusBar";

function CreateModal({
    isOpen,
    onClose,
    onSave,
    config,
}) {
    const {
        initialText = "",
        readOnly = false,
        title = "Edit Content",
        subtitle,
        Icon = SquareCode,
        actionButtonText = "Save",
        showActionButton = true,
        headerActions = null,
        maxLength = null, // Prop para o limite de caracteres
    } = config || {};

    const modalRef = useRef(null);
    const [currentText, setCurrentText] = useState(initialText);

    useEffect(() => {
        setCurrentText(initialText ?? "");
    }, [initialText]);

    if (!isOpen) return null;

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
        // Garante que o texto salvo também não exceda o limite, como uma segurança final.
        const textToSave = maxLength ? currentText.slice(0, maxLength) : currentText;
        onSave(textToSave);
        onClose();
    }

    // Handler de mudança que respeita o maxLength para uma UX suave
    const handleTextChange = (e) => {
        if (maxLength) {
            setCurrentText(e.target.value.slice(0, maxLength));
        } else {
            setCurrentText(e.target.value);
        }
    };

    return (
        <div className="bg-black/50 w-screen h-screen fixed z-40 top-0 left-0 backdrop-blur-sm flex items-center justify-center" onClick={handleClickOutside}>
            <div ref={modalRef} className="w-[48rem] max-h-[85vh] bg-[#2D2D2D] rounded-3xl border border-[#6C6C6C] p-8 flex flex-col font-inter">

                {/* Cabeçalho Customizável */}
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-start">
                        <Icon size={24} className="mt-1 text-gray-300" />
                        <div className="flex flex-col">
                            <div className="text-lg font-semibold text-white">{title}</div>
                            {subtitle && <div className="text-sm text-[#747474] mt-1">{subtitle}</div>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {headerActions}
                        <button onClick={handleAttemptClose} className="cursor-pointer text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Textarea Atualizado */}
                <textarea
                    value={currentText}
                    onChange={handleTextChange} // Usando o novo handler
                    readOnly={readOnly}
                    maxLength={maxLength} // Adicionando o atributo nativo como fallback
                    className={`mt-6 w-full flex-grow bg-[#202024] border border-[#3A3A3A] rounded-2xl p-5 text-white text-sm outline-none resize-none ${readOnly ? 'cursor-default' : 'focus:ring-1 focus:ring-gray-400'}`}
                />

                {/* Rodapé com a StatusBar (que já tem a lógica de feedback visual) */}
                <StatusBar text={currentText} maxLength={maxLength} />

                {/* Botão de Ação */}
                {showActionButton && (
                    <div className="flex justify-end mt-6">
                        <button onClick={handleSave} className="bg-[#E0E0E0] text-black font-semibold py-2 px-6 rounded-lg hover:bg-white transition-colors">
                            {actionButtonText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreateModal;