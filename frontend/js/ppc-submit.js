/**
 * ppc-submit.js — Coleta os dados do formulário e envia para a API
 * Sistema Gerador de PPC — IFPE Campus Belo Jardim
 *
 * Depende de:
 *   - window.__componentesState  (exposto pelo componentes.js após cada add/edit/remove)
 *   - window.__crudState         (exposto pelo crud.js após cada add/edit/remove)
 */

(function () {
    'use strict';

    /**
     * Lê um campo de texto do DOM pelo id.
     * @param {string} id
     * @returns {string|null}
     */
    function getText(id) {
        return document.getElementById(id)?.value?.trim() || null;
    }

    /**
     * Lê um campo numérico do DOM pelo id.
     * @param {string} id
     * @returns {number|null}
     */
    function getInt(id) {
        const val = parseInt(document.getElementById(id)?.value, 10);
        return isNaN(val) ? null : val;
    }

    /**
     * Monta o objeto ppc com todos os dados do curso preenchidos nos forms.
     * @returns {Object}
     */
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
            // O HTML usa 'area_conhecimento' e 'eixo_tecnologico' para o mesmo campo
            area_conhecimento:            getText('area_conhecimento') || getText('eixo_tecnologico'),
            nivel:                        getText('nivel'),
            modalidade_curso:             getText('modalidade_curso'),
            // 'tipo_curso' no HTML equivale a 'titulacao' no modelo
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

    /**
     * Coleta os dados do coordenador do curso a partir dos campos do formulário.
     * Retorna null se o nome do coordenador não foi preenchido.
     * @returns {Object|null}
     */
    function buildCoordenacao() {
        const nome = getText('coord_nome');
        if (!nome) return null;

        return {
            nome_professor:          nome,
            regime_trabalho:         getText('coord_regime_trabalho'),
            ch_semanal_coordenacao:  getInt('coord_ch_semanal'),
            tempo_exercicio_ies:     getText('coord_tempo_ies'),
            tempo_coordenacao_curso: getText('coord_tempo_curso'),
            qualificacao:            getText('coord_qualificacao'),
            titulacao:               getText('coord_titulacao'),
            grupos_pesquisa:         getText('coord_grupos_pesquisa'),
            linhas_pesquisa:         getText('coord_linhas_pesquisa'),
            experiencia_profissional: getInt('coord_exp_profissional'),
            experiencia_gestao:      getText('coord_exp_gestao'),
            email:                   getText('coord_email'),
        };
    }

    /**
     * Monta o payload completo lendo os estados globais expostos pelos outros módulos.
     * @returns {Object}
     */
    function buildPayload() {
        const crudState = window.__crudState || { membros: [], docentes: [], ambientes: [] };
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

    /**
     * Envia o payload para a API e trata sucesso/erro.
     */
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

        // Log para depuração — remove antes de ir para produção
        console.log('[ppc-submit] Payload a enviar:', JSON.stringify(payload, null, 2));

        try {
            const response = await fetch('http://localhost:8000/api/ppc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Erro HTTP ${response.status}`);
            }

            // Sucesso — redireciona para a listagem
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

    /**
     * Aguarda o evento 'ppc:submit' despachado pelo validation.js
     * somente após todas as validações terem passado.
     * O botão "Enviar PPC" NÃO abre o modal de confirmação diretamente —
     * isso é responsabilidade exclusiva do validation.js.
     */
    document.addEventListener('DOMContentLoaded', function () {
        document.addEventListener('ppc:submit', submeterPPC);
    });

})();
