/**
 * ppc-list.js — Gerenciamento de lista de PPCs (Planos Pedagógicos de Curso)
 * Sistema Gerador de PPC — IFPE Campus Belo Jardim
 *
 * Responsabilidades:
 *  - Carregar lista de PPCs da API
 *  - Renderizar tabela de PPCs
 *  - Criar novo PPC (redireciona para forms.html sem ID)
 *  - Editar PPC (redireciona para forms.html com ID)
 *  - Deletar PPC via API
 *  - Duplicar PPC via API
 */

(function () {
    'use strict';

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
    let acaoModal = null;
    let ppcIdModal = null;
    let estaCarregando = false;

    /* ================================================================== */
    /* UTILITÁRIOS                                                          */
    /* ================================================================== */

    /**
     * Formata uma data para exibição
     */
    function formatarData(dataISO) {
        if (!dataISO) return '-';
        try {
            const data = new Date(dataISO);
            return data.toLocaleDateString('pt-BR');
        } catch {
            return '-';
        }
    }

    /**
     * Mostra/esconde o loading spinner
     */
    function mostrarCarregando(show = true) {
        estaCarregando = show;
        if (tbody) {
            if (show) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">Carregando PPCs...</td></tr>';
            }
        }
    }

    /* ================================================================== */
    /* OPERAÇÕES COM API                                                   */
    /* ================================================================== */

    /**
     * Carrega PPCs da API
     */
    async function carregarPPCsDoBackend() {
        mostrarCarregando(true);
        try {
            const dados = await listarPPCs();
            ppcs = dados || [];
            renderizarTabela();
        } catch (erro) {
            console.error('Erro ao carregar PPCs:', erro);
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-red-500">Erro ao carregar PPCs. Tente novamente.</td></tr>';
        } finally {
            mostrarCarregando(false);
        }
    }

    /**
     * Edita um PPC existente (redireciona com ID na URL)
     */
    function editarPPC(id) {
        const ppc = ppcs.find(p => p.ppc_id === id || p.id === id);
        if (!ppc) {
            exibirNotificacao('PPC não encontrado', 'erro');
            return;
        }

        window.location.href = `forms.html?id=${id}`;
    }

    /**
     * Mostra confirmação para deletar
     */
    function confirmarDeleta(id) {
        const ppc = ppcs.find(p => p.ppc_id === id || p.id === id);
        if (!ppc) return;

        acaoModal = 'delete';
        ppcIdModal = id;

        modalTitulo.textContent = 'Deletar PPC?';
        const nome = ppc.nome_curso || ppc.nome || 'Este PPC';
        modalMensagem.textContent = `Tem certeza que deseja deletar "${nome}"? Esta ação não pode ser desfeita.`;
        btnConfirmarAcao.textContent = 'Deletar';
        btnConfirmarAcao.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        btnConfirmarAcao.classList.add('bg-red-600', 'hover:bg-red-700');

        modalAcao.classList.remove('hidden');
    }

    /**
     * Deleta um PPC via API
     */
    async function deletarPPCViaAPI(id) {
        try {
            await deletarPPC(id);
            ppcs = ppcs.filter(p => p.ppc_id !== id && p.id !== id);
            renderizarTabela();
        } catch (erro) {
            exibirNotificacao('Erro ao deletar PPC', 'erro');
            console.error(erro);
        }
    }

    /**
     * Mostra confirmação para duplicar
     */
    function confirmarDuplica(id) {
        const ppc = ppcs.find(p => p.ppc_id === id || p.id === id);
        if (!ppc) return;

        acaoModal = 'duplicate';
        ppcIdModal = id;

        modalTitulo.textContent = 'Duplicar PPC?';
        const nome = ppc.nome_curso || ppc.nome || 'Este PPC';
        modalMensagem.textContent = `Deseja duplicar "${nome}"? Uma cópia será criada.`;
        btnConfirmarAcao.textContent = 'Duplicar';
        btnConfirmarAcao.classList.remove('bg-red-600', 'hover:bg-red-700');
        btnConfirmarAcao.classList.add('bg-blue-600', 'hover:bg-blue-700');

        modalAcao.classList.remove('hidden');
    }

    /**
     * Duplica um PPC (busca todos os dados e cria novo)
     * TODO: Implementar endpoint de duplicação no backend
     */
    async function duplicarPPC(id) {
        exibirNotificacao('Funcionalidade de duplicação em desenvolvimento', 'info');
        // Futura implementação: chamar endpoint de duplicação
    }

    /* ================================================================== */
    /* RENDERIZAÇÃO                                                        */
    /* ================================================================== */

    /**
     * Renderiza a tabela de PPCs carregados da API
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

            const ppcId = ppc.ppc_id || ppc.id;
            const nomeCurso = ppc.nome_curso || ppc.nome || 'Sem nome';
            const status = ppc.status_curso || 'Ativo';
            const dataAtualizacao = ppc.data_ultima_atualizacao || ppc.dataAtualizacao;

            const td1 = document.createElement('td');
            td1.className = tdClass;
            const btnNome = document.createElement('button');
            btnNome.type = 'button';
            btnNome.className = 'btn-editar-nome text-blue-600 hover:text-blue-800 font-medium';
            btnNome.dataset.id = ppcId;
            btnNome.textContent = nomeCurso;
            td1.appendChild(btnNome);

            const td2 = document.createElement('td');
            td2.className = tdClassHidden;
            td2.textContent = ppc.area_conhecimento || '-';

            const td3 = document.createElement('td');
            td3.className = tdClass;
            const spanStatus = document.createElement('span');
            spanStatus.className = `inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
            spanStatus.textContent = status;
            td3.appendChild(spanStatus);

            const td4 = document.createElement('td');
            td4.className = tdClassMd;
            td4.textContent = formatarData(dataAtualizacao);

            const td5 = document.createElement('td');
            td5.className = 'px-4 py-3 text-center';
            td5.innerHTML = `
                <div class="flex gap-2 justify-center flex-wrap">
                    <button type="button" class="btn-editar text-blue-600 hover:text-blue-800 text-xs font-medium" data-id="${ppcId}">
                        Editar
                    </button>
                    <button type="button" class="btn-duplicar text-green-600 hover:text-green-800 text-xs font-medium" data-id="${ppcId}">
                        Duplicar
                    </button>
                    <button type="button" class="btn-deletar text-red-600 hover:text-red-800 text-xs font-medium" data-id="${ppcId}">
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

        // Registra event listeners
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

    // Botão "Novo PPC" - redireciona para forms.html sem ID (novo PPC)
    if (btnNovoPPC) {
        btnNovoPPC.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'forms.html';
        });
    }

    // Botão "Criar PPC" no estado vazio
    if (btnCriarPPCVazio) {
        btnCriarPPCVazio.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'forms.html';
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
            deletarPPCViaAPI(ppcIdModal);
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

    docucarregarPPCsDoBackendtener('DOMContentLoaded', () => {
        renderizarTabela();
    });

})();
