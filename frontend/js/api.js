/**
 * api.js — Integração dos formulários com o backend FastAPI + Supabase
 *
 * Como usar:
 *   1. Copie este arquivo para  frontend/js/api.js
 *   2. Adicione no final do index.html, antes de </body>:
 *        <script src="js/api.js"></script>
 *
 * Se estiver rodando o backend localmente use:
 *   const API_BASE = 'http://localhost:8000/api'
 * Em produção substitua pela URL do seu servidor.
 */

const API_BASE = 'http://localhost:8000/api';

// ─────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────

/** ID do PPC atual — gerado no primeiro envio e reutilizado nas demais seções */
let ppcId = localStorage.getItem('ppc_id_atual') || null;

function salvarPpcId(id) {
  ppcId = id;
  localStorage.setItem('ppc_id_atual', id);
}

function mostrarNotificacao(msg, tipo = 'sucesso') {
  const cores = {
    sucesso: 'bg-green-600',
    erro:    'bg-red-600',
    info:    'bg-blue-600',
  };
  const notif = document.createElement('div');
  notif.className = `fixed top-4 right-4 z-50 px-5 py-3 rounded shadow-lg text-white text-sm font-medium ${cores[tipo]}`;
  notif.textContent = msg;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3500);
}

function setCarregando(btn, carregando) {
  if (!btn) return;
  btn.disabled = carregando;
  btn.dataset.textoOriginal = btn.dataset.textoOriginal || btn.textContent;
  btn.textContent = carregando ? 'Salvando...' : btn.dataset.textoOriginal;
}

