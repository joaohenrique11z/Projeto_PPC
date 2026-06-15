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
     * Cria um elemento <td> com borda à direita (coluna não-final).
     * @param {string} text - Conteúdo em texto da célula.
     * @returns {HTMLTableCellElement}
     */
    function createTdBorder(text) {
        const td = document.createElement('td');
        td.className = 'py-2 px-3 border-r border-gray-200 dark:border-gray-700 dark:text-gray-300';
        td.textContent = text;
        return td;
    }

    /**
     * Cria o elemento da última célula <td> de uma linha (sem borda à direita).
     * @param {string} htmlContent - Conteúdo HTML da célula (botões).
     * @returns {HTMLTableCellElement}
     */
    function createTdLast(htmlContent) {
        const td = document.createElement('td');
        td.className = 'py-2 px-3 dark:text-gray-300';
        td.innerHTML = htmlContent;
        return td;
    }

    /**
     * Retorna as classes CSS padrão para linhas de tabela.
     * @returns {string}
     */
    function trClass() {
        return 'border-b border-gray-200 dark:border-gray-700';
    }

    /**
     * Sincroniza todos os arrays locais com a variável global
     * window.__crudState, usada pelo ppc-submit.js no momento do envio.
     * Os campos dos docentes são remapeados para os nomes esperados pelo backend.
     */
    function sincronizarCrudState() {
        window.__crudState = {
            membros: membros.map(m => ({
                tipo:  m.tipo,
                cargo: m.cargo,
                nome:  m.nome,
            })),
            docentes: docentes.map(d => ({
                nome:                      d.nome,
                formacao_academica:        d.formacao || null,
                regime_trabalho:           d.regime || null,
                titulacao:                 d.titulacao || null,
                experiencia_docencia_anos: parseInt(d.exp_docencia, 10) || 0,
                link_lattes:               d.lattes || null,
                componentes_ministrados:   d.componentes_ministrados || [],
            })),
            // Ambientes com itens aninhados pelo índice
            ambientes: ambientes.map((a, idx) => ({
                categoria:    a.categoria,
                nome_ambiente: a.nome,
                quantidade:   a.quantidade || 1,
                area_m2:      parseFloat(a.area_m2) || null,
                itens: itensInfra
                    .filter(item => item.ambiente_idx === idx)
                    .map(item => ({
                        tipo:           item.tipo,
                        nome_item:      item.nome,
                        quantidade:     item.quantidade || 1,
                        especificacoes: item.especificacoes || null,
                    })),
            })),
        };
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
    let editIndexMembro = -1;

    function cancelarEdicaoMembro() {
        editIndexMembro = -1;
        const submitBtn = document.getElementById('btn-adicionar-membro');
        if (submitBtn) {
            submitBtn.textContent = 'Adicionar Membro';
            submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            submitBtn.classList.add('bg-blue-700', 'hover:bg-blue-800');
        }
    }

    /** Renderiza (ou atualiza) a tabela de membros institucionais. */
    function renderMembros() {
        membrosBody.innerHTML = '';
        membrosEmpty && membrosEmpty.classList.toggle('hidden', membros.length > 0);

        membros.forEach((m, i) => {
            const tr = document.createElement('tr');
            tr.className = trClass();
            tr.appendChild(createTdBorder(m.tipo));
            tr.appendChild(createTdBorder(m.cargo));
            tr.appendChild(createTdBorder(m.nome));
            tr.appendChild(createTdLast(
                `<div class="flex gap-3">
                    <button type="button" data-idx="${i}" class="btn-edit-membro text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                    <button type="button" data-idx="${i}" class="btn-rm-membro text-red-600 hover:text-red-800 text-xs font-medium">Remover</button>
                </div>`
            ));
            membrosBody.appendChild(tr);
        });

        // Registra listeners de remoção após renderizar
        membrosBody.querySelectorAll('.btn-rm-membro').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                membros.splice(idx, 1);
                if (editIndexMembro === idx) {
                    cancelarEdicaoMembro();
                    formMembro.reset();
                } else if (editIndexMembro > idx) {
                    editIndexMembro--;
                }
                sincronizarCrudState();
                renderMembros();
            });
        });

        membrosBody.querySelectorAll('.btn-edit-membro').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.idx);
                const m = membros[i];
                document.getElementById('membro_tipo').value = m.tipo;
                document.getElementById('membro_cargo').value = m.cargo;
                document.getElementById('membro_nome').value = m.nome;
                editIndexMembro = i;
                const submitBtn = document.getElementById('btn-adicionar-membro');
                if (submitBtn) {
                    submitBtn.textContent = 'Atualizar Membro';
                    submitBtn.classList.remove('bg-blue-700', 'hover:bg-blue-800');
                    submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                }
                document.getElementById('membro_tipo').focus();
            });
        });
    }

    /** Listener de submissão: adiciona um membro à lista e re-renderiza. */
    if (formMembro) {
        formMembro.addEventListener('submit', e => {
            e.preventDefault();
            const novo = {
                tipo:  document.getElementById('membro_tipo').value,
                cargo: document.getElementById('membro_cargo').value,
                nome:  document.getElementById('membro_nome').value,
            };
            if (editIndexMembro === -1) {
                membros.push(novo);
            } else {
                membros[editIndexMembro] = novo;
                cancelarEdicaoMembro();
            }
            sincronizarCrudState();
            renderMembros();
            formMembro.reset();
        });

        formMembro.addEventListener('reset', () => {
            setTimeout(cancelarEdicaoMembro, 10);
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
     *               exp_docencia: number, lattes: string, formacao: string,
     *               componentes_ministrados: string[]}>}
     */
    let docentes = [];
    let editIndexDocente = -1;

    /**
     * Atualiza os checkboxes de componentes no formulário de docente
     * lendo window.__componentesState (exposto pelo componentes.js).
     * Preserva as seleções já feitas, se houver.
     *
     * @param {string[]} [selecionados=[]] - Códigos de componentes a pré-marcar (modo edição).
     */
    function atualizarCheckboxesComponentes(selecionados = []) {
        const container = document.getElementById('doc-componentes-lista');
        const msgVazio  = document.getElementById('doc-componentes-vazio');
        if (!container) return;

        const componentes = window.__componentesState || [];

        // Remove apenas os checkboxes anteriores, preservando a mensagem vazia
        container.querySelectorAll('label.comp-checkbox-label').forEach(el => el.remove());

        if (componentes.length === 0) {
            msgVazio && msgVazio.classList.remove('hidden');
            return;
        }

        msgVazio && msgVazio.classList.add('hidden');

        componentes.forEach(comp => {
            const label = document.createElement('label');
            label.className = 'comp-checkbox-label flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/30 rounded px-1';

            const checkbox = document.createElement('input');
            checkbox.type    = 'checkbox';
            checkbox.name    = 'doc_componentes';
            checkbox.value   = comp.codigo;
            checkbox.checked = selecionados.includes(comp.codigo);
            checkbox.className = 'rounded border-gray-300 text-blue-600 focus:ring-blue-500';

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`${comp.codigo} — ${comp.nome}`));
            container.appendChild(label);
        });
    }

    /** Lê os códigos dos componentes marcados no formulário de docente. */
    function coletarComponentesSelecionados() {
        return Array.from(
            document.querySelectorAll('#doc-componentes-lista input[name="doc_componentes"]:checked')
        ).map(cb => cb.value);
    }

    function cancelarEdicaoDocente() {
        editIndexDocente = -1;
        const submitBtn = document.getElementById('btn-adicionar-docente');
        if (submitBtn) {
            submitBtn.textContent = 'Adicionar Docente';
            submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            submitBtn.classList.add('bg-blue-700', 'hover:bg-blue-800');
        }
    }

    /** Renderiza (ou atualiza) a tabela de docentes. */
    function renderDocentes() {
        docentesBody.innerHTML = '';
        docentesEmpty && docentesEmpty.classList.toggle('hidden', docentes.length > 0);

        docentes.forEach((d, i) => {
            const tr = document.createElement('tr');
            tr.className = trClass();
            
            tr.appendChild(createTdBorder(d.nome));
            tr.appendChild(createTdBorder(d.titulacao || '—'));
            tr.appendChild(createTdBorder(d.regime || '—'));
            tr.appendChild(createTdBorder((d.exp_docencia || 0) + ' anos'));

            const lattesTd = createTdBorder('');
            if (d.lattes) {
                const a = document.createElement('a');
                a.href = d.lattes;
                a.target = '_blank';
                a.rel = 'noopener';
                a.className = 'text-blue-600 underline text-xs';
                a.textContent = 'Ver';
                lattesTd.appendChild(a);
            } else {
                lattesTd.textContent = '—';
            }
            tr.appendChild(lattesTd);

            tr.appendChild(createTdLast(
                `<div class="flex gap-3">
                    <button type="button" data-idx="${i}" class="btn-edit-docente text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                    <button type="button" data-idx="${i}" class="btn-rm-docente text-red-600 hover:text-red-800 text-xs font-medium">Remover</button>
                </div>`
            ));
            docentesBody.appendChild(tr);
        });

        docentesBody.querySelectorAll('.btn-rm-docente').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                docentes.splice(idx, 1);
                if (editIndexDocente === idx) {
                    cancelarEdicaoDocente();
                    formDocente.reset();
                } else if (editIndexDocente > idx) {
                    editIndexDocente--;
                }
                sincronizarCrudState();
                renderDocentes();
            });
        });

        docentesBody.querySelectorAll('.btn-edit-docente').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.idx);
                const d = docentes[i];
                document.getElementById('doc_nome').value = d.nome;
                document.getElementById('doc_titulacao').value = d.titulacao;
                document.getElementById('doc_regime').value = d.regime;
                document.getElementById('doc_exp_docencia').value = d.exp_docencia;
                document.getElementById('doc_lattes').value = d.lattes;
                document.getElementById('doc_formacao').value = d.formacao;
                // Restaura checkboxes dos componentes ministrados
                atualizarCheckboxesComponentes(d.componentes_ministrados || []);
                editIndexDocente = i;
                const submitBtn = document.getElementById('btn-adicionar-docente');
                if (submitBtn) {
                    submitBtn.textContent = 'Atualizar Docente';
                    submitBtn.classList.remove('bg-blue-700', 'hover:bg-blue-800');
                    submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                }
                document.getElementById('doc_nome').focus();
            });
        });
    }

    /** Listener de submissão: adiciona um docente à lista e re-renderiza. */
    if (formDocente) {
        formDocente.addEventListener('submit', e => {
            e.preventDefault();
            const novo = {
                nome:                    document.getElementById('doc_nome').value,
                titulacao:               document.getElementById('doc_titulacao').value,
                regime:                  document.getElementById('doc_regime').value,
                exp_docencia:            document.getElementById('doc_exp_docencia').value || 0,
                lattes:                  document.getElementById('doc_lattes').value,
                formacao:                document.getElementById('doc_formacao').value,
                componentes_ministrados: coletarComponentesSelecionados(),
            };
            if (editIndexDocente === -1) {
                docentes.push(novo);
            } else {
                docentes[editIndexDocente] = novo;
                cancelarEdicaoDocente();
            }
            sincronizarCrudState();
            renderDocentes();
            formDocente.reset();
            // Desmarca todos os checkboxes após reset
            atualizarCheckboxesComponentes([]);
        });

        formDocente.addEventListener('reset', () => {
            setTimeout(() => {
                cancelarEdicaoDocente();
                atualizarCheckboxesComponentes([]);
            }, 10);
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
    let editIndexAmbiente = -1;

    function cancelarEdicaoAmbiente() {
        editIndexAmbiente = -1;
        const submitBtn = document.getElementById('btn-adicionar-ambiente') || formAmbiente.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Adicionar Ambiente';
            submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            submitBtn.classList.add('bg-blue-700', 'hover:bg-blue-800');
        }
    }

    /**
     * Renderiza a tabela de ambientes e sincroniza o <select> de
     * referência de ambiente no formulário de itens de infraestrutura.
     */
    function renderAmbientes() {
        ambientesBody.innerHTML = '';
        ambientesEmpty && ambientesEmpty.classList.toggle('hidden', ambientes.length > 0);

        // Reseta o select de referência mantendo o placeholder
        if (selectAmbRef) {
            selectAmbRef.innerHTML = '<option value="">Selecione...</option>';
        }

        ambientes.forEach((a, i) => {
            const tr = document.createElement('tr');
            tr.className = trClass();
            tr.appendChild(createTdBorder(a.categoria));
            tr.appendChild(createTdBorder(a.nome));
            tr.appendChild(createTdBorder(a.quantidade));
            tr.appendChild(createTdBorder(a.area_m2 ? `${a.area_m2} m²` : '—'));
            tr.appendChild(createTdLast(
                `<div class="flex gap-3">
                    <button type="button" data-idx="${i}" class="btn-edit-amb text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                    <button type="button" data-idx="${i}" class="btn-rm-amb text-red-600 hover:text-red-800 text-xs font-medium">Remover</button>
                </div>`
            ));
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
                const idx = Number(btn.dataset.idx);
                ambientes.splice(idx, 1);
                if (editIndexAmbiente === idx) {
                    cancelarEdicaoAmbiente();
                    formAmbiente.reset();
                } else if (editIndexAmbiente > idx) {
                    editIndexAmbiente--;
                }
                
                // Remove todos os itens que dependem desse ambiente, e ajusta os índices
                itensInfra = itensInfra.filter(item => item.ambiente_idx !== idx).map(item => {
                    if (item.ambiente_idx > idx) item.ambiente_idx--;
                    return item;
                });
                sincronizarCrudState();
                renderItens();

                renderAmbientes();
            });
        });

        ambientesBody.querySelectorAll('.btn-edit-amb').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.idx);
                const a = ambientes[i];
                document.getElementById('amb_categoria').value = a.categoria;
                document.getElementById('amb_nome').value = a.nome;
                document.getElementById('amb_quantidade').value = a.quantidade;
                document.getElementById('amb_area_m2').value = a.area_m2;
                editIndexAmbiente = i;
                const submitBtn = document.getElementById('btn-adicionar-ambiente') || formAmbiente.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Atualizar Ambiente';
                    submitBtn.classList.remove('bg-blue-700', 'hover:bg-blue-800');
                    submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                }
                document.getElementById('amb_categoria').focus();
            });
        });
    }

    /** Listener de submissão: adiciona um ambiente à lista e re-renderiza. */
    if (formAmbiente) {
        formAmbiente.addEventListener('submit', e => {
            e.preventDefault();
            const novo = {
                categoria:  document.getElementById('amb_categoria').value,
                nome:       document.getElementById('amb_nome').value,
                quantidade: parseInt(document.getElementById('amb_quantidade').value) || 1,
                area_m2:    document.getElementById('amb_area_m2').value,
            };
            if (editIndexAmbiente === -1) {
                ambientes.push(novo);
            } else {
                ambientes[editIndexAmbiente] = novo;
                cancelarEdicaoAmbiente();
            }
            sincronizarCrudState();
            renderAmbientes();
            formAmbiente.reset();
            renderItens(); // Atualiza os nomes no select
            // Restaura valor padrão do campo quantidade após reset
            const qEl = document.getElementById('amb_quantidade');
            if (qEl) qEl.value = 1;
        });

        formAmbiente.addEventListener('reset', () => {
            setTimeout(cancelarEdicaoAmbiente, 10);
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
    let editIndexItem = -1;

    function cancelarEdicaoItem() {
        editIndexItem = -1;
        const submitBtn = document.getElementById('btn-adicionar-item') || formItemInfra.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Adicionar Item';
            submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            submitBtn.classList.add('bg-blue-700', 'hover:bg-blue-800');
        }
    }

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
            tr.appendChild(createTdBorder(ambNome));
            tr.appendChild(createTdBorder(it.tipo));
            tr.appendChild(createTdBorder(it.nome));
            tr.appendChild(createTdBorder(it.quantidade));
            tr.appendChild(createTdBorder(it.especificacoes || '—'));
            tr.appendChild(createTdLast(
                `<div class="flex gap-3">
                    <button type="button" data-idx="${i}" class="btn-edit-item text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                    <button type="button" data-idx="${i}" class="btn-rm-item text-red-600 hover:text-red-800 text-xs font-medium">Remover</button>
                </div>`
            ));
            itensBody.appendChild(tr);
        });

        itensBody.querySelectorAll('.btn-rm-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.idx);
                itensInfra.splice(idx, 1);
                if (editIndexItem === idx) {
                    cancelarEdicaoItem();
                    formItemInfra.reset();
                } else if (editIndexItem > idx) {
                    editIndexItem--;
                }
                sincronizarCrudState();
                renderItens();
            });
        });

        itensBody.querySelectorAll('.btn-edit-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = Number(btn.dataset.idx);
                const item = itensInfra[i];
                document.getElementById('item_ambiente_ref').value = item.ambiente_idx;
                document.getElementById('item_tipo').value = item.tipo;
                document.getElementById('item_nome').value = item.nome;
                document.getElementById('item_quantidade').value = item.quantidade;
                document.getElementById('item_especificacoes').value = item.especificacoes;
                editIndexItem = i;
                const submitBtn = document.getElementById('btn-adicionar-item') || formItemInfra.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Atualizar Item';
                    submitBtn.classList.remove('bg-blue-700', 'hover:bg-blue-800');
                    submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                }
                document.getElementById('item_ambiente_ref').focus();
            });
        });
    }

    /** Listener de submissão: adiciona um item à lista e re-renderiza. */
    if (formItemInfra) {
        formItemInfra.addEventListener('submit', e => {
            e.preventDefault();
            const novo = {
                ambiente_idx:   parseInt(document.getElementById('item_ambiente_ref').value),
                tipo:           document.getElementById('item_tipo').value,
                nome:           document.getElementById('item_nome').value,
                quantidade:     parseInt(document.getElementById('item_quantidade').value) || 1,
                especificacoes: document.getElementById('item_especificacoes').value,
            };
            if (editIndexItem === -1) {
                itensInfra.push(novo);
            } else {
                itensInfra[editIndexItem] = novo;
                cancelarEdicaoItem();
            }
            sincronizarCrudState();
            renderItens();
            formItemInfra.reset();
            // Restaura valor padrão do campo quantidade após reset
            const qEl = document.getElementById('item_quantidade');
            if (qEl) qEl.value = 1;
        });

        formItemInfra.addEventListener('reset', () => {
            setTimeout(cancelarEdicaoItem, 10);
        });
    }

    /* ================================================================== */
    /* INICIALIZAÇÃO — renderiza listas vazias ao carregar a página       */
    /* ================================================================== */
    renderMembros();
    renderDocentes();
    renderAmbientes();
    renderItens();

    // Popula os checkboxes de componentes imediatamente
    atualizarCheckboxesComponentes([]);

    // Atualiza a lista de componentes toda vez que a aba de docentes é ativada,
    // garantindo que componentes adicionados depois também apareçam na lista.
    document.querySelectorAll('[data-tab="corpo-docente"]').forEach(btn => {
        btn.addEventListener('click', () => {
            atualizarCheckboxesComponentes([]);
        });
    });

})();
