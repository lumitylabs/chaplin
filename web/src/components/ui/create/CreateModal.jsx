import React, { useRef, useState, useEffect } from "react";
import { X, SquareCode } from "lucide-react";

// Supondo que você tenha um componente StatusBar semelhante a este.
// Se não tiver, você pode remover a linha ou criar um componente simples.
function StatusBar({ text, maxLength }) {
    if (maxLength === null || maxLength === undefined) {
        return null; // Não renderiza nada se não houver limite de caracteres
    }

    const currentLength = text?.length || 0;
    const isOverLimit = currentLength > maxLength;

    return (
        <div className="text-right text-sm mt-2">
            <span className={isOverLimit ? 'text-red-500' : 'text-gray-400'}>
                {currentLength}/{maxLength}
            </span>
        </div>
    );
}


function CreateModal({
    isOpen,
    onClose,
    onSave,
    config,
}) {
    // Desestruturação das configurações do modal com valores padrão
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

    // Efeito para sincronizar o estado interno com a prop `initialText` quando ela mudar
    useEffect(() => {
        setCurrentText(initialText ?? "");
    }, [initialText]);

    // Efeito para adicionar e remover o listener do teclado para a tecla 'Escape'
    useEffect(() => {
        // Função que será chamada a cada tecla pressionada no documento
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleAttemptClose(); // Chama a mesma função de fechar do botão 'X'
            }
        };

        // Adiciona o listener apenas se o modal estiver aberto
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        // Função de limpeza: remove o listener quando o componente é desmontado
        // ou antes de o efeito ser executado novamente. Essencial para evitar vazamentos de memória.
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
        // O array de dependências garante que o efeito seja reavaliado se 'isOpen' ou 'currentText' mudar.
        // 'currentText' é importante para que 'handleAttemptClose' sempre tenha o valor mais recente do estado.
    }, [isOpen, currentText]);

    // Se o modal não estiver aberto, não renderiza nada
    if (!isOpen) return null;

    // Função para tentar fechar o modal, verificando se há alterações não salvas
    const handleAttemptClose = () => {
        if (!readOnly && initialText !== currentText) {
            if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    // Função para fechar o modal ao clicar fora da área de conteúdo
    function handleClickOutside(e) {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            handleAttemptClose();
        }
    }

    // Função para salvar o conteúdo
    function handleSave() {
        // Garante que o texto salvo não exceda o limite, como uma segurança final.
        const textToSave = maxLength ? currentText.slice(0, maxLength) : currentText;
        onSave(textToSave);
        onClose();
    }

    // Manipulador de mudança para o textarea que respeita o maxLength
    const handleTextChange = (e) => {
        if (maxLength !== null) {
            setCurrentText(e.target.value.slice(0, maxLength));
        } else {
            setCurrentText(e.target.value);
        }
    };

    return (
        // Overlay do modal
        <div
            className="bg-black/50 w-screen h-screen fixed z-40 top-0 left-0 backdrop-blur-sm flex items-center justify-center"
            onClick={handleClickOutside}
        >
            {/* Conteúdo do Modal */}
            <div
                ref={modalRef}
                className="w-[48rem] max-h-[85vh] bg-[#2D2D2D] rounded-3xl border border-[#6C6C6C] p-8 flex flex-col font-inter"
            >

                {/* Cabeçalho */}
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

                {/* Área de Texto */}
                <textarea
                    value={currentText}
                    onChange={handleTextChange}
                    readOnly={readOnly}
                    maxLength={maxLength} // Atributo nativo para segurança adicional
                    className={`mt-6 w-full flex-grow bg-[#202024] border border-[#3A3A3A] rounded-2xl p-5 text-white text-sm outline-none resize-none ${readOnly ? 'cursor-default' : 'focus:ring-1 focus:ring-gray-400'}`}
                />

                {/* Rodapé com a Barra de Status (contador de caracteres) */}
                <StatusBar text={currentText} maxLength={maxLength} />

                {/* Botão de Ação Principal */}
                {showActionButton && (
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSave}
                            className="bg-[#E0E0E0] text-black font-semibold py-2 px-6 rounded-lg hover:bg-white transition-colors"
                        >
                            {actionButtonText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreateModal;