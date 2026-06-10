from pydantic import BaseModel
from typing import Optional
from uuid import UUID


# ──────────────────────────────────────────────
# PPC  (tabela principal)
# ──────────────────────────────────────────────
class PPCCreate(BaseModel):
    # Proponente
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
    # Curso
    nome_curso: Optional[str] = None
    area_conhecimento: Optional[str] = None
    nivel: Optional[str] = None
    modalidade_curso: Optional[str] = None
    titulacao: Optional[str] = None
    ch_total_relogio: Optional[int] = None
    ch_total_aula: Optional[int] = None
    duracao_aula_minutos: Optional[int] = None
    atividades_complementares: Optional[int] = None
    ch_extensao: Optional[int] = None
    integralizacao_min_semestres: Optional[int] = None
    integralizacao_max_semestres: Optional[int] = None
    formas_acesso: Optional[str] = None
    pre_requisito_ingresso: Optional[str] = None
    vagas_anuais: Optional[int] = None
    vagas_turno: Optional[int] = None
    turnos: Optional[str] = None
    regime_matricula: Optional[str] = None
    periodicidade_letiva: Optional[str] = None
    semanas_letivas: Optional[int] = None
    inicio_curso: Optional[str] = None
    matriz_curricular_alterada: Optional[str] = None
    cursos_tecnicos_afins: Optional[str] = None
    outros_cursos_campus: Optional[str] = None
    # Avaliação
    conceito_cc: Optional[str] = None
    conceito_cpc: Optional[str] = None
    conceito_enade: Optional[str] = None
    igc: Optional[str] = None
    tipo_reformulacao: Optional[str] = None
    status_curso: Optional[str] = None


class PPCUpdate(PPCCreate):
    pass


# ──────────────────────────────────────────────
# Componente Curricular
# ──────────────────────────────────────────────
class ComponenteCreate(BaseModel):
    ppc_id: str
    codigo: str
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


class ComponenteUpdate(BaseModel):
    codigo: Optional[str] = None
    nome: Optional[str] = None
    periodo: Optional[int] = None
    tipo: Optional[str] = None
    nucleo_curricular: Optional[str] = None
    sub_nucleo: Optional[str] = None
    creditos: Optional[int] = None
    ch_total_aula: Optional[int] = None
    ch_total_relogio: Optional[int] = None
    ch_teorica: Optional[int] = None
    ch_pratica: Optional[int] = None
    ch_extensao: Optional[int] = None
    ementa: Optional[str] = None


# ──────────────────────────────────────────────
# Dependência entre Componentes
# ──────────────────────────────────────────────
class DependenciaCreate(BaseModel):
    componente_base_id: str
    componente_alvo_id: str
    tipo_vinculo: str  # "Pre_Requisito" | "Co_Requisito"


# ──────────────────────────────────────────────
# Bibliografia
# ──────────────────────────────────────────────
class BibliografiaCreate(BaseModel):
    componente_id: str
    tipo: str  # "Basica" | "Complementar"
    referencia_texto: str


# ──────────────────────────────────────────────
# Membro Institucional
# ──────────────────────────────────────────────
class MembroCreate(BaseModel):
    ppc_id: str
    tipo: str   # "Instituicao" | "Comissao"
    cargo: str
    nome: str


# ──────────────────────────────────────────────
# Coordenação
# ──────────────────────────────────────────────
class CoordenacaoCreate(BaseModel):
    ppc_id: str
    nome_professor: str
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


class CoordenacaoUpdate(BaseModel):
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


# ──────────────────────────────────────────────
# Docente
# ──────────────────────────────────────────────
class DocenteCreate(BaseModel):
    ppc_id: str
    nome: str
    formacao_academica: Optional[str] = None
    regime_trabalho: Optional[str] = None
    titulacao: Optional[str] = None
    experiencia_docencia_anos: Optional[int] = None
    link_lattes: Optional[str] = None


class DocenteUpdate(BaseModel):
    nome: Optional[str] = None
    formacao_academica: Optional[str] = None
    regime_trabalho: Optional[str] = None
    titulacao: Optional[str] = None
    experiencia_docencia_anos: Optional[int] = None
    link_lattes: Optional[str] = None


# ──────────────────────────────────────────────
# Vínculo Docente <-> Componente
# ──────────────────────────────────────────────
class DocenteComponenteCreate(BaseModel):
    docente_id: str
    componente_id: str


# ──────────────────────────────────────────────
# Ambiente
# ──────────────────────────────────────────────
class AmbienteCreate(BaseModel):
    ppc_id: str
    categoria: str  # "Áreas comuns" | "Áreas do departamento/curso"
    nome_ambiente: str
    quantidade: Optional[int] = 1
    area_m2: Optional[float] = None


class AmbienteUpdate(BaseModel):
    categoria: Optional[str] = None
    nome_ambiente: Optional[str] = None
    quantidade: Optional[int] = None
    area_m2: Optional[float] = None


# ──────────────────────────────────────────────
# Item de Infraestrutura
# ──────────────────────────────────────────────
class ItemInfraCreate(BaseModel):
    ambiente_id: str
    tipo: str  # "Equipamentos" | "Mobiliário"
    nome_item: str
    quantidade: Optional[int] = 1
    especificacoes: Optional[str] = None


class ItemInfraUpdate(BaseModel):
    tipo: Optional[str] = None
    nome_item: Optional[str] = None
    quantidade: Optional[int] = None
    especificacoes: Optional[str] = None
