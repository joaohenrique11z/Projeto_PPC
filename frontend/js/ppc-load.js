/**
 * ppc-load.js — Carregamento e população automática de formulários
 * 
 * Responsabilidades:
 *  - Detectar se há ID na URL (?id=ppc_id)
 *  - Carregar dados do PPC da API
 *  - Popular campos do formulário
 *  - Popular tabelas CRUD (componentes, membros, docentes, ambientes)
 *  - Atualizar título da página
 */

(function () {
    'use strict';

    let ppcIdAtual = null;
    let modoEdicao = false;

    /* ================================================================== */
    /* DETECÇÃO DE URL PARAMETER                                          */
    /* ================================================================== */

    /**
     * Extrai o ID do PPC da URL (?id=...)
     */
    function obterPPCIdDaURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    /* ================================================================== */
    /* CARREGAMENTO DE DADOS                                              */
    /* ================================================================== */

    /**
     * Carrega PPC e preenche formulário
     */
    async function carregarPPC(ppcId) {
        try {
            // Mostra loading visual
            const msg = document.querySelector('[class*="text-gray-500"]');
            if (msg) msg.textContent = 'Carregando dados do PPC...';

            // Busca todos os dados
            const dadosCompletos = await obterPPCCompleto(ppcId);
            
            // Armazena modo de edição
            modoEdicao = true;
            ppcIdAtual = ppcId;

            // Popula formulário principal
            preencherFormularioPrincipal(dadosCompletos.ppc);

            // Popula estado global com dados das tabs
            if (typeof estadoPPC !== 'undefined') {
                estadoPPC.ppc_id = ppcId;
                estadoPPC.membros = dadosCompletos.membros || [];
                estadoPPC.docentes = dadosCompletos.docentes || [];
                estadoPPC.componentes = dadosCompletos.componentes || [];
                estadoPPC.ambientes = dadosCompletos.ambientes || [];

                // Se existe coordenação, popula separadamente
                if (dadosCompletos.coordenacao) {
                    estadoPPC.coordenacao = [dadosCompletos.coordenacao];
                }
            }

            // Re-renderiza as tabelas CRUD
            aguardarERenderizarTabelas();

            // Atualiza título/header
            atualizarHeaderPPC(dadosCompletos.ppc.nome_curso || 'PPC Carregado');

            // Marca formulário como sendo de edição
            marcarModoEdicao();

            exibirNotificacao('PPC carregado com sucesso!', 'sucesso');

        } catch (erro) {
            console.error('Erro ao carregar PPC:', erro);
            exibirNotificacao('Erro ao carregar PPC. Funcionando em modo novo.', 'erro');
            
            // Continua em modo "novo PPC" mesmo com erro
            modoEdicao = false;
        }
    }

    /**
     * Aguarda as funções CRUD estarem prontas e re-renderiza tabelas
     */
    function aguardarERenderizarTabelas() {
        // Aguarda um tick para garantir que os scripts estão carregados
        setTimeout(() => {
            try {
                // Renderiza tabelas se as funções existem
                if (typeof renderizarTabelaMembros === 'function') {
                    renderizarTabelaMembros();
                }
                if (typeof renderizarTabelaDocentes === 'function') {
                    renderizarTabelaDocentes();
                }
                if (typeof renderizarTabelaComponentes === 'function') {
                    renderizarTabelaComponentes();
                }
                if (typeof renderizarTabelaAmbientes === 'function') {
                    renderizarTabelaAmbientes();
                }
            } catch (e) {
                console.warn('Não foi possível renderizar todas as tabelas:', e);
            }
        }, 500);
    }

    /**
     * Atualiza o header com nome do PPC
     */
    function atualizarHeaderPPC(nomeCurso) {
        // Tenta atualizar título da página
        const headerTitle = document.querySelector('h1, [class*="title"]');
        if (headerTitle) {
            headerTitle.textContent = nomeCurso;
        }

        // Atualiza o title da página
        document.title = `${nomeCurso} - PPC`;
    }

    /**
     * Marca o formulário como em modo de edição
     * (pode adicionar visual cues, desabilitar botão "novo", etc)
     */
    function marcarModoEdicao() {
        // Armazena o modo em um atributo data do body
        document.body.setAttribute('data-modo-edicao', 'true');
        document.body.setAttribute('data-ppc-id', ppcIdAtual);

        // Pode adicionar indicador visual
        const indicator = document.createElement('span');
        indicator.className = 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded';
        indicator.textContent = 'Modo: Edição';
        indicator.id = 'modo-indicator';

        // Tenta inserir após título
        const header = document.querySelector('h1, [class*="title"]');
        if (header && !document.getElementById('modo-indicator')) {
            header.parentElement.insertBefore(indicator, header.nextSibling);
        }
    }

    /* ================================================================== */
    /* INICIALIZAÇÃO                                                       */
    /* ================================================================== */

    /**
     * Inicializa o carregamento automático
     */
    function inicializar() {
        // Aguarda DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', iniciar);
        } else {
            iniciar();
        }
    }

    function iniciar() {
        const ppcId = obterPPCIdDaURL();

        if (ppcId) {
            // Se tem ID na URL, carrega PPC
            carregarPPC(ppcId);
        } else {
            // Modo "novo PPC" - nada a fazer, formulário já está vazio
            modoEdicao = false;
            console.log('Modo: Novo PPC');
        }
    }

    /* ================================================================== */
    /* EXPORTA FUNÇÕES GLOBAIS                                             */
    /* ================================================================== */

    // Torna funções disponíveis globalmente para uso em scripts posteriores
    window.ppcLoad = {
        ppcIdAtual: () => ppcIdAtual,
        modoEdicao: () => modoEdicao,
        obterModoEdicao: () => modoEdicao,
        obterPPCId: () => ppcIdAtual
    };

    // Inicia carregamento
    inicializar();

})();
