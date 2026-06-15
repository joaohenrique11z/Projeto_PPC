/**
 * api.js — Cliente para integração com a API PPC
 *
 * Fornece funções para:
 *   - Listar PPCs (GET /api/ppc)
 *   - Criar PPC (POST /api/ppc)
 *   - Buscar PPC por ID (GET /api/ppc/{id})
 *   - Atualizar PPC (PUT /api/ppc/{id})
 *   - Deletar PPC (DELETE /api/ppc/{id})
 */

const API_BASE = 'http://localhost:8000/api';

/**
 * Exibe notificação na tela
 * @param {string} mensagem - Texto da notificação
 * @param {string} tipo - 'sucesso' | 'erro' | 'info'
 */
function exibirNotificacao(mensagem, tipo = 'sucesso') {
  const cores = { 
    sucesso: 'bg-green-600', 
    erro: 'bg-red-600', 
    info: 'bg-blue-600' 
  };
  const notificacao = document.createElement('div');
  notificacao.className = `fixed top-4 right-4 z-50 px-5 py-3 rounded shadow-lg text-white text-sm font-medium transition-all ${cores[tipo]}`;
  notificacao.textContent = mensagem;
  document.body.appendChild(notificacao);
  setTimeout(() => notificacao.remove(), 3500);
}

/**
 * Realiza uma requisição HTTP com tratamento de erro
 * @param {string} url - URL da requisição
 * @param {Object} opcoes - Opções do fetch
 * @returns {Promise<Object>} - Dados da resposta
 */
async function requisicaoAPI(url, opcoes = {}) {
  try {
    const resposta = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...opcoes.headers
      },
      ...opcoes
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({}));
      const mensagemErro = erro.detail || `Erro ${resposta.status}`;
      throw new Error(mensagemErro);
    }

    return await resposta.json();
  } catch (erro) {
    console.error('Erro na requisição:', erro);
    throw erro;
  }
}

// ════════════════════════════════════════════════════════════
// OPERAÇÕES CRUD
// ════════════════════════════════════════════════════════════

/**
 * Lista todos os PPCs cadastrados
 * @returns {Promise<Array>} - Lista de PPCs
 */
async function listarPPCs() {
  try {
    const dados = await requisicaoAPI(`${API_BASE}/ppc`);
    return dados;
  } catch (erro) {
    console.error('Erro ao listar PPCs:', erro);
    exibirNotificacao('Erro ao carregar PPCs', 'erro');
    return [];
  }
}

/**
 * Cria um novo PPC
 * @param {Object} payload - Dados do PPC
 * @returns {Promise<Object>} - PPC criado
 */
