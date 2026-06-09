"""
models/ppc.py
Schemas Pydantic que espelham a estrutura do banco de dados (supa_structure.sql).
Cada classe representa uma tabela ou um conjunto de dados do formulário.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


# ─────────────────────────────────────────────────────────────────────────────
# Dados Gerais do PPC (tabela: ppc)
# ─────────────────────────────────────────────────────────────────────────────

class PPCCreate(BaseModel):
    """Dados gerais do curso e informações institucionais."""

    # Dados institucionais
    campus_name: Optional[str] = None
    cnpj: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    bairro: Optional[str] = None
    rua: Optional[str] = None
    numero: Optional[str] = None
    telefone_fax: Optional[str] = None
    email_contato: Optional[str] = None
    ato_legal: Optional[str] = None
    sitio_web: Optional[str] = None

    # Identificação acadêmica
    nome_curso: Optional[str] = None
    area_conhecimento: Optional[str] = None
    nivel: Optional[str] = None
    modalidade_curso: Optional[str] = None
    titulacao: Optional[str] = None

    # Carga horária
    ch_total_relogio: Optional[int] = None
    ch_total_aula: Optional[int] = None
    duracao_aula_minutos: Optional[int] = None
    atividades_complementares: Optional[int] = None
    ch_extensao: Optional[int] = None

    # Integralização e calendário
    integralizacao_min_semestres: Optional[int] = None
    integralizacao_max_semestres: Optional[int] = None
    semanas_letivas: Optional[int] = None
    periodicidade_letiva: Optional[str] = None
    inicio_curso: Optional[str] = None
    matriz_curricular_alterada: Optional[str] = None

    # Oferta e acesso
    formas_acesso: Optional[str] = None
    pre_requisito_ingresso: Optional[str] = None
    vagas_anuais: Optional[int] = None
    vagas_turno: Optional[int] = None
    turnos: Optional[str] = None
    regime_matricula: Optional[str] = None

    # Cursos correlatos
    cursos_tecnicos_afins: Optional[str] = None
    outros_cursos_campus: Optional[str] = None

    # Avaliação e situação
    conceito_cc: Optional[str] = None
    conceito_cpc: Optional[str] = None
    conceito_enade: Optional[str] = None
    igc: Optional[str] = None
    tipo_reformulacao: Optional[str] = None
    status_curso: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Componente Curricular (tabela: componente_curricular + bibliografia)
# ─────────────────────────────────────────────────────────────────────────────

class BibliografiaCreate(BaseModel):
    """Uma referência bibliográfica vinculada a um componente."""

    tipo: str           # "Básica" ou "Complementar"
    referencia_texto: str


class ComponenteCreate(BaseModel):
    """Um componente (disciplina) da grade curricular."""

    codigo: Optional[str] = None
    nome: str
    periodo: int
    tipo: str
    nucleo_curricular: Optional[str] = None
    sub_nucleo: Optional[str] = None
    creditos: Optional[int] = 0
    ch_total_aula: Optional[int] = 0
    ch_total_relogio: Optional[int] = 0
    ch_teorica: Optional[int] = 0
    ch_pratica: Optional[int] = 0
    ch_extensao: Optional[int] = 0
    ementa: Optional[str] = None
    bibliografias: list[BibliografiaCreate] = []


# ─────────────────────────────────────────────────────────────────────────────
# Membro Institucional (tabela: membro_institucional)
# ─────────────────────────────────────────────────────────────────────────────

class MembroCreate(BaseModel):
    """Membro da equipe institucional ou da comissão de elaboração do PPC."""

    tipo: str
    cargo: str
    nome: str


# ─────────────────────────────────────────────────────────────────────────────
# Coordenação do Curso (tabela: coordenacao)
# ─────────────────────────────────────────────────────────────────────────────

class CoordenacaoCreate(BaseModel):
    """Dados do coordenador do curso."""

    nome_professor: Optional[str] = None
    regime_trabalho: Optional[str] = None
    ch_semanal_coordenacao: Optional[int] = None
    tempo_exercicio_ies: Optional[str] = None
    tempo_coordenacao_curso: Optional[str] = None
    qualificacao: Optional[str] = None
    titulacao: Optional[str] = None
    grupos_pesquisa: Optional[str] = None
    linhas_pesquisa: Optional[str] = None
    experiencia_profissional: Optional[int] = None
    experiencia_gestao: Optional[str] = None
    email: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Docente (tabela: docente)
# ─────────────────────────────────────────────────────────────────────────────

class DocenteCreate(BaseModel):
    """Um professor do corpo docente do curso."""

    nome: str
    formacao_academica: Optional[str] = None
    regime_trabalho: Optional[str] = None
    titulacao: Optional[str] = None
    experiencia_docencia_anos: Optional[int] = None
    link_lattes: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Infraestrutura (tabelas: ambiente + item_infraestrutura)
# ─────────────────────────────────────────────────────────────────────────────

class ItemInfraCreate(BaseModel):
    """Um item de equipamento ou mobiliário dentro de um ambiente."""

    tipo: str
    nome_item: str
    quantidade: Optional[int] = 1
    especificacoes: Optional[str] = None


class AmbienteCreate(BaseModel):
    """Um espaço físico (sala, laboratório, etc.) com seus itens."""

    categoria: str
    nome_ambiente: str
    quantidade: Optional[int] = 1
    area_m2: Optional[float] = None
    itens: list[ItemInfraCreate] = []


# ─────────────────────────────────────────────────────────────────────────────
# Payload Raiz (recebido pelo endpoint POST /api/ppc)
# ─────────────────────────────────────────────────────────────────────────────

class PPCPayload(BaseModel):
    """
    Payload completo enviado pelo frontend ao confirmar o envio do formulário.
    Agrupa todos os sub-modelos em uma única requisição.
    """

    ppc: PPCCreate
    membros: list[MembroCreate] = []
    coordenacao: Optional[CoordenacaoCreate] = None
    docentes: list[DocenteCreate] = []
    componentes: list[ComponenteCreate] = []
    ambientes: list[AmbienteCreate] = []
