"""
services/document_service.py
Serviço responsável pela geração de documentos (PDF, ODT, DOCX) a partir dos dados do PPC.

Responsabilidades:
  PPCDataMapper   — transforma os dados brutos do banco no dicionário de variáveis do template.
  DocumentService — usa o mapper e futuramente acionará python-docx/docxtpl para gerar o arquivo.
"""

import os
from services.ppc_service import carregar_ppc


# ─────────────────────────────────────────────────────────────────────────────
# PPCDataMapper
# ─────────────────────────────────────────────────────────────────────────────

class PPCDataMapper:
    """
    Transforma os dados brutos retornados por carregar_ppc() no dicionário
    de variáveis utilizado para preencher o template DOCX, conforme chaves.txt.

    Cada método privado é responsável por um grupo coeso de chaves,
    facilitando a manutenção quando o template ou o banco mudarem.
    """

    def build(self, ppc_id: str) -> dict:
        """
        Ponto de entrada principal. Busca os dados do PPC e monta
        o dicionário completo de variáveis para o template.

        Args:
            ppc_id: UUID do PPC.

        Returns:
            Dicionário com todas as chaves do template mapeadas.
        """
        raw = carregar_ppc(ppc_id)

        self._ppc = raw.get("ppc") or {}
        self._coordenacao = raw.get("coordenacao") or {}
        self._membros = raw.get("membros") or []
        self._componentes = raw.get("componentes") or []
        self._docentes = raw.get("docentes") or []
        self._ambientes = raw.get("ambientes") or []

        return {
            **self._map_identificacao_geral(),
            **self._map_tabelas_instituicao(),
            **self._map_carga_horaria(),
            **self._map_colegiado(),
            **self._map_comissao_elaboracao(),
            **self._map_grade_curricular(),
            **self._map_coordenacao(),
            **self._map_docentes(),
            **self._map_infraestrutura(),
            # Campos de posição reservados pelo template sem dados correspondentes no banco
            "x": "",
            "y": "",
        }

    # ── Grupos de mapeamento ──────────────────────────────────────────────────

    def _map_identificacao_geral(self) -> dict:
        """Campos de identificação exibidos na capa e no cabeçalho do documento."""
        ppc = self._ppc
        return {
            "nome_curso": ppc.get("nome_curso", ""),
            "nível": ppc.get("nivel", ""),
            "campus": ppc.get("campus_name", ""),
            "tipo_curso": ppc.get("titulacao", ""),
            "area_conhecimento": ppc.get("area_conhecimento", ""),
            "data_ultima_atualizacao(ano)": self._extrair_ano(ppc.get("data_ultima_atualizacao", "")),
            "cursos_tecnicos_afins": ppc.get("cursos_tecnicos_afins", ""),
            "outros_cursos_campus": ppc.get("outros_cursos_campus", ""),
            "portaria": self._buscar_portaria(),
        }

    def _map_tabelas_instituicao(self) -> dict:
        """Tabelas de dados da instituição e do curso (identificação e indicadores)."""
        ppc = self._ppc
        return {
            "tabela_isntituicao": {
                "campus": ppc.get("campus_name", ""),
                "cnpj": ppc.get("cnpj", ""),
                "cep": ppc.get("cep", ""),
                "cidade": ppc.get("cidade", ""),
                "bairro": ppc.get("bairro", ""),
                "rua": ppc.get("rua", ""),
                "numero": ppc.get("numero", ""),
                "telefone_fax": ppc.get("telefone_fax", ""),
                "email": ppc.get("email_contato", ""),
                "ato_legal": ppc.get("ato_legal", ""),
                "sitio_web": ppc.get("sitio_web", ""),
            },
            "tabela_curso": {
                "nome_curso": ppc.get("nome_curso", ""),
                "nivel": ppc.get("nivel", ""),
                "modalidade": ppc.get("modalidade_curso", ""),
                "titulacao": ppc.get("titulacao", ""),
                "area_conhecimento": ppc.get("area_conhecimento", ""),
                "inicio_curso": ppc.get("inicio_curso", ""),
                "regime_matricula": ppc.get("regime_matricula", ""),
                "vagas_anuais": ppc.get("vagas_anuais", ""),
                "vagas_turno": ppc.get("vagas_turno", ""),
                "turnos": ppc.get("turnos", ""),
                "formas_acesso": ppc.get("formas_acesso", ""),
                "pre_requisito_ingresso": ppc.get("pre_requisito_ingresso", ""),
                "tipo_reformulacao": ppc.get("tipo_reformulacao", ""),
                "status_curso": ppc.get("status_curso", ""),
                "matriz_curricular_alterada": ppc.get("matriz_curricular_alterada", ""),
            },
            "tabela_indicadores_qualidade_curso": {
                "cc": ppc.get("conceito_cc", ""),
                "cpc": ppc.get("conceito_cpc", ""),
                "enade": ppc.get("conceito_enade", ""),
                "igc": ppc.get("igc", ""),
            },
        }

    def _map_carga_horaria(self) -> dict:
        """Campos de carga horária e integralização usados inline no texto do documento."""
        ppc = self._ppc
        return {
            "ch_total_relogio": ppc.get("ch_total_relogio", ""),
            "ch_total_aula": ppc.get("ch_total_aula", ""),
            "duracao_aula_minutos": ppc.get("duracao_aula_minutos", ""),
            "semanas_letivas": ppc.get("semanas_letivas", ""),
            "inicio_curso": ppc.get("inicio_curso", ""),
            "regime_matricula": ppc.get("regime_matricula", ""),
            "integralizacao_min_anos": self._semestres_para_anos(ppc.get("integralizacao_min_semestres")),
            "integralizacao_max_anos": self._semestres_para_anos(ppc.get("integralizacao_max_semestres")),
        }

    def _map_colegiado(self) -> dict:
        """Membros do colegiado institucional (reitor, pró-reitores, diretores, etc.)."""
        buscar = self._buscar_membro_institucional
        return {
            "colegiado.reitor": buscar("Reitor"),
            "colegiado.pro_reitor_ensino": buscar("Pró-Reitor de Ensino"),
            "colegiado.pro_reitor_pesquisa": buscar("Pró-Reitor de Pesquisa"),
            "colegiado.pro_reitor_extensao": buscar("Pró-Reitor de Extensão"),
            "colegiado.pro_reitor_integracao": buscar("Pró-Reitor de Integração"),
            "colegiado.pro_reitor_administracao": buscar("Pró-Reitor de Administração"),
            "colegiado.diretor_geral": buscar("Diretor Geral"),
            "colegiado.diretor_adm": buscar("Diretor de Administração"),
            "colegiado.diretor_des": buscar("Diretor de Desenvolvimento Educacional"),
            "colegiado.gestao_acad": buscar("Gestão Acadêmica"),
            "colegiado.coord_registro": buscar("Coordenador de Registro Acadêmico"),
            "colegiado.coord_extensao": buscar("Coordenador de Extensão"),
            "colegiado.coord_pesquisa": buscar("Coordenador de Pesquisa"),
            "colegiado.coord_curso": buscar("Coordenador do Curso"),
            "colegiado.assessoria_ped": buscar("Assessoria Pedagógica"),
            "tabela_composicao_colegiado": self._filtrar_membros_por_tipo("Colegiado"),
            "tabela_composicao_nde": self._filtrar_membros_por_tipo("NDE"),
        }

    def _map_comissao_elaboracao(self) -> dict:
        """Membros da comissão de elaboração do PPC."""
        buscar = lambda cargo: self._buscar_membro("Comissão de Elaboração", cargo)
        return {
            "presidente.comissao_de_elaboracao": buscar("Presidente"),
            "comissão_de_elaboracao.membro": self._listar_membros_comissao(),
            "comissão_de_elaboracao.bibliotecario": buscar("Bibliotecário"),
            "comissão_de_elaboracao.pedagogo": buscar("Pedagogo"),
            "comissão_de_elaboracao.revisao_textual": buscar("Revisão Textual"),
        }

    def _map_grade_curricular(self) -> dict:
        """Tabelas e fluxogramas derivados dos componentes curriculares."""
        componentes = self._componentes
        por_periodo = self._agrupar_por_periodo(componentes)
        return {
            "tabela_componentes_por_periodo": por_periodo,
            "tabela_divisao_componentes_por_nucleo": self._agrupar_por_nucleo(componentes),
            "tabela_integralizacao": self._calcular_integralizacao(componentes),
            "tabela_requisitos": self._mapear_requisitos(componentes),
            "tabela_optativas": self._filtrar_optativas(componentes),
            "tabela_ementa": self._mapear_ementas(componentes),
            "fluxograma_periodos": por_periodo,
            "fluxograma_relacoes": self._mapear_relacoes_prereq(componentes),
        }

    def _map_coordenacao(self) -> dict:
        """Dados do coordenador do curso."""
        coord = self._coordenacao
        return {
            "tabela_coordenacao": {
                "nome": coord.get("nome_professor", ""),
                "regime_trabalho": coord.get("regime_trabalho", ""),
                "ch_semanal_coordenacao": coord.get("ch_semanal_coordenacao", ""),
                "tempo_exercicio_ies": coord.get("tempo_exercicio_ies", ""),
                "tempo_coordenacao_curso": coord.get("tempo_coordenacao_curso", ""),
                "qualificacao": coord.get("qualificacao", ""),
                "titulacao": coord.get("titulacao", ""),
                "grupos_pesquisa": coord.get("grupos_pesquisa", ""),
                "linhas_pesquisa": coord.get("linhas_pesquisa", ""),
                "experiencia_profissional": coord.get("experiencia_profissional", ""),
                "experiencia_gestao": coord.get("experiencia_gestao", ""),
                "email": coord.get("email", ""),
            }
        }

    def _map_docentes(self) -> dict:
        """Corpo docente do curso."""
        return {
            "tabela_docentes": [
                {
                    "nome": d.get("nome", ""),
                    "titulacao": d.get("titulacao", ""),
                    "regime_trabalho": d.get("regime_trabalho", ""),
                    "formacao_academica": d.get("formacao_academica", ""),
                    "experiencia_docencia_anos": d.get("experiencia_docencia_anos", ""),
                    "link_lattes": d.get("link_lattes", ""),
                    "componentes_ministrados": d.get("componentes_ministrados", []),
                }
                for d in self._docentes
            ]
        }

    def _map_infraestrutura(self) -> dict:
        """Ambientes físicos e seus itens de equipamento/mobiliário."""
        return {
            "tabela_ambientes": [
                {
                    "categoria": a.get("categoria", ""),
                    "nome_ambiente": a.get("nome_ambiente", ""),
                    "quantidade": a.get("quantidade", 1),
                    "area_m2": a.get("area_m2", ""),
                    "itens": [
                        {
                            "tipo": item.get("tipo", ""),
                            "nome_item": item.get("nome_item", ""),
                            "quantidade": item.get("quantidade", 1),
                            "especificacoes": item.get("especificacoes", ""),
                        }
                        for item in a.get("itens", [])
                    ],
                }
                for a in self._ambientes
            ]
        }

    # ── Helpers de membros ────────────────────────────────────────────────────

    def _buscar_membro_institucional(self, cargo: str) -> str:
        """Atalho para buscar um membro do tipo 'Institucional'."""
        return self._buscar_membro("Institucional", cargo)

    def _buscar_membro(self, tipo: str, cargo: str) -> str:
        """
        Retorna o nome do primeiro membro que corresponda ao tipo e cargo.
        Comparação case-insensitive para tolerar variações de digitação.
        """
        tipo_lower = tipo.lower()
        cargo_lower = cargo.lower()
        for m in self._membros:
            if m.get("tipo", "").lower() == tipo_lower and m.get("cargo", "").lower() == cargo_lower:
                return m.get("nome", "")
        return ""

    def _buscar_portaria(self) -> str:
        """Retorna a portaria do primeiro membro da Comissão de Elaboração que a possua."""
        for m in self._membros:
            if m.get("tipo", "").lower() == "comissão de elaboração":
                portaria = m.get("portaria", "") or m.get("linked_ordinance", "")
                if portaria:
                    return portaria
        return ""

    def _listar_membros_comissao(self) -> list[dict]:
        """Retorna todos os membros da Comissão de Elaboração como lista de dicts."""
        return [
            {"cargo": m.get("cargo", ""), "nome": m.get("nome", "")}
            for m in self._membros
            if m.get("tipo", "").lower() == "comissão de elaboração"
        ]

    def _filtrar_membros_por_tipo(self, tipo: str) -> list[dict]:
        """Retorna os membros de um tipo específico como lista de dicts {cargo, nome}."""
        tipo_lower = tipo.lower()
        return [
            {"cargo": m.get("cargo", ""), "nome": m.get("nome", "")}
            for m in self._membros
            if m.get("tipo", "").lower() == tipo_lower
        ]

    # ── Helpers de componentes curriculares ──────────────────────────────────

    def _agrupar_por_periodo(self, componentes: list) -> dict:
        """
        Agrupa os componentes por período.

        Returns:
            Dict {periodo: [lista de componentes]}, ordenado por período.
        """
        grupos: dict[int, list[dict]] = {}
        for comp in componentes:
            periodo = comp.get("periodo", 0)
            grupos.setdefault(periodo, []).append({
                "codigo": comp.get("codigo", ""),
                "nome": comp.get("nome", ""),
                "tipo": comp.get("tipo", ""),
                "nucleo_curricular": comp.get("nucleo_curricular", ""),
                "creditos": comp.get("creditos", 0),
                "ch_total_aula": comp.get("ch_total_aula", 0),
                "ch_total_relogio": comp.get("ch_total_relogio", 0),
                "ch_teorica": comp.get("ch_teorica", 0),
                "ch_pratica": comp.get("ch_pratica", 0),
                "ch_extensao": comp.get("ch_extensao", 0),
                "pre_requisito": comp.get("pre_requisito_codigo", ""),
                "co_requisito": comp.get("co_requisito_codigo", ""),
            })
        return dict(sorted(grupos.items()))

    def _agrupar_por_nucleo(self, componentes: list) -> dict:
        """
        Agrupa totais de carga horária por núcleo curricular.

        Returns:
            Dict {nucleo: {quantidade, ch_total_relogio, ch_total_aula}}.
        """
        nucleos: dict[str, dict] = {}
        for comp in componentes:
            nucleo = comp.get("nucleo_curricular") or "Não Informado"
            if nucleo not in nucleos:
                nucleos[nucleo] = {"quantidade": 0, "ch_total_relogio": 0, "ch_total_aula": 0}
            nucleos[nucleo]["quantidade"] += 1
            nucleos[nucleo]["ch_total_relogio"] += comp.get("ch_total_relogio") or 0
            nucleos[nucleo]["ch_total_aula"] += comp.get("ch_total_aula") or 0
        return nucleos

    def _calcular_integralizacao(self, componentes: list) -> dict:
        """
        Calcula os totais de integralização somando as cargas dos componentes.
        Os dados globais do PPC (atividades complementares, ch total) são mesclados.
        """
        ppc = self._ppc
        ch_obrigatorias = sum(
            c.get("ch_total_relogio") or 0
            for c in componentes
            if c.get("tipo", "").lower() != "optativa"
        )
        ch_optativas = sum(
            c.get("ch_total_relogio") or 0
            for c in componentes
            if c.get("tipo", "").lower() == "optativa"
        )
        ch_extensao = sum(c.get("ch_extensao") or 0 for c in componentes)
        return {
            "ch_obrigatorias": ch_obrigatorias,
            "ch_optativas": ch_optativas,
            "ch_extensao": ch_extensao,
            "ch_atividades_complementares": ppc.get("atividades_complementares", 0),
            "ch_total_relogio": ppc.get("ch_total_relogio", 0),
            "ch_total_aula": ppc.get("ch_total_aula", 0),
            "integralizacao_min_semestres": ppc.get("integralizacao_min_semestres", ""),
            "integralizacao_max_semestres": ppc.get("integralizacao_max_semestres", ""),
        }

    def _filtrar_optativas(self, componentes: list) -> list[dict]:
        """Retorna apenas os componentes do tipo optativa."""
        return [
            {
                "codigo": c.get("codigo", ""),
                "nome": c.get("nome", ""),
                "creditos": c.get("creditos", 0),
                "ch_total_relogio": c.get("ch_total_relogio", 0),
                "ch_total_aula": c.get("ch_total_aula", 0),
                "ementa": c.get("ementa", ""),
            }
            for c in componentes
            if c.get("tipo", "").lower() == "optativa"
        ]

    def _mapear_requisitos(self, componentes: list) -> list[dict]:
        """Retorna a tabela de pré-requisitos e co-requisitos dos componentes."""
        return [
            {
                "codigo": c.get("codigo", ""),
                "nome": c.get("nome", ""),
                "pre_requisito": c.get("pre_requisito_codigo", ""),
                "co_requisito": c.get("co_requisito_codigo", ""),
            }
            for c in componentes
            if c.get("pre_requisito_codigo") or c.get("co_requisito_codigo")
        ]

    def _mapear_ementas(self, componentes: list) -> list[dict]:
        """
        Retorna os componentes com dados completos de ementa e bibliografias,
        ordenados por período para a seção de ementas do documento.
        """
        ordenados = sorted(componentes, key=lambda c: (c.get("periodo", 0), c.get("nome", "")))
        return [
            {
                "periodo": c.get("periodo", ""),
                "codigo": c.get("codigo", ""),
                "nome": c.get("nome", ""),
                "ch_total_relogio": c.get("ch_total_relogio", 0),
                "ch_total_aula": c.get("ch_total_aula", 0),
                "ch_teorica": c.get("ch_teorica", 0),
                "ch_pratica": c.get("ch_pratica", 0),
                "ch_extensao": c.get("ch_extensao", 0),
                "creditos": c.get("creditos", 0),
                "nucleo_curricular": c.get("nucleo_curricular", ""),
                "ementa": c.get("ementa", ""),
                "pre_requisito": c.get("pre_requisito_codigo", ""),
                "co_requisito": c.get("co_requisito_codigo", ""),
                "bibliografias_basicas": [
                    b["referencia_texto"]
                    for b in c.get("bibliografias", [])
                    if b.get("tipo", "").lower() in ("básica", "basica")
                ],
                "bibliografias_complementares": [
                    b["referencia_texto"]
                    for b in c.get("bibliografias", [])
                    if b.get("tipo", "").lower() == "complementar"
                ],
            }
            for c in ordenados
        ]

    def _mapear_relacoes_prereq(self, componentes: list) -> list[dict]:
        """
        Retorna as arestas de pré-requisito e co-requisito entre componentes,
        usadas para renderizar o fluxograma de relações.
        """
        pre_reqs = [
            {"origem": c.get("pre_requisito_codigo", ""), "destino": c.get("codigo", ""), "tipo": "pre_requisito"}
            for c in componentes if c.get("pre_requisito_codigo")
        ]
        co_reqs = [
            {"origem": c.get("co_requisito_codigo", ""), "destino": c.get("codigo", ""), "tipo": "co_requisito"}
            for c in componentes if c.get("co_requisito_codigo")
        ]
        return pre_reqs + co_reqs

    # ── Helpers de formatação ─────────────────────────────────────────────────

    @staticmethod
    def _extrair_ano(data_iso: str) -> str:
        """Retorna o ano de uma data ISO (ex: '2024-05-01T...' → '2024')."""
        return data_iso[:4] if data_iso and len(data_iso) >= 4 else ""

    @staticmethod
    def _semestres_para_anos(semestres) -> str:
        """Converte semestres em anos com uma casa decimal (ex: 8 → '4,0')."""
        if semestres is None:
            return ""
        return str(semestres / 2).replace(".", ",")


