/**
 * crud.js — CRUD de Membros Institucionais, Docentes, Ambientes e Itens de Infraestrutura
 * Sistema Gerador de PPC — IFPE Campus Belo Jardim
 *
 * Responsabilidades:
 *  - Renderizar tabelas dinâmicas (membros, docentes, ambientes, itens)
 *  - Gerenciar estado (arrays em memória) de cada entidade
 *  - Capturar submissão dos formulários via event listeners
 *  - Remover registros individualmente
 *  - Manter sincronização do <select> de ambientes no formulário de itens
 */

(function () {
    'use strict';

    /* ================================================================== */
    /* UTILITÁRIOS DE TABELA                                               */
    /* ================================================================== */

    /**
     * Cria o HTML de uma célula <td> com borda à direita (coluna não-final).
     * @param {string} content - Conteúdo HTML ou texto da célula.
     * @returns {string}
     */
    function tdBorder(content) {
        return `<td class="py-2 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300">${content}</td>`;
    }

    /**
     * Cria o HTML da última célula <td> de uma linha (sem borda à direita).
     * @param {string} content - Conteúdo HTML ou texto da célula.
     * @returns {string}
     */
    function tdLast(content) {
        return `<td class="py-2 px-3 dark:text-gray-300">${content}</td>`;
    }

    /**
     * Retorna as classes CSS padrão para linhas de tabela.
     * @returns {string}
     */
    function trClass() {
        return 'border-b border-gray-200 dark:border-gray-700';
    }

    /* ================================================================== */
    /* MEMBROS INSTITUCIONAIS                                              */
    /* Tabela: #tabela-membros / #membros-body                            */
    /* Formulário: #form-membro                                           */
    /* ================================================================== */

    const formMembro   = document.getElementById('form-membro');
    const membrosBody  = document.getElementById('membros-body');
    const membrosEmpty = document.getElementById('membros-empty-msg');

    /** @type {Array<{tipo: string, cargo: string, nome: string}>} */
    let membros = [];

    /** Renderiza (ou atualiza) a tabela de membros institucionais. */
    function renderMembros() {
        membrosBody.innerHTML = '';
        membrosEmpty && membrosEmpty.classList.toggle('hidden', membros.length > 0);

        membros.forEach((m, i) => {
            const tr = document.createElement('tr');
            tr.className = trClass();
            tr.innerHTML =
                tdBorder(m.tipo) +
                tdBorder(m.cargo) +
                tdBorder(m.nome) +
                tdLast(
                    `<button type="button" data-idx="${i}"
                        class="btn-rm-membro text-red-600 hover:text-red-800 text-xs font-medium">
                        Remover
                    </button>`
                );
            membrosBody.appendChild(tr);
        });

        // Registra listeners de remoção após renderizar
        membrosBody.querySelectorAll('.btn-rm-membro').forEach(btn => {
            btn.addEventListener('click', () => {
                membros.splice(Number(btn.dataset.idx), 1);
                renderMembros();
            });
        });
    }

    /** Listener de submissão: adiciona um membro à lista e re-renderiza. */
    if (formMembro) {
        formMembro.addEventListener('submit', e => {
            e.preventDefault();
            membros.push({
                tipo:  document.getElementById('membro_tipo').value,
                cargo: document.getElementById('membro_cargo').value,
                nome:  document.getElementById('membro_nome').value,
            });
            renderMembros();
            formMembro.reset();
        });
    }

    /* ================================================================== */
    /* DOCENTES                                                            */
    /* Tabela: #tabela-docentes / #docentes-body                          */
    /* Formulário: #form-docente                                          */
    /* ================================================================== */

    const formDocente   = document.getElementById('form-docente');
    const docentesBody  = document.getElementById('docentes-body');
    const docentesEmpty = document.getElementById('docentes-empty-msg');

    /**
     * @type {Array<{nome: string, titulacao: string, regime: string,
     *               exp_docencia: number, lattes: string, formacao: string}>}
     */
    let docentes = [];

    /** Renderiza (ou atualiza) a tabela de docentes. */
    function renderDocentes() {
        docentesBody.innerHTML = '';
        docentesEmpty && docentesEmpty.classList.toggle('hidden', docentes.length > 0);

        docentes.forEach((d, i) => {
            const lattesLink = d.lattes
                ? `<a href="${d.lattes}" target="_blank" rel="noopener"
                      class="text-blue-600 underline text-xs">Ver</a>`
                : '—';

            const tr = document.createElement('tr');
            tr.className = trClass();
            tr.innerHTML =
                tdBorder(d.nome) +
                tdBorder(d.titulacao || '—') +
                tdBorder(d.regime    || '—') +
                tdBorder((d.exp_docencia || 0) + ' anos') +
                tdBorder(lattesLink) +
                tdLast(
                    `<button type="button" data-idx="${i}"
                        class="btn-rm-docente text-red-600 hover:text-red-800 text-xs font-medium">
                        Remover
                    </button>`
                );
            docentesBody.appendChild(tr);
        });

        docentesBody.querySelectorAll('.btn-rm-docente').forEach(btn => {
            btn.addEventListener('click', () => {
                docentes.splice(Number(btn.dataset.idx), 1);
                renderDocentes();
            });
        });
    }

    /** Listener de submissão: adiciona um docente à lista e re-renderiza. */
    if (formDocente) {
        formDocente.addEventListener('submit', e => {
            e.preventDefault();
            docentes.push({
                nome:         document.getElementById('doc_nome').value,
                titulacao:    document.getElementById('doc_titulacao').value,
                regime:       document.getElementById('doc_regime').value,
                exp_docencia: document.getElementById('doc_exp_docencia').value || 0,
                lattes:       document.getElementById('doc_lattes').value,
                formacao:     document.getElementById('doc_formacao').value,
            });
            renderDocentes();
            formDocente.reset();
        });
    }

    /* ================================================================== */
    /* AMBIENTES                                                           */
    /* Tabela: #tabela-ambientes / #ambientes-body                        */
    /* Formulário: #form-ambiente                                         */
    /* Select vinculado: #item_ambiente_ref (formulário de itens)         */
    /* ================================================================== */

    const formAmbiente   = document.getElementById('form-ambiente');
    const ambientesBody  = document.getElementById('ambientes-body');
    const ambientesEmpty = document.getElementById('ambientes-empty-msg');
    const selectAmbRef   = document.getElementById('item_ambiente_ref');

    /**
     * @type {Array<{categoria: string, nome: string,
     *               quantidade: number, area_m2: string}>}
     */
    let ambientes = [];

    /**
     * Renderiza a tabela de ambientes e sincroniza o <select> de
     * referência de ambiente no formulário de itens de infraestrutura.
     */
    function renderAmbientes() {
        ambientesBody.innerHTML = '';
        ambientesEmpty && ambientesEmpty.classList.toggle('hidden', ambientes.length > 0);

        // Reseta o select de referência mantendo o placeholder
        if (selectAmbRef) {
            selectAmbRef.innerHTML = '<option value="">Selecione um ambiente...</option>';
        }

        ambientes.forEach((a, i) => {
            const tr = document.createElement('tr');
            tr.className = trClass();
            tr.innerHTML =
                tdBorder(a.categoria) +
                tdBorder(a.nome) +
                tdBorder(a.quantidade) +
                tdBorder(a.area_m2 ? `${a.area_m2} m²` : '—') +
                tdLast(
                    `<button type="button" data-idx="${i}"
                        class="btn-rm-amb text-red-600 hover:text-red-800 text-xs font-medium">
                        Remover
                    </button>`
                );
            ambientesBody.appendChild(tr);

            // Adiciona opção ao select de referência
            if (selectAmbRef) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = a.nome;
                selectAmbRef.appendChild(opt);
            }
        });

        ambientesBody.querySelectorAll('.btn-rm-amb').forEach(btn => {
            btn.addEventListener('click', () => {
                ambientes.splice(Number(btn.dataset.idx), 1);
                renderAmbientes();
            });
        });
    }

    /** Listener de submissão: adiciona um ambiente à lista e re-renderiza. */
    if (formAmbiente) {
        formAmbiente.addEventListener('submit', e => {
            e.preventDefault();
            ambientes.push({
                categoria:  document.getElementById('amb_categoria').value,
                nome:       document.getElementById('amb_nome').value,
                quantidade: parseInt(document.getElementById('amb_quantidade').value) || 1,
                area_m2:    document.getElementById('amb_area_m2').value,
            });
            renderAmbientes();
            formAmbiente.reset();
            // Restaura valor padrão do campo quantidade após reset
            const qEl = document.getElementById('amb_quantidade');
            if (qEl) qEl.value = 1;
        });
    }

    /* ================================================================== */
    /* ITENS DE INFRAESTRUTURA                                            */
    /* Tabela: #tabela-itens-infra / #itens-infra-body                   */
    /* Formulário: #form-item-infra                                       */
    /* ================================================================== */

    const formItemInfra = document.getElementById('form-item-infra');
    const itensBody     = document.getElementById('itens-infra-body');
    const itensEmpty    = document.getElementById('itens-empty-msg');

    /**
     * @type {Array<{ambiente_idx: number, tipo: string, nome: string,
     *               quantidade: number, especificacoes: string}>}
     */
    let itensInfra = [];

    /** Renderiza (ou atualiza) a tabela de itens de infraestrutura. */
    function renderItens() {
        itensBody.innerHTML = '';
        itensEmpty && itensEmpty.classList.toggle('hidden', itensInfra.length > 0);

        itensInfra.forEach((it, i) => {
            const ambNome = ambientes[it.ambiente_idx]
                ? ambientes[it.ambiente_idx].nome
                : '—';

            const tr = document.createElement('tr');
            tr.className = trClass();
            tr.innerHTML =
                tdBorder(ambNome) +
                tdBorder(it.tipo) +
                tdBorder(it.nome) +
                tdBorder(it.quantidade) +
                tdBorder(it.especificacoes || '—') +
                tdLast(
                    `<button type="button" data-idx="${i}"
                        class="btn-rm-item text-red-600 hover:text-red-800 text-xs font-medium">
                        Remover
                    </button>`
                );
            itensBody.appendChild(tr);
        });

        itensBody.querySelectorAll('.btn-rm-item').forEach(btn => {
            btn.addEventListener('click', () => {
                itensInfra.splice(Number(btn.dataset.idx), 1);
                renderItens();
            });
        });
    }

    /** Listener de submissão: adiciona um item à lista e re-renderiza. */
    if (formItemInfra) {
        formItemInfra.addEventListener('submit', e => {
            e.preventDefault();
            itensInfra.push({
                ambiente_idx:   parseInt(document.getElementById('item_ambiente_ref').value),
                tipo:           document.getElementById('item_tipo').value,
                nome:           document.getElementById('item_nome').value,
                quantidade:     parseInt(document.getElementById('item_quantidade').value) || 1,
                especificacoes: document.getElementById('item_especificacoes').value,
            });
            renderItens();
            formItemInfra.reset();
            // Restaura valor padrão do campo quantidade após reset
            const qEl = document.getElementById('item_quantidade');
            if (qEl) qEl.value = 1;
        });
    }

    /* ================================================================== */
    /* INICIALIZAÇÃO — renderiza listas vazias ao carregar a página       */
    /* ================================================================== */
    renderMembros();
    renderDocentes();
    renderAmbientes();
    renderItens();

})();
