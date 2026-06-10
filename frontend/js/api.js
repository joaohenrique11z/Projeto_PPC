/**
 * api.js — Integração com o backend dos colegas (PPCPayload)
 *
 * O backend espera UM único POST /api/ppc com esse formato:
 * {
 * "ppc": { ...dados do curso... },
 * "membros": [...],
 * "coordenacao": {...},
 * "docentes": [...],
 * "componentes": [...],
 * "ambientes": [...]
 * }
 *
 * Como usar:
 * Adicione no final do forms.html, antes de </body>:
 * <script src="js/api.js"></script>
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
// Utilitários de Extração e Interface
// ─────────────────────────────────────────────────────────────

function obterTexto(id) {
  return document.getElementById(id)?.value?.trim() || null;
}

function obterNumero(id) {
  const valor = parseInt(document.getElementById(id)?.value);
  return isNaN(valor) ? null : valor;
}

function exibirNotificacao(mensagem, tipo = 'sucesso') {
  const cores = { sucesso: 'bg-green-600', erro: 'bg-red-600', info: 'bg-blue-600' };
  const notificacao = document.createElement('div');
  notificacao.className = `fixed top-4 right-4 z-50 px-5 py-3 rounded shadow-lg text-white text-sm font-medium transition-all ${cores[tipo]}`;
  notificacao.textContent = mensagem;
  document.body.appendChild(notificacao);
  setTimeout(() => notificacao.remove(), 3500);
}

function alternarLoadingBotao(botao, estaCarregando) {
  if (!botao) return;
  botao.disabled = estaCarregando;
  botao.dataset.textoOriginal = botao.dataset.textoOriginal || botao.textContent;
  botao.textContent = estaCarregando ? 'Salvando...' : botao.dataset.textoOriginal;
}

// ─────────────────────────────────────────────────────────────
// Mapeamento e Submissão de Dados
// ─────────────────────────────────────────────────────────────

function mapearFormularioPPC() {
  return {
    campus_name:                  obterTexto('campus_name'),
    cnpj:                         obterTexto('cnpj'),
    cep:                          obterTexto('cep'),
    cidade:                       obterTexto('cidade'),
    bairro:                       obterTexto('bairro'),
    rua:                          obterTexto('rua'),
    numero:                       obterTexto('numero'),
    telefone_fax:                 obterTexto('telefone_fax'),
    email_contato:                obterTexto('email_contato'),
    ato_legal:                    obterTexto('ato_legal'),
    sitio_web:                    obterTexto('sitio_web') || obterTexto('sitio'),
    nome_curso:                   obterTexto('nome_curso'),
    area_conhecimento:            obterTexto('eixo_tecnologico'),
    nivel:                        obterTexto('tipo_curso'),
    modalidade_curso:             obterTexto('modalidade_curso'),
    titulacao:                    obterTexto('titulacao'),
    atividades_complementares:    obterNumero('atividades_complementares'),
    integralizacao_min_semestres: obterNumero('integralizacao_min_semestres'),
    integralizacao_max_semestres: obterNumero('integralizacao_max_semestres'),
    formas_acesso:                obterTexto('formas_acesso'),
    pre_requisito_ingresso:       obterTexto('pre_requisito_ingresso'),
    vagas_turno:                  obterNumero('vagas_turno'),
    vagas_anuais:                 obterNumero('vagas_semestre') || obterNumero('vagas_anuais'),
    turnos:                       obterTexto('turnos'),
    regime_matricula:             obterTexto('regime') || obterTexto('regime_matricula'),
    semanas_letivas:              obterNumero('semanas_letivas'),
    ch_extensao:                  obterNumero('ch_estagio') || obterNumero('ch_extensao'),
    conceito_cc:                  obterTexto('conceito_cc'),
    conceito_cpc:                 obterTexto('conceito_cpc'),
    conceito_enade:               obterTexto('conceito_enade'),
    igc:                          obterTexto('igc'),
    tipo_reformulacao:            obterTexto('situacao_curso') || obterTexto('tipo_reformulacao'),
    status_curso:                 obterTexto('status_curso'),
  };
}

// ─────────────────────────────────────────────────────────────
// Envia tudo para o backend
// ─────────────────────────────────────────────────────────────

async function submeterDadosPPC(botaoSubmit) {
  alternarLoadingBotao(botaoSubmit, true);
  try {
    const payload = {
      ppc:         mapearFormularioPPC(),
      membros:     estadoPPC.membros,
      coordenacao: estadoPPC.coordenacao || null,
      docentes:    estadoPPC.docentes,
      componentes: estadoPPC.componentes,
      ambientes:   estadoPPC.ambientes,
    };

    const resposta = await fetch(`${API_BASE}/ppc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({}));
      throw new Error(JSON.stringify(erro.detail) || `Erro ${resposta.status}`);
    }

    const dadosRetornados = await resposta.json();
    exibirNotificacao(`PPC salvo com sucesso! ID: ${dadosRetornados.ppc_id.slice(0, 8)}... ✓`);
    console.log('PPC criado:', dadosRetornados.ppc_id);

  } catch (erro) {
    exibirNotificacao(`Erro ao salvar: ${erro.message}`, 'erro');
    console.error(erro);
  } finally {
    alternarLoadingBotao(botaoSubmit, false);
  }
}

// ─────────────────────────────────────────────────────────────
// Sincroniza o form de componentes para acumular no estado
// ─────────────────────────────────────────────────────────────

function sincronizarFormularioComponentes() {
  const formularioComponente = document.getElementById('form-componente');
  if (!formularioComponente) return;

  formularioComponente.addEventListener('submit', () => {
    // Coleta logo após o submit (antes do componentes.js limpar o form)
    setTimeout(() => {
      // Sincroniza com o array interno do componentes.js se disponível
      if (window.__componentesState) {
        estadoPPC.componentes = window.__componentesState.map(componente => ({
          codigo:        componente.codigo,
          nome:          componente.nome,
          tipo:          componente.tipo,
          periodo:       parseInt(componente.periodo),
          creditos:      componente.totalCreditos,
          ch_pratica:    componente.hrPraticas,
          ch_teorica:    componente.hrTeoricas,
          ch_extensao:   componente.hrExtensao || 0,
          ch_total_aula: componente.totalHoras,
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

  const botaoEnviar = document.getElementById('btn-enviar-ppc')
    || document.querySelector('button.btn-enviar')
    || [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Enviar PPC');

  if (botaoEnviar) {
    botaoEnviar.addEventListener('click', (evento) => {
      evento.preventDefault();
      submeterDadosPPC(botaoEnviar);
    });
  }

  sincronizarFormularioComponentes();
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