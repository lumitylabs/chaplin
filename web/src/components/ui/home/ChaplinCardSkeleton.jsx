import React from "react";

/**
 * ChaplinCardSkeleton Component - Padrão de Alta Fidelidade
 *
 * Inspirado no `SpecialistSkeleton`, este componente foi criado para ser um
 * placeholder visualmente idêntico ao `PersonaCard`, garantindo uma experiência
 * de carregamento suave e profissional na página Home.
 *
 * 1.  **Fidelidade Estrutural e Dimensional:**
 *     - A estrutura espelha o layout flexbox (imagem à esquerda, conteúdo à direita)
 *       do `PersonaCard`.
 *     - As dimensões dos elementos, como a imagem (`w-24 h-32`) e os botões (`w-20`),
 *       são exatas para prevenir qualquer "salto" de layout (Layout Shift) quando
 *       os dados do card real são carregados.
 *
 * 2.  **Paleta de Cores Sutil e Consistente:**
 *     - O fundo do card é estático (`bg-[#202024]`), correspondendo ao `PersonaCard`.
 *     - Os placeholders de conteúdo dinâmico usam `bg-[#2C2C30]` com a animação
 *       `animate-pulse`. Isso cria o mesmo efeito de baixo contraste, elegante e
 *       integrado ao tema escuro.
 *
 * 3.  **Simulação Realista de Conteúdo:**
 *     - A descrição é representada por três linhas de larguras variadas,
 *       simulando um parágrafo de texto real de forma mais convincente do que
 *       linhas de tamanho idêntico.
 *     - Ícones e botões são representados por formas (`rounded-full`) que
 *       correspondem aos seus equivalentes no componente real.
 */
function ChaplinCardSkeleton() {
    return (
        <div className="flex flex-row gap-4 w-full bg-[#202024] rounded-2xl p-4 select-none">
            {/* 1. Placeholder da Imagem */}
            <div className="w-24 h-32 object-cover rounded-xl flex-shrink-0 bg-[#2C2C30] animate-pulse"></div>

            {/* 2. Placeholder do Conteúdo */}
            <div className="flex flex-col flex-grow min-w-0">
                {/* Cabeçalho: Título e Ícone de Favorito */}
                <div className="flex justify-between items-start">
                    {/* Placeholder do Título */}
                    <div className="h-5 bg-[#2C2C30] rounded-md w-3/5 animate-pulse"></div>
                    {/* Placeholder do Ícone de Estrela */}
                    <div className="h-5 w-5 bg-[#2C2C30] rounded-full animate-pulse"></div>
                </div>

                {/* Placeholder da Descrição (simulando 3 linhas) */}
                <div className="flex flex-col gap-2 mt-3 mb-2 flex-grow">
                    <div className="h-4 bg-[#2C2C30] rounded-md w-full animate-pulse"></div>
                    <div className="h-4 bg-[#2C2C30] rounded-md w-full animate-pulse"></div>
                    <div className="h-4 bg-[#2C2C30] rounded-md w-5/6 animate-pulse"></div>
                </div>

                {/* Placeholder dos Botões de Ação */}
                <div className="flex gap-2 justify-end mt-auto">
                    <div className="w-20 h-8 bg-[#2C2C30] rounded-full animate-pulse"></div>
                    {/* O botão "Clone" está oculto no componente real, então não precisamos de um placeholder para ele. */}
                </div>
            </div>
        </div>
    );
}

export default ChaplinCardSkeleton;