async function criarPPC(payload) {
  try {
    const dados = await requisicaoAPI(`${API_BASE}/ppc`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    exibirNotificacao('PPC criado com sucesso!', 'sucesso');
    return dados;
  } catch (erro) {
    console.error('Erro ao criar PPC:', erro);
    exibirNotificacao(`Erro: ${erro.message}`, 'erro');
    throw erro;
  }
}

/**
 * Busca um PPC específico por ID
 * @param {string} id - ID do PPC
 * @returns {Promise<Object>} - Dados do PPC
 */
async function obterPPC(id) {
  try {
    const dados = await requisicaoAPI(`${API_BASE}/ppc/${id}`);
    return dados;
  } catch (erro) {
    console.error(`Erro ao obter PPC ${id}:`, erro);
    exibirNotificacao('Erro ao carregar PPC', 'erro');
    throw erro;
  }
}

/**
 * Atualiza um PPC existente
 * @param {string} id - ID do PPC
 * @param {Object} payload - Dados atualizados
 * @returns {Promise<Object>} - PPC atualizado
 */
async function atualizarPPC(id, payload) {
  try {
    const dados = await requisicaoAPI(`${API_BASE}/ppc/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    exibirNotificacao('PPC atualizado com sucesso!', 'sucesso');
    return dados;
  } catch (erro) {
    console.error(`Erro ao atualizar PPC ${id}:`, erro);
    exibirNotificacao(`Erro: ${erro.message}`, 'erro');
    throw erro;
  }
}

/**
 * Deleta um PPC
 * @param {string} id - ID do PPC
 * @returns {Promise<void>}
 */
async function deletarPPC(id) {
  try {
    await requisicaoAPI(`${API_BASE}/ppc/${id}`, {
      method: 'DELETE'
    });
    exibirNotificacao('PPC deletado com sucesso!', 'sucesso');
  } catch (erro) {
    console.error(`Erro ao deletar PPC ${id}:`, erro);
    exibirNotificacao(`Erro: ${erro.message}`, 'erro');
    throw erro;
  }
}

/**
 * Carrega todos os dados de um PPC (main + componentes + membros + docentes + ambientes)
 * @param {string} ppcId - ID do PPC
 * @returns {Promise<Object>} - Objeto com todos os dados agrupados
 */
async function obterPPCCompleto(ppcId) {
  try {
    const [ppc, componentes, membros, docentes, ambientes] = await Promise.all([
      requisicaoAPI(`${API_BASE}/ppc/${ppcId}`),
      requisicaoAPI(`${API_BASE}/ppc/${ppcId}/componentes`).catch(() => []),
      requisicaoAPI(`${API_BASE}/ppc/${ppcId}/membros`).catch(() => []),
      requisicaoAPI(`${API_BASE}/ppc/${ppcId}/docentes`).catch(() => []),
      requisicaoAPI(`${API_BASE}/ppc/${ppcId}/ambientes`).catch(() => [])
    ]);

    return {
      ppc: ppc.data || ppc,
      componentes: componentes.data || componentes || [],
      membros: membros.data || membros || [],
      docentes: docentes.data || docentes || [],
      ambientes: ambientes.data || ambientes || []
    };
  } catch (erro) {
    console.error(`Erro ao carregar PPC completo ${ppcId}:`, erro);
    exibirNotificacao('Erro ao carregar dados do PPC', 'erro');
    throw erro;
  }
}

// ─────────────────────────────────────────────────────────────
// Utilitários para popular formulário
// ─────────────────────────────────────────────────────────────

/**
 * Define o valor de um campo de input
 */
function definirValorCampo(id, valor) {
  const campo = document.getElementById(id);
  if (campo) {
    if (campo.type === 'checkbox') {
      campo.checked = valor === true || valor === 'true' || valor === 1;
    } else if (campo.type === 'radio') {
      document.querySelector(`input[name="${campo.name}"][value="${valor}"]`)?.setAttribute('checked', 'checked');
    } else {
      campo.value = valor || '';
    }
  }
}

/**
 * Obtém o valor de um campo (inversa de obterTexto/obterNumero)
 */
function obterValorCampo(id) {
  const campo = document.getElementById(id);
  if (!campo) return null;
  
  if (campo.type === 'checkbox') return campo.checked;
  if (campo.type === 'number') return Number(campo.value) || null;
  return campo.value || null;
}

/**
 * Preenche o formulário principal com dados do PPC
 */
function preencherFormularioPrincipal(dadosPPC) {
  if (!dadosPPC) return;

  // Mapeamento de campo -> ID do HTML (inversa de mapearFormularioPPC)
  const mapeamento = {
    campus_name: 'campus_name',
    cnpj: 'cnpj',
    cep: 'cep',
    cidade: 'cidade',
    bairro: 'bairro',
    rua: 'rua',
    numero: 'numero',
    telefone_fax: 'telefone_fax',
    email_contato: 'email_contato',
    ato_legal: 'ato_legal',
    sitio_web: 'sitio',  // ou sitio_web
    nome_curso: 'nome_curso',
    area_conhecimento: 'eixo_tecnologico',
    nivel: 'tipo_curso',
    modalidade_curso: 'modalidade_curso',
    titulacao: 'titulacao',
    atividades_complementares: 'atividades_complementares',
    integralizacao_min_semestres: 'integralizacao_min_semestres',
    integralizacao_max_semestres: 'integralizacao_max_semestres',
    formas_acesso: 'formas_acesso',
    pre_requisito_ingresso: 'pre_requisito_ingresso',
    vagas_anuais: 'vagas_semestre',  // ou vagas_anuais
    vagas_turno: 'vagas_turno',
    turnos: 'turnos',
    regime_matricula: 'regime',  // ou regime_matricula
    semanas_letivas: 'semanas_letivas',
    ch_extensao: 'ch_estagio',  // ou ch_extensao
    conceito_cc: 'conceito_cc',
    conceito_cpc: 'conceito_cpc',
    conceito_enade: 'conceito_enade',
    igc: 'igc',
    tipo_reformulacao: 'situacao_curso',  // ou tipo_reformulacao
    status_curso: 'status_curso',
    ch_total_relogio: 'ch_total_relogio',
    ch_total_aula: 'ch_total_aula',
    duracao_aula_minutos: 'duracao_aula_minutos'
  };

  // Preenche cada campo
  for (const [chave, idHTML] of Object.entries(mapeamento)) {
    if (dadosPPC.hasOwnProperty(chave)) {
      definirValorCampo(idHTML, dadosPPC[chave]);
    }
  }
}
//     throw erro;
//   }
// }

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