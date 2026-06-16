/**
 * ppc-submit.js — Coleta os dados do formulário e envia para a API
 * Sistema Gerador de PPC — IFPE Campus Belo Jardim
 *
 * Modos de operação:
 *   CRIAÇÃO — forms.html (sem ?id)  → POST /api/ppc
 *   EDIÇÃO  — forms.html?id={uuid} → GET  /api/ppc/{id} (carrega dados)
 *                                   → PUT  /api/ppc/{id} (salva alterações)
 *
 * Depende de:
 *   - window.__componentesState  (exposto pelo componentes.js)
 *   - window.__crudState         (exposto pelo crud.js)
 */

(function () {
    'use strict';

    /** UUID do PPC em edição. null = modo criação. */
    window.__ppcId = null;

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITÁRIOS DE LEITURA / ESCRITA DO DOM
    // ─────────────────────────────────────────────────────────────────────────

    function getText(id) {
        return document.getElementById(id)?.value?.trim() || null;
    }

    function getInt(id) {
        const val = parseInt(document.getElementById(id)?.value, 10);
        return isNaN(val) ? null : val;
    }

    /**
     * Define o valor de um campo do DOM pelo id.
     * Não lança erro se o elemento não existir.
     */
    function setField(id, value) {
        const el = document.getElementById(id);
        if (el && value !== null && value !== undefined) {
            el.value = value;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MONTAGEM DO PAYLOAD (leitura do DOM → objeto para a API)
    // ─────────────────────────────────────────────────────────────────────────

    function buildPPC() {
        return {
            campus_name:                  getText('campus_name'),
            cnpj:                         getText('cnpj'),
            cep:                          getText('cep'),
            cidade:                       getText('cidade'),
            bairro:                       getText('bairro'),
            rua:                          getText('rua'),
            numero:                       getText('numero'),
            telefone_fax:                 getText('telefone_fax'),
            email_contato:                getText('email_contato'),
            ato_legal:                    getText('ato_legal'),
            sitio_web:                    getText('sitio_web'),
            nome_curso:                   getText('nome_curso'),
            area_conhecimento:            getText('area_conhecimento') || getText('eixo_tecnologico'),
            nivel:                        getText('nivel'),
            modalidade_curso:             getText('modalidade_curso'),
            titulacao:                    getText('titulacao') || getText('tipo_curso'),
            ch_total_relogio:             getInt('ch_total_relogio'),
            ch_total_aula:                getInt('ch_total_aula'),
            duracao_aula_minutos:         getInt('duracao_aula_minutos'),
            atividades_complementares:    getInt('atividades_complementares'),
            ch_extensao:                  getInt('ch_extensao'),
            integralizacao_min_semestres: getInt('integralizacao_min_semestres'),
            integralizacao_max_semestres: getInt('integralizacao_max_semestres'),
            semanas_letivas:              getInt('semanas_letivas'),
            periodicidade_letiva:         getText('periodicidade_letiva'),
            inicio_curso:                 getText('inicio_curso'),
            matriz_curricular_alterada:   getText('matriz_curricular_alterada'),
            formas_acesso:                getText('formas_acesso'),
            pre_requisito_ingresso:       getText('pre_requisito_ingresso'),
            vagas_anuais:                 getInt('vagas_anuais'),
            vagas_turno:                  getInt('vagas_turno'),
            turnos:                       getText('turnos'),
            regime_matricula:             getText('regime_matricula'),
            cursos_tecnicos_afins:        getText('cursos_tecnicos_afins'),
            outros_cursos_campus:         getText('outros_cursos_campus'),
            conceito_cc:                  getText('conceito_cc'),
            conceito_cpc:                 getText('conceito_cpc'),
            conceito_enade:               getText('conceito_enade'),
            igc:                          getText('igc'),
            tipo_reformulacao:            getText('tipo_reformulacao'),
            status_curso:                 getText('status_curso'),
        };
    }

    function buildCoordenacao() {
        const nome = getText('coord_nome');
        if (!nome) return null;

        return {
            nome_professor:           nome,
            regime_trabalho:          getText('coord_regime_trabalho'),
            ch_semanal_coordenacao:   getInt('coord_ch_semanal'),
            tempo_exercicio_ies:      getText('coord_tempo_ies'),
            tempo_coordenacao_curso:  getText('coord_tempo_curso'),
            qualificacao:             getText('coord_qualificacao'),
            titulacao:                getText('coord_titulacao'),
            grupos_pesquisa:          getText('coord_grupos_pesquisa'),
            linhas_pesquisa:          getText('coord_linhas_pesquisa'),
            experiencia_profissional: getInt('coord_exp_profissional'),
            experiencia_gestao:       getText('coord_exp_gestao'),
            email:                    getText('coord_email'),
        };
    }

    function buildPayload() {
        const crudState  = window.__crudState || { membros: [], docentes: [], ambientes: [] };
        const componentes = window.__componentesState || [];

        return {
            ppc:         buildPPC(),
            coordenacao: buildCoordenacao(),
            membros:     crudState.membros,
            docentes:    crudState.docentes,
            componentes: componentes,
            ambientes:   crudState.ambientes,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CARREGAMENTO DE DADOS PARA EDIÇÃO (GET /api/ppc/{id})
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Popula os campos do formulário com os dados gerais do PPC.
     * @param {Object} ppc - Dados vindos do backend.
     */
    function popularCamposPPC(ppc) {
        const camposDiretos = [
            'campus_name', 'cnpj', 'cep', 'cidade', 'bairro', 'rua', 'numero',
            'telefone_fax', 'email_contato', 'ato_legal', 'sitio_web', 'nome_curso',
            'nivel', 'modalidade_curso', 'titulacao',
            'ch_total_relogio', 'ch_total_aula', 'duracao_aula_minutos',
            'atividades_complementares', 'ch_extensao',
            'integralizacao_min_semestres', 'integralizacao_max_semestres',
            'semanas_letivas', 'periodicidade_letiva', 'inicio_curso',
            'matriz_curricular_alterada', 'formas_acesso', 'pre_requisito_ingresso',
            'vagas_anuais', 'vagas_turno', 'turnos', 'regime_matricula',
            'cursos_tecnicos_afins', 'outros_cursos_campus',
            'conceito_cc', 'conceito_cpc', 'conceito_enade', 'igc',
            'tipo_reformulacao', 'status_curso',
        ];
        camposDiretos.forEach(campo => setField(campo, ppc[campo]));

        // Aliases usados em algumas versões do HTML
        setField('area_conhecimento', ppc.area_conhecimento);
        setField('eixo_tecnologico',  ppc.area_conhecimento);
        setField('tipo_curso',        ppc.nivel);
    }

    /**
     * Popula os campos de coordenação com os dados vindos do backend.
     * @param {Object} coord
     */
    function popularCamposCoordenacao(coord) {
        const mapa = {
            nome_professor:           'coord_nome',
            regime_trabalho:          'coord_regime_trabalho',
            ch_semanal_coordenacao:   'coord_ch_semanal',
            tempo_exercicio_ies:      'coord_tempo_ies',
            tempo_coordenacao_curso:  'coord_tempo_curso',
            qualificacao:             'coord_qualificacao',
            titulacao:                'coord_titulacao',
            grupos_pesquisa:          'coord_grupos_pesquisa',
            linhas_pesquisa:          'coord_linhas_pesquisa',
            experiencia_profissional: 'coord_exp_profissional',
            experiencia_gestao:       'coord_exp_gestao',
            email:                    'coord_email',
        };
        Object.entries(mapa).forEach(([apiCampo, domId]) => setField(domId, coord[apiCampo]));
    }

    /**
     * Carrega os dados de um PPC existente via GET e popula o formulário.
     * Despacha eventos customizados para que crud.js e componentes.js
     * populem seus estados internos.
     *
     * Componentes devem ser despachados ANTES dos docentes para que os
     * checkboxes de "componentes ministrados" sejam corretamente marcados.
     *
     * @param {string} id - UUID do PPC.
     */
    async function carregarDadosPPC(id) {
        // Exibe overlay de loading
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay-ppc';
        loadingOverlay.className = 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 bg-opacity-75 text-white transition-opacity';
        loadingOverlay.innerHTML = `
            <svg class="animate-spin h-12 w-12 mb-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 class="text-xl font-bold">Carregando dados do PPC...</h2>
            <p class="mt-2 text-sm text-gray-300">Por favor, aguarde.</p>
        `;
        document.body.appendChild(loadingOverlay);

        try {
            const response = await fetch(`http://localhost:8000/api/ppc/${id}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const dados = await response.json();

            popularCamposPPC(dados.ppc || {});

            if (dados.coordenacao) {
                popularCamposCoordenacao(dados.coordenacao);
            }

            document.dispatchEvent(new CustomEvent('ppc:dados-componentes', { detail: dados.componentes || [] }));
            document.dispatchEvent(new CustomEvent('ppc:dados-membros',     { detail: dados.membros     || [] }));
            document.dispatchEvent(new CustomEvent('ppc:dados-docentes',    { detail: dados.docentes    || [] }));
            document.dispatchEvent(new CustomEvent('ppc:dados-ambientes',   { detail: dados.ambientes   || [] }));

            console.log('[ppc-load] PPC carregado:', id);
            
            // Opcional: mostrar notificação de sucesso se a função existir
            if (typeof exibirNotificacao === 'function') {
                exibirNotificacao('Dados do PPC carregados com sucesso!', 'sucesso');
            }
        } catch (error) {
            console.error('[ppc-load] Erro ao carregar PPC:', error);
            alert(`Não foi possível carregar os dados do PPC:\n${error.message}`);
        } finally {
            // Remove o overlay de loading
            if (document.getElementById('loading-overlay-ppc')) {
                document.getElementById('loading-overlay-ppc').remove();
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUBMISSÃO (POST criação / PUT edição)
    // ─────────────────────────────────────────────────────────────────────────

    async function submeterPPC() {
        const btnConfirmar = document.getElementById('btn-confirmar-envio');

        if (btnConfirmar) {
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = `
                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
            `;
        }

        const payload = buildPayload();
        console.log('[ppc-submit] Payload:', JSON.stringify(payload, null, 2));

        // Modo edição → PUT; modo criação → POST
        const ppcId  = window.__ppcId;
        const url    = ppcId ? `http://localhost:8000/api/ppc/${ppcId}` : 'http://localhost:8000/api/ppc';
        const method = ppcId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Erro HTTP ${response.status}`);
            }

            window.location.href = 'index.html';

        } catch (error) {
            console.error('[ppc-submit] Erro ao enviar:', error);
            alert(`Ocorreu um erro ao salvar o PPC:\n${error.message}`);

            if (btnConfirmar) {
                btnConfirmar.disabled = false;
                btnConfirmar.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Confirmar Envio
                `;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INICIALIZAÇÃO
    // ─────────────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        // Escuta o evento disparado pelo validation.js após validação
        document.addEventListener('ppc:submit', submeterPPC);

        // Detecta modo de edição via ?id= na URL
        const params = new URLSearchParams(window.location.search);
        const ppcId  = params.get('id');

        if (ppcId) {
            window.__ppcId = ppcId;
            carregarDadosPPC(ppcId);
        }
    });

})();
