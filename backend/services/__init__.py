from database import supabase
from models import (
    PPCCreate, PPCUpdate,
    ComponenteCreate, ComponenteUpdate,
    DependenciaCreate, BibliografiaCreate,
    MembroCreate, CoordenacaoCreate, CoordenacaoUpdate,
    DocenteCreate, DocenteUpdate, DocenteComponenteCreate,
    AmbienteCreate, AmbienteUpdate,
    ItemInfraCreate, ItemInfraUpdate,
)


# ──────────────────────────────────────────────
# PPC
# ──────────────────────────────────────────────
def criar_ppc(dados: PPCCreate):
    return supabase.table("ppc").insert(dados.model_dump(exclude_none=True)).execute()

def listar_ppcs():
    return supabase.table("ppc").select("*").order("data_criacao", desc=True).execute()

def buscar_ppc(ppc_id: str):
    return supabase.table("ppc").select("*").eq("id", ppc_id).single().execute()

def atualizar_ppc(ppc_id: str, dados: PPCUpdate):
    return supabase.table("ppc").update(dados.model_dump(exclude_none=True)).eq("id", ppc_id).execute()

def deletar_ppc(ppc_id: str):
    return supabase.table("ppc").delete().eq("id", ppc_id).execute()


# ──────────────────────────────────────────────
# Componente Curricular
# ──────────────────────────────────────────────
def criar_componente(dados: ComponenteCreate):
    return supabase.table("componente_curricular").insert(dados.model_dump(exclude_none=True)).execute()

def listar_componentes(ppc_id: str):
    return (
        supabase.table("componente_curricular")
        .select("*")
        .eq("ppc_id", ppc_id)
        .order("periodo")
        .execute()
    )

def atualizar_componente(comp_id: str, dados: ComponenteUpdate):
    return supabase.table("componente_curricular").update(dados.model_dump(exclude_none=True)).eq("id", comp_id).execute()

def deletar_componente(comp_id: str):
    return supabase.table("componente_curricular").delete().eq("id", comp_id).execute()


# ──────────────────────────────────────────────
# Dependência (Pré/Co-requisito)
# ──────────────────────────────────────────────
def criar_dependencia(dados: DependenciaCreate):
    return supabase.table("componente_dependencia").insert(dados.model_dump()).execute()

def listar_dependencias(componente_base_id: str):
    return supabase.table("componente_dependencia").select("*").eq("componente_base_id", componente_base_id).execute()

def deletar_dependencia(dep_id: str):
    return supabase.table("componente_dependencia").delete().eq("id", dep_id).execute()


# ──────────────────────────────────────────────
# Bibliografia
# ──────────────────────────────────────────────
def criar_bibliografia(dados: BibliografiaCreate):
    return supabase.table("bibliografia").insert(dados.model_dump()).execute()

def listar_bibliografias(componente_id: str):
    return supabase.table("bibliografia").select("*").eq("componente_id", componente_id).execute()

def deletar_bibliografia(bib_id: str):
    return supabase.table("bibliografia").delete().eq("id", bib_id).execute()


# ──────────────────────────────────────────────
# Membro Institucional
# ──────────────────────────────────────────────
def criar_membro(dados: MembroCreate):
    return supabase.table("membro_institucional").insert(dados.model_dump()).execute()

def listar_membros(ppc_id: str, tipo: str = None):
    query = supabase.table("membro_institucional").select("*").eq("ppc_id", ppc_id)
    if tipo:
        query = query.eq("tipo", tipo)
    return query.execute()

def deletar_membro(membro_id: str):
    return supabase.table("membro_institucional").delete().eq("id", membro_id).execute()


# ──────────────────────────────────────────────
# Coordenação
# ──────────────────────────────────────────────
def criar_coordenacao(dados: CoordenacaoCreate):
    return supabase.table("coordenacao").insert(dados.model_dump(exclude_none=True)).execute()

def buscar_coordenacao(ppc_id: str):
    return supabase.table("coordenacao").select("*").eq("ppc_id", ppc_id).single().execute()

def atualizar_coordenacao(coord_id: str, dados: CoordenacaoUpdate):
    return supabase.table("coordenacao").update(dados.model_dump(exclude_none=True)).eq("id", coord_id).execute()


# ──────────────────────────────────────────────
# Docente
# ──────────────────────────────────────────────
def criar_docente(dados: DocenteCreate):
    return supabase.table("docente").insert(dados.model_dump(exclude_none=True)).execute()

def listar_docentes(ppc_id: str):
    return supabase.table("docente").select("*").eq("ppc_id", ppc_id).execute()

def atualizar_docente(doc_id: str, dados: DocenteUpdate):
    return supabase.table("docente").update(dados.model_dump(exclude_none=True)).eq("id", doc_id).execute()

def deletar_docente(doc_id: str):
    return supabase.table("docente").delete().eq("id", doc_id).execute()


# ──────────────────────────────────────────────
# Vínculo Docente <-> Componente
# ──────────────────────────────────────────────
def vincular_docente_componente(dados: DocenteComponenteCreate):
    return supabase.table("docente_componente").insert(dados.model_dump()).execute()

def listar_vinculos_docente(docente_id: str):
    return supabase.table("docente_componente").select("*, componente_curricular(*)").eq("docente_id", docente_id).execute()

def deletar_vinculo_docente(vinculo_id: str):
    return supabase.table("docente_componente").delete().eq("id", vinculo_id).execute()


# ──────────────────────────────────────────────
# Ambiente
# ──────────────────────────────────────────────
def criar_ambiente(dados: AmbienteCreate):
    return supabase.table("ambiente").insert(dados.model_dump(exclude_none=True)).execute()

def listar_ambientes(ppc_id: str):
    return supabase.table("ambiente").select("*, item_infraestrutura(*)").eq("ppc_id", ppc_id).execute()

def atualizar_ambiente(amb_id: str, dados: AmbienteUpdate):
    return supabase.table("ambiente").update(dados.model_dump(exclude_none=True)).eq("id", amb_id).execute()

def deletar_ambiente(amb_id: str):
    return supabase.table("ambiente").delete().eq("id", amb_id).execute()


# ──────────────────────────────────────────────
# Item de Infraestrutura
# ──────────────────────────────────────────────
def criar_item_infra(dados: ItemInfraCreate):
    return supabase.table("item_infraestrutura").insert(dados.model_dump(exclude_none=True)).execute()

def listar_itens_infra(ambiente_id: str):
    return supabase.table("item_infraestrutura").select("*").eq("ambiente_id", ambiente_id).execute()

def atualizar_item_infra(item_id: str, dados: ItemInfraUpdate):
    return supabase.table("item_infraestrutura").update(dados.model_dump(exclude_none=True)).eq("id", item_id).execute()

def deletar_item_infra(item_id: str):
    return supabase.table("item_infraestrutura").delete().eq("id", item_id).execute()
