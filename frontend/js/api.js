/**
 * api.js — Integração com o backend dos colegas (PPCPayload)
 *
 * O backend espera UM único POST /api/ppc com esse formato:
 * {
 *   "ppc": { ...dados do curso... },
 *   "membros": [...],
 *   "coordenacao": {...},
 *   "docentes": [...],
 *   "componentes": [...],
 *   "ambientes": [...]
 * }
 *
 * Como usar:
 *   Adicione no final do forms.html, antes de </body>:
 *   <script src="js/api.js"></script>
 */

const API_BASE = 'http://localhost:8000/api';

// ─────────────────────────────────────────────────────────────
// Estado local — acumula os dados enquanto o usuário preenche
// ─────────────────────────────────────────────────────────────

const estadoPPC = {
  componentes: [],   // preenchidos no Card de componentes
  membros:     [],   // preenchidos no Card de membros
  docentes:    [],   // preenchidos no Card de docentes
  ambientes:   [],   // preenchidos no Card de infraestrutura
};

// ─────────────────────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────────────────────

function v(id) {
  return document.getElementById(id)?.value?.trim() || null;
}

function n(id) {
  const val = parseInt(document.getElementById(id)?.value);
  return isNaN(val) ? null : val;
}

function mostrarNotificacao(msg, tipo = 'sucesso') {
  const cores = { sucesso: 'bg-green-600', erro: 'bg-red-600', info: 'bg-blue-600' };
  const notif = document.createElement('div');
  notif.className = `fixed top-4 right-4 z-50 px-5 py-3 rounded shadow-lg text-white text-sm font-medium transition-all ${cores[tipo]}`;
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

// ─────────────────────────────────────────────────────────────
// Coleta os dados dos formulários
// ─────────────────────────────────────────────────────────────

function coletarPPC() {
  return {
    campus_name:                  v('campus_name'),
    cnpj:                         v('cnpj'),
    cep:                          v('cep'),
    cidade:                       v('cidade'),
    bairro:                       v('bairro'),
    rua:                          v('rua'),
    numero:                       v('numero'),
    telefone_fax:                 v('telefone_fax'),
    email_contato:                v('email_contato'),
    ato_legal:                    v('ato_legal'),
    sitio_web:                    v('sitio_web') || v('sitio'),
    nome_curso:                   v('nome_curso'),
    area_conhecimento:            v('eixo_tecnologico'),
    nivel:                        v('tipo_curso'),
    modalidade_curso:             v('modalidade_curso'),
    titulacao:                    v('titulacao'),
    atividades_complementares:    n('atividades_complementares'),
    integralizacao_min_semestres: n('integralizacao_min_semestres'),
    integralizacao_max_semestres: n('integralizacao_max_semestres'),
    formas_acesso:                v('formas_acesso'),
    pre_requisito_ingresso:       v('pre_requisito_ingresso'),
    vagas_turno:                  n('vagas_turno'),
    vagas_anuais:                 n('vagas_semestre') || n('vagas_anuais'),
    turnos:                       v('turnos'),
    regime_matricula:             v('regime') || v('regime_matricula'),
    semanas_letivas:              n('semanas_letivas'),
    ch_extensao:                  n('ch_estagio') || n('ch_extensao'),
    conceito_cc:                  v('conceito_cc'),
    conceito_cpc:                 v('conceito_cpc'),
    conceito_enade:               v('conceito_enade'),
    igc:                          v('igc'),
    tipo_reformulacao:            v('situacao_curso') || v('tipo_reformulacao'),
    status_curso:                 v('status_curso'),
  };
}

// ─────────────────────────────────────────────────────────────
// Envia tudo para o backend
// ─────────────────────────────────────────────────────────────

async function enviarPPC(btn) {
  setCarregando(btn, true);
  try {
    const payload = {
      ppc:        coletarPPC(),
      membros:    estadoPPC.membros,
      coordenacao: estadoPPC.coordenacao || null,
      docentes:   estadoPPC.docentes,
      componentes: estadoPPC.componentes,
      ambientes:  estadoPPC.ambientes,
    };

    const res = await fetch(`${API_BASE}/ppc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(JSON.stringify(err.detail) || `Erro ${res.status}`);
    }

    const data = await res.json();
    mostrarNotificacao(`PPC salvo com sucesso! ID: ${data.ppc_id.slice(0, 8)}... ✓`);
    console.log('PPC criado:', data.ppc_id);

  } catch (err) {
    mostrarNotificacao(`Erro ao salvar: ${err.message}`, 'erro');
    console.error(err);
  } finally {
    setCarregando(btn, false);
  }
}

// ─────────────────────────────────────────────────────────────
// Intercepta o form de componentes para acumular no estado
// (o componentes.js já cuida da tabela visual — aqui só salvamos
//  no estadoPPC para enviar junto no payload final)
// ─────────────────────────────────────────────────────────────

function interceptarFormComponentes() {
  const form = document.getElementById('form-componente');
  if (!form) return;

  form.addEventListener('submit', () => {
    // Coleta logo após o submit (antes do componentes.js limpar o form)
    setTimeout(() => {
      // Sincroniza com o array interno do componentes.js se disponível
      // Caso contrário, coleta direto dos campos
      if (window.__componentesState) {
        estadoPPC.componentes = window.__componentesState.map(c => ({
          codigo:        c.codigo,
          nome:          c.nome,
          tipo:          c.tipo,
          periodo:       parseInt(c.periodo),
          creditos:      c.totalCreditos,
          ch_pratica:    c.hrPraticas,
          ch_teorica:    c.hrTeoricas,
          ch_extensao:   c.hrExtensao || 0,
          ch_total_aula: c.totalHoras,
          bibliografias: [],
        }));
      }
    }, 50);
  });
}

// ─────────────────────────────────────────────────────────────
// Inicialização
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Botão "Enviar PPC"
  const btnEnviar = document.getElementById('btn-enviar-ppc')
    || document.querySelector('button.btn-enviar')
    || [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Enviar PPC');

  if (btnEnviar) {
    btnEnviar.addEventListener('click', (e) => {
      e.preventDefault();
      enviarPPC(btnEnviar);
    });
  }

  interceptarFormComponentes();
});

// ─────────────────────────────────────────────────────────────
// API pública — use nos outros JS para adicionar dados ao estado
// ─────────────────────────────────────────────────────────────

window.PPC = {
  adicionarMembro(membro)     { estadoPPC.membros.push(membro); },
  adicionarDocente(docente)   { estadoPPC.docentes.push(docente); },
  adicionarAmbiente(ambiente) { estadoPPC.ambientes.push(ambiente); },
  setCoordenacao(coord)       { estadoPPC.coordenacao = coord; },
  setComponentes(lista)       { estadoPPC.componentes = lista; },
  getEstado()                 { return estadoPPC; },
};