async function chamarAPI(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}`);
  }
  // 204 No Content não tem body
  if (res.status === 204) return null;
  return res.json();
}


// ─────────────────────────────────────────────────────────────
// Card 1 + Card 2 + Card 3 — Botão "Enviar PPC"
// Coleta os três formulários e faz um único POST /api/ppc
// ─────────────────────────────────────────────────────────────

function coletarDadosPPC() {
  const v = (id) => document.getElementById(id)?.value?.trim() || null;
  const n = (id) => {
    const val = parseInt(document.getElementById(id)?.value);
    return isNaN(val) ? null : val;
  };

  return {
    // Proponente (Card 1)
    campus_name:         v('campus_name'),
    cnpj:                v('cnpj'),
    cep:                 v('cep'),
    cidade:              v('cidade'),
    bairro:              v('bairro'),
    rua:                 v('rua'),
    numero:              v('numero'),
    telefone_fax:        v('telefone_fax'),
    email_contato:       v('email_contato'),
    ato_legal:           v('ato_legal'),
    sitio_web:           v('sitio'),

    // Curso (Card 2)
    nome_curso:                    v('nome_curso'),
    area_conhecimento:             v('eixo_tecnologico'),
    nivel:                         v('tipo_curso'),
    modalidade_curso:              v('modalidade_curso'),
    titulacao:                     v('titulacao'),
    atividades_complementares:     n('atividades_complementares'),
    integralizacao_min_semestres:  n('integralizacao_min_semestres'),
    integralizacao_max_semestres:  n('integralizacao_max_semestres'),
    formas_acesso:                 v('formas_acesso'),
    pre_requisito_ingresso:        v('pre_requisito_ingresso'),
    vagas_turno:                   n('vagas_turno'),
    vagas_anuais:                  n('vagas_semestre'),
    turnos:                        v('turnos'),
    regime_matricula:              v('regime'),
    semanas_letivas:               n('semanas_letivas'),
    ch_extensao:                   n('ch_estagio'),   // campo ch_estagio -> ch_extensao no BD

    // Situação (Card 3)
    conceito_cc:      v('conceito_cc'),
    conceito_cpc:     v('conceito_cpc'),
    conceito_enade:   v('conceito_enade'),
    igc:              v('igc'),
    tipo_reformulacao: v('situacao_curso'),
    status_curso:     v('status_curso'),
  };
}

async function enviarPPC(btn) {
  setCarregando(btn, true);
  try {
    const dados = coletarDadosPPC();

    let resposta;
    if (ppcId) {
      // Já existe um PPC — atualiza
      resposta = await chamarAPI('PUT', `/ppc/${ppcId}`, dados);
      mostrarNotificacao('PPC atualizado com sucesso! ✓');
    } else {
      // Primeiro envio — cria
      resposta = await chamarAPI('POST', '/ppc', dados);
      salvarPpcId(resposta.data[0].id);
      mostrarNotificacao('PPC criado com sucesso! ✓');
    }
  } catch (err) {
    mostrarNotificacao(`Erro ao salvar PPC: ${err.message}`, 'erro');
    console.error(err);
  } finally {
    setCarregando(btn, false);
  }
}


// ─────────────────────────────────────────────────────────────
// Card 4 — Componentes Curriculares
// Sobrescreve o submit do form-componente para também salvar no BD
// ─────────────────────────────────────────────────────────────

function coletarDadosComponente() {
  const v = (id) => document.getElementById(id)?.value?.trim() || null;
  const n = (id) => parseInt(document.getElementById(id)?.value) || 0;

  const preReq  = v('pre_requisitos');
  const coReq   = v('correquisitos');

  return {
    ppc_id:         ppcId,
    codigo:         v('comp_codigo'),
    nome:           v('comp_nome'),
    tipo:           v('comp_tipo'),
    periodo:        parseInt(v('comp_periodo')),
    creditos:       n('creditos_praticas') + n('creditos_teoricas') + n('creditos_extensao'),
    ch_pratica:     n('horas_praticas'),
    ch_teorica:     n('horas_teoricas'),
    ch_extensao:    n('horas_extensao'),
    ch_total_aula:  n('horas_praticas') + n('horas_teoricas') + n('horas_extensao'),
    _preReq:        preReq || null,   // usado internamente p/ criar dependência
    _coReq:         coReq  || null,
  };
}

/**
 * Mapa  código -> id  dos componentes já salvos no BD,
 * para criar as dependências corretamente.
 */
const codigoParaId = {};

async function salvarComponenteNoBD(dadosForm) {
  if (!ppcId) {
    mostrarNotificacao('Salve o PPC principal primeiro antes de adicionar componentes.', 'info');
    return null;
  }

  const { _preReq, _coReq, ...dadosBD } = dadosForm;

  // Salva o componente
  const res = await chamarAPI('POST', '/componentes', dadosBD);
  const comp = res.data[0];
  codigoParaId[comp.codigo] = comp.id;

  // Cria dependências se houver
  if (_preReq && codigoParaId[_preReq]) {
    await chamarAPI('POST', '/dependencias', {
      componente_base_id: comp.id,
      componente_alvo_id: codigoParaId[_preReq],
      tipo_vinculo: 'Pre_Requisito',
    }).catch(() => {}); // não bloqueia se falhar
  }
  if (_coReq && codigoParaId[_coReq]) {
    await chamarAPI('POST', '/dependencias', {
      componente_base_id: comp.id,
      componente_alvo_id: codigoParaId[_coReq],
      tipo_vinculo: 'Co_Requisito',
    }).catch(() => {});
  }

  return comp;
}


// ─────────────────────────────────────────────────────────────
// Inicialização — conecta os listeners quando o DOM estiver pronto
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Botão "Enviar PPC" (rodapé da página) ──────────────────
  const btnEnviar = document.querySelector('button[type="submit"]:not(#btn-adicionar)');
  if (btnEnviar) {
    // Remove o type="submit" para não tentar submeter um form inexistente
    btnEnviar.type = 'button';
    btnEnviar.addEventListener('click', () => enviarPPC(btnEnviar));
  }


  // ── Formulário de componente curricular ────────────────────
  const formComp = document.getElementById('form-componente');
  if (formComp) {
    // Intercepta DEPOIS do listener já existente em componentes.js
    // usando capture: false (mesma fase) e verificando se o form é válido
    formComp.addEventListener('submit', async (e) => {
      // Não precisa de preventDefault — componentes.js já fez isso.
      // Coleta os dados ANTES de o formulário ser limpo pelo componentes.js
      const dados = coletarDadosComponente();
      if (!dados.codigo || !dados.nome || !dados.periodo) return;

      try {
        const comp = await salvarComponenteNoBD(dados);
        if (comp) mostrarNotificacao(`Componente "${comp.nome}" salvo! ✓`);
      } catch (err) {
        mostrarNotificacao(`Erro ao salvar componente: ${err.message}`, 'erro');
        console.error(err);
      }
    });
  }


  // ── Indicador de PPC em andamento ──────────────────────────
  if (ppcId) {
    const header = document.querySelector('header');
    if (header) {
      const badge = document.createElement('p');
      badge.className = 'text-xs text-green-600 dark:text-green-400 mt-1';
      badge.textContent = `📌 PPC em edição: ${ppcId.slice(0, 8)}...`;
      header.appendChild(badge);
    }
  }
});