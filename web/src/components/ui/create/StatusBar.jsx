// src/components/ui/create/StatusBar.jsx

import React from 'react';

function StatusBar({ text, maxLength }) {
    const chars = text.length;
    const lines = text.split('\n').length;
    const currentLine = text.substring(0, text.length).split('\n').pop();
    const column = currentLine.length + 1;

    // <<< NOVO: Lógica para feedback visual >>>
    const isLimitReached = maxLength && chars >= maxLength;

    return (
        <div className="w-full border-t border-[#6C6C6C] mt-4 pt-3 flex items-center justify-start gap-6 text-xs text-[#A3A3A3]">
            {/* <<< ATUALIZADO: Classe condicional para a cor do texto >>> */}
            <span className={isLimitReached ? 'font-semibold text-red-400' : ''}>
                Caracteres: {chars}{maxLength ? `/${maxLength}` : ''}
            </span>
            <span>Lines: {lines}</span>
            <span>Column: {column}</span>
        </div>
    );
}

export default StatusBar;