# ─────────────────────────────────────────────────────────────────────────────
# DocumentService
# ─────────────────────────────────────────────────────────────────────────────

class DocumentService:
    """
    Gera os documentos oficiais (DOCX, PDF) do PPC.

    Delega o mapeamento de dados ao PPCDataMapper e futuramente
    acionará python-docx/docxtpl para preencher o template e retornar o arquivo.
    """

    TEMPLATE_PATH = "templates/doc_ppc_modelo.docx"

    def __init__(self):
        self._mapper = PPCDataMapper()

    def generate_ppc_document(self, ppc_id: str) -> dict:
        """
        Gera o documento do PPC preenchendo o template DOCX.

        Nesta etapa retorna os dados mapeados como dicionário para validação
        estrutural antes da integração com python-docx.

        Args:
            ppc_id: UUID do PPC.

        Returns:
            Dicionário com status e dados extraídos para o template.
        """
        if not os.path.exists(self.TEMPLATE_PATH):
            # Template pode ainda não existir localmente durante o desenvolvimento
            pass

        dados_template = self._mapper.build(ppc_id)

        # TODO: usar docxtpl para abrir TEMPLATE_PATH, substituir as variáveis
        # por dados_template, salvar em arquivo temporário e retornar para download.

        return {
            "status": "sucesso",
            "mensagem": "Dados mapeados com sucesso. Pronto para preenchimento do template.",
            "dados_extraidos": dados_template,
            "template_utilizado": self.TEMPLATE_PATH,
        }


# Instância Singleton do serviço para uso nas rotas
document_service = DocumentService()
