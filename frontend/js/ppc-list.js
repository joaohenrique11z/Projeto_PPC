/**
 * ppc-list.js — Gerenciamento de lista de PPCs (Planos Pedagógicos de Curso)
 * Sistema Gerador de PPC — IFPE Campus Belo Jardim
 *
 * Responsabilidades:
 *  - Renderizar tabela de PPCs
 *  - Criar novo PPC
 *  - Editar PPC (redireciona para forms.html)
 *  - Deletar PPC
 *  - Duplicar PPC
 *  - Persistir dados em localStorage
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'ppcs';
    const tbody = document.getElementById('ppc-table-body');
    const emptyState = document.getElementById('ppc-empty-state');
    const btnNovoPPC = document.getElementById('btn-novo-ppc');
    const btnCriarPPCVazio = emptyState ? emptyState.querySelector('a[href="forms.html"]') : null;
    const modalAcao = document.getElementById('modal-acao');
    const modalTitulo = document.getElementById('modal-acao-titulo');
    const modalMensagem = document.getElementById('modal-acao-mensagem');
    const btnConfirmarAcao = document.getElementById('btn-confirmar-acao');
    const btnCancelarAcao = document.getElementById('btn-cancelar-acao');

    let ppcs = [];
    let acaoModal = null; // Armazena a ação a ser realizada (delete, duplicate, etc.)
    let ppcIdModal = null; // Armazena o ID do PPC para a ação

    /* ================================================================== */
    /* UTILITÁRIOS DE ARMAZENAMENTO                                        */
    /* ================================================================== */

    /**
     * Carrega PPCs do localStorage
     */
    function carregarPPCs() {
        try {
            const dados = localStorage.getItem(STORAGE_KEY);
            ppcs = dados ? JSON.parse(dados) : [];
        } catch (e) {
            console.error('Erro ao carregar PPCs:', e);
            ppcs = [];
        }
    }

    /**
     * Salva PPCs no localStorage
     */
    function salvarPPCs() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ppcs));
        } catch (e) {
            console.error('Erro ao salvar PPCs:', e);
        }
    }

    /**
     * Gera um ID único para um novo PPC
     */
    function gerarIdUnco() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Formata uma data para exibição
     */
    function formatarData(timestamp) {
        if (!timestamp) return '-';
        const data = new Date(Number(timestamp));
        return data.toLocaleDateString('pt-BR');
    }

    /* ================================================================== */
    /* GERENCIAMENTO DE PPCs                                              */
    /* ================================================================== */

    /**
     * Cria um novo PPC vazio
     */
    function criarNovoPPC() {
        const novoPPC = {
            id: gerarIdUnco(),
            nome: `Novo PPC ${ppcs.length + 1}`,
            ano: new Date().getFullYear(),
            status: 'Rascunho',
            dataCriacao: Date.now(),
            dataAtualizacao: Date.now(),
            dados: {} // Armazena os dados do formulário
        };

        ppcs.push(novoPPC);
        salvarPPCs();
        renderizarTabela();
    }

    /**
     * Edita um PPC existente
     */
    function editarPPC(id) {
        const ppc = ppcs.find(p => p.id === id);
        if (!ppc) {
            console.error('PPC não encontrado');
            return;
        }

        // Armazena o PPC atual em sessionStorage para recuperar em forms.html
        sessionStorage.setItem('ppc_atual', JSON.stringify(ppc));

        // Redireciona para o formulário
        window.location.href = `forms.html?id=${id}`;
    }

    /**
     * Mostra o modal de confirmação para deletar um PPC
     */
    function confirmarDeleta(id) {
        const ppc = ppcs.find(p => p.id === id);
        if (!ppc) return;

        acaoModal = 'delete';
        ppcIdModal = id;

        modalTitulo.textContent = 'Deletar PPC?';
        modalMensagem.textContent = `Tem certeza que deseja deletar "${ppc.nome}"? Esta ação não pode ser desfeita.`;
        btnConfirmarAcao.textContent = 'Deletar';
        btnConfirmarAcao.classList.remove('bg-red-600', 'hover:bg-red-700');
        btnConfirmarAcao.classList.add('bg-red-600', 'hover:bg-red-700');

        modalAcao.classList.remove('hidden');
    }

    /**
     * Mostra o modal de confirmação para duplicar um PPC
     */
    function confirmarDuplica(id) {
        const ppc = ppcs.find(p => p.id === id);
        if (!ppc) return;

        acaoModal = 'duplicate';
        ppcIdModal = id;

        modalTitulo.textContent = 'Duplicar PPC?';
        modalMensagem.textContent = `Deseja duplicar "${ppc.nome}"? Uma cópia será criada com o sufixo "(Cópia)".`;
        btnConfirmarAcao.textContent = 'Duplicar';
        btnConfirmarAcao.classList.remove('bg-red-600', 'hover:bg-red-700');
        btnConfirmarAcao.classList.add('bg-blue-600', 'hover:bg-blue-700');

        modalAcao.classList.remove('hidden');
    }

    /**
     * Deleta um PPC
     */
    function deletarPPC(id) {
        ppcs = ppcs.filter(p => p.id !== id);
        salvarPPCs();
        renderizarTabela();
    }

    /**
     * Duplica um PPC
     */
    function duplicarPPC(id) {
        const ppc = ppcs.find(p => p.id === id);
        if (!ppc) return;

        const copia = {
            ...ppc,
            id: gerarIdUnco(),
            nome: `${ppc.nome} (Cópia)`,
            dataCriacao: Date.now(),
            dataAtualizacao: Date.now()
        };

        ppcs.push(copia);
        salvarPPCs();
        renderizarTabela();
    }

    /* ================================================================== */
    /* RENDERIZAÇÃO                                                        */
    /* ================================================================== */

    /**
     * Renderiza a tabela de PPCs
     */
    function renderizarTabela() {
        tbody.innerHTML = '';

        if (ppcs.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        ppcs.forEach(ppc => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors';

            const tdClass = 'px-4 py-3 dark:text-gray-300';
            const tdClassHidden = 'px-4 py-3 dark:text-gray-300 hidden sm:table-cell';
            const tdClassMd = 'px-4 py-3 dark:text-gray-300 hidden md:table-cell';

            const td1 = document.createElement('td');
            td1.className = tdClass;
            const btnNome = document.createElement('button');
            btnNome.type = 'button';
            btnNome.className = 'btn-editar-nome text-blue-600 hover:text-blue-800 font-medium';
            btnNome.dataset.id = ppc.id;
            btnNome.textContent = ppc.nome;
            td1.appendChild(btnNome);

            const td2 = document.createElement('td');
            td2.className = tdClassHidden;
            td2.textContent = ppc.ano;

            const td3 = document.createElement('td');
            td3.className = tdClass;
            const spanStatus = document.createElement('span');
            spanStatus.className = `inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                ppc.status === 'Rascunho'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            }`;
            spanStatus.textContent = ppc.status;
            td3.appendChild(spanStatus);

            const td4 = document.createElement('td');
            td4.className = tdClassMd;
            td4.textContent = formatarData(ppc.dataAtualizacao);

            const td5 = document.createElement('td');
            td5.className = 'px-4 py-3 text-center';
            td5.innerHTML = `
                <div class="flex gap-2 justify-center flex-wrap">
                    <button type="button" class="btn-editar text-blue-600 hover:text-blue-800 text-xs font-medium" data-id="${ppc.id}">
                        Editar
                    </button>
                    <button type="button" class="btn-duplicar text-green-600 hover:text-green-800 text-xs font-medium" data-id="${ppc.id}">
                        Duplicar
                    </button>
                    <button type="button" class="btn-deletar text-red-600 hover:text-red-800 text-xs font-medium" data-id="${ppc.id}">
                        Deletar
                    </button>
                </div>
            `;
            
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            tr.appendChild(td5);

            tbody.appendChild(tr);
        });

        // Registra listeners
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => editarPPC(btn.dataset.id));
        });

        document.querySelectorAll('.btn-editar-nome').forEach(btn => {
            btn.addEventListener('click', () => editarPPC(btn.dataset.id));
        });

        document.querySelectorAll('.btn-deletar').forEach(btn => {
            btn.addEventListener('click', () => confirmarDeleta(btn.dataset.id));
        });

        document.querySelectorAll('.btn-duplicar').forEach(btn => {
            btn.addEventListener('click', () => confirmarDuplica(btn.dataset.id));
        });
    }

    /* ================================================================== */
    /* EVENT LISTENERS                                                     */
    /* ================================================================== */

    // Botão "Novo PPC" - cria um novo PPC
    if (btnNovoPPC) {
        btnNovoPPC.addEventListener('click', () => {
            criarNovoPPC();
        });
    }

    // Botão "Criar PPC" no estado vazio
    if (btnCriarPPCVazio) {
        btnCriarPPCVazio.addEventListener('click', (e) => {
            e.preventDefault();
            criarNovoPPC();
        });
    }

    // Listeners do modal
    btnCancelarAcao.addEventListener('click', () => {
        modalAcao.classList.add('hidden');
        acaoModal = null;
        ppcIdModal = null;
    });

    btnConfirmarAcao.addEventListener('click', () => {
        if (acaoModal === 'delete') {
            deletarPPC(ppcIdModal);
        } else if (acaoModal === 'duplicate') {
            duplicarPPC(ppcIdModal);
        }

        modalAcao.classList.add('hidden');
        acaoModal = null;
        ppcIdModal = null;
    });

    // Fecha o modal ao clicar fora
    modalAcao.addEventListener('click', (e) => {
        if (e.target === modalAcao) {
            modalAcao.classList.add('hidden');
            acaoModal = null;
            ppcIdModal = null;
        }
    });

    /* ================================================================== */
    /* INICIALIZAÇÃO                                                       */
    /* ================================================================== */

    document.addEventListener('DOMContentLoaded', () => {
        carregarPPCs();
        renderizarTabela();
    });

})();
