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
    /* UTILITÁRIOS                                                          */
    /* ================================================================== */

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

    /**
     * Converte string de data ISO para timestamp numérico
     */
    function converterDataParaTimestamp(dataISO) {
        if (!dataISO) return Date.now();
        try {
            return new Date(dataISO).getTime();
        } catch {
            return Date.now();
        }
    }

    /**
     * Alterna o estado de loading de um botão.
     * Desabilita durante loading e reabilita ao finalizar.
     */
    function alternarLoadingBotao(botao, carregando, textCarregando = 'Carregando...') {
        if (!botao) return;
        if (carregando) {
            botao._textOriginal = botao.textContent;
            botao._loadingStart = Date.now();
            botao.disabled = true;
            botao.classList.add('opacity-70', 'cursor-not-allowed');
            botao.innerHTML = '<span class="inline-flex items-center gap-2"><svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>' + textCarregando + '</span>';
        } else {
            // Garante que o loading fique visível por pelo menos 500ms
            const tempoDecorrido = Date.now() - (botao._loadingStart || Date.now());
            const tempoRestante = Math.max(0, 500 - tempoDecorrido);
            
            setTimeout(() => {
                botao.disabled = false;
                botao.classList.remove('opacity-70', 'cursor-not-allowed');
                botao.textContent = botao._textOriginal || textCarregando;
            }, tempoRestante);
        }
    }

    /* ================================================================== */
    /* CARREGAMENTO DE DADOS DA API                                       */
    /* ================================================================== */

    /**
     * Carrega todos os PPCs do banco de dados via API
     * Executa automaticamente quando a página é carregada
     */
    async function carregarPPCsDaAPI() {
        try {
            const response = await fetch(`${API_BASE}/ppc`);
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar PPCs: ${response.status}`);
            }

            const dados = await response.json();

            // Mapeia os dados da API para o formato esperado pelo código
            ppcs = dados.map(ppc => ({
                id: ppc.id,
                nome: ppc.nome_curso || 'PPC sem nome',
                ano: new Date(ppc.data_ultima_atualizacao || new Date()).getFullYear(),
                status: ppc.status_curso || 'Rascunho',
                dataCriacao: converterDataParaTimestamp(ppc.data_criacao),
                dataAtualizacao: converterDataParaTimestamp(ppc.data_ultima_atualizacao),
                dados: {} // Dados completos do PPC (carregados quando necessário)
            }));

            renderizarTabela();
        } catch (erro) {
            console.error('Erro ao carregar PPCs da API:', erro);
            exibirNotificacao('Erro ao carregar lista de PPCs', 'erro');
            // Renderiza tabela vazia em caso de erro
            ppcs = [];
            renderizarTabela();
        }
    }

    /* ================================================================== */
    /* GERENCIAMENTO DE PPCs                                              */
    /* ================================================================== */

    /**
     * Cria um novo PPC no banco de dados via API
     * Aguarda a resposta e atualiza a lista
     */
    async function criarNovoPPCViaAPI() {
        try {
            alternarLoadingBotao(btnNovoPPC, true);

            const response = await fetch(`${API_BASE}/ppc/novo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome_curso: `Novo PPC ${ppcs.length + 1}`
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao criar PPC: ${response.status}`);
            }

            const novoPPC = await response.json();

            // Mapeia o PPC retornado da API para o formato interno
            const ppcFormatado = {
                id: novoPPC.id,
                nome: novoPPC.nome_curso || 'PPC sem nome',
                ano: new Date(novoPPC.data_ultima_atualizacao || new Date()).getFullYear(),
                status: novoPPC.status_curso || 'Rascunho',
                dataCriacao: converterDataParaTimestamp(novoPPC.data_criacao),
                dataAtualizacao: converterDataParaTimestamp(novoPPC.data_ultima_atualizacao),
                dados: {}
            };

            // Adiciona o PPC à lista
            ppcs.unshift(ppcFormatado); // Adiciona no início da lista
            renderizarTabela();

            exibirNotificacao('PPC criado com sucesso!', 'sucesso');
            console.log('Novo PPC criado:', ppcFormatado);

        } catch (erro) {
            console.error('Erro ao criar PPC via API:', erro);
            exibirNotificacao('Erro ao criar PPC', 'erro');
        } finally {
            alternarLoadingBotao(btnNovoPPC, false);
        }
    }

    /**
     * Duplica um PPC no banco de dados via API
     * Aguarda a resposta e atualiza a lista
     */
    async function duplicarPPCViaAPI(id) {
        try {
            alternarLoadingBotao(btnConfirmarAcao, true, 'Duplicando...');
            const response = await fetch(`${API_BASE}/ppc/${id}/duplicar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao duplicar PPC: ${response.status}`);
            }

            const ppcDuplicado = await response.json();

            // Mapeia o PPC retornado da API para o formato interno
            const ppcFormatado = {
                id: ppcDuplicado.id,
                nome: ppcDuplicado.nome_curso || 'PPC sem nome',
                ano: new Date(ppcDuplicado.data_ultima_atualizacao || new Date()).getFullYear(),
                status: ppcDuplicado.status_curso || 'Rascunho',
                dataCriacao: converterDataParaTimestamp(ppcDuplicado.data_criacao),
                dataAtualizacao: converterDataParaTimestamp(ppcDuplicado.data_ultima_atualizacao),
                dados: {}
            };

            // Adiciona o PPC à lista
            ppcs.unshift(ppcFormatado); // Adiciona no início da lista
            renderizarTabela();

            exibirNotificacao('PPC duplicado com sucesso!', 'sucesso');
            console.log('PPC duplicado:', ppcFormatado);

        } catch (erro) {
            console.error('Erro ao duplicar PPC via API:', erro);
            exibirNotificacao('Erro ao duplicar PPC', 'erro');
        } finally {
            alternarLoadingBotao(btnConfirmarAcao, false);
        }
    }

    /**
     * Cria um novo PPC vazio (DEPRECATED - usar criarNovoPPCViaAPI)
     * Mantido para compatibilidade, mas não é mais usado
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
    async function deletarPPC(id) {
        try {
            alternarLoadingBotao(btnConfirmarAcao, true, 'Excluindo...');
            const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:8000/api';
            
            // Verifica se o ID é longo o suficiente para ser um UUID do backend.
            // Se for um ID falso criado localmente (menor que 20 chars), apenas remove localmente.
            if (id.length > 20) {
                const resposta = await fetch(`${apiBase}/ppc/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!resposta.ok) {
                    const erro = await resposta.json().catch(() => ({}));
                    throw new Error(erro.detail || `Erro ${resposta.status}`);
                }
            }

            // Remove o item da lista
            ppcs = ppcs.filter(p => p.id !== id);
            renderizarTabela();
            
            if (typeof exibirNotificacao === 'function') {
                exibirNotificacao('PPC excluído com sucesso!', 'sucesso');
            } else {
                alert('PPC excluído com sucesso!');
            }

            fecharModalAcao();
        } catch (erro) {
            console.error('Erro ao deletar:', erro);
            if (typeof exibirNotificacao === 'function') {
                exibirNotificacao(`Erro ao excluir: ${erro.message}`, 'erro');
            } else {
                alert(`Erro ao excluir: ${erro.message}`);
            }
        } finally {
            alternarLoadingBotao(btnConfirmarAcao, false);
        }
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
            tr.className = 'border-b border-gray-200 hover:bg-gray-50 transition-colors';

            const tdClass = 'px-4 py-3';
            const tdClassHidden = 'px-4 py-3 hidden sm:table-cell';
            const tdClassMd = 'px-4 py-3 hidden md:table-cell';

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
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
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

    // Botão "Novo PPC" - cria um novo PPC via API
    if (btnNovoPPC) {
        btnNovoPPC.addEventListener('click', () => {
            criarNovoPPCViaAPI();
        });
    }

    // Botão "Criar PPC" no estado vazio
    if (btnCriarPPCVazio) {
        btnCriarPPCVazio.addEventListener('click', (e) => {
            e.preventDefault();
            criarNovoPPCViaAPI();
        });
    }

    function fecharModalAcao() {
        modalAcao.classList.add('hidden');
        acaoModal = null;
        ppcIdModal = null;
    }

    // Listeners do modal
    btnCancelarAcao.addEventListener('click', fecharModalAcao);

    btnConfirmarAcao.addEventListener('click', async () => {
        if (acaoModal === 'delete') {
            await deletarPPC(ppcIdModal);
        } else if (acaoModal === 'duplicate') {
            await duplicarPPCViaAPI(ppcIdModal);
            fecharModalAcao();
        }
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
        // Carrega os PPCs da API automaticamente quando a página é carregada
        carregarPPCsDaAPI();
    });

})();
