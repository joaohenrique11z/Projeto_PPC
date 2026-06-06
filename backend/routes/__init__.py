from fastapi import APIRouter, HTTPException
from models import (
    PPCCreate, PPCUpdate,
    ComponenteCreate, ComponenteUpdate,
    DependenciaCreate, BibliografiaCreate,
    MembroCreate, CoordenacaoCreate, CoordenacaoUpdate,
    DocenteCreate, DocenteUpdate, DocenteComponenteCreate,
    AmbienteCreate, AmbienteUpdate,
    ItemInfraCreate, ItemInfraUpdate,
)
import services

router = APIRouter()


# ══════════════════════════════════════════════
# PPC
# ══════════════════════════════════════════════
@router.post("/ppc", status_code=201)
def criar_ppc(dados: PPCCreate):
    res = services.criar_ppc(dados)
    return {"status": "ok", "data": res.data}

@router.get("/ppc")
def listar_ppcs():
    res = services.listar_ppcs()
    return res.data

@router.get("/ppc/{ppc_id}")
def buscar_ppc(ppc_id: str):
    try:
        res = services.buscar_ppc(ppc_id)
        return res.data
    except Exception:
        raise HTTPException(status_code=404, detail="PPC não encontrado")

@router.put("/ppc/{ppc_id}")
def atualizar_ppc(ppc_id: str, dados: PPCUpdate):
    res = services.atualizar_ppc(ppc_id, dados)
    return {"status": "ok", "data": res.data}

@router.delete("/ppc/{ppc_id}", status_code=204)
def deletar_ppc(ppc_id: str):
    services.deletar_ppc(ppc_id)


# ══════════════════════════════════════════════
# Componente Curricular
# ══════════════════════════════════════════════
@router.post("/componentes", status_code=201)
def criar_componente(dados: ComponenteCreate):
    res = services.criar_componente(dados)
    return {"status": "ok", "data": res.data}

@router.get("/ppc/{ppc_id}/componentes")
def listar_componentes(ppc_id: str):
    res = services.listar_componentes(ppc_id)
    return res.data

@router.put("/componentes/{comp_id}")
def atualizar_componente(comp_id: str, dados: ComponenteUpdate):
    res = services.atualizar_componente(comp_id, dados)
    return {"status": "ok", "data": res.data}

@router.delete("/componentes/{comp_id}", status_code=204)
def deletar_componente(comp_id: str):
    services.deletar_componente(comp_id)


# ══════════════════════════════════════════════
# Dependências (Pré/Co-requisitos)
# ══════════════════════════════════════════════
@router.post("/dependencias", status_code=201)
def criar_dependencia(dados: DependenciaCreate):
    res = services.criar_dependencia(dados)
    return {"status": "ok", "data": res.data}

@router.get("/componentes/{comp_id}/dependencias")
def listar_dependencias(comp_id: str):
    res = services.listar_dependencias(comp_id)
    return res.data

@router.delete("/dependencias/{dep_id}", status_code=204)
def deletar_dependencia(dep_id: str):
    services.deletar_dependencia(dep_id)


# ══════════════════════════════════════════════
# Bibliografia
# ══════════════════════════════════════════════
@router.post("/bibliografias", status_code=201)
def criar_bibliografia(dados: BibliografiaCreate):
    res = services.criar_bibliografia(dados)
    return {"status": "ok", "data": res.data}

@router.get("/componentes/{comp_id}/bibliografias")
def listar_bibliografias(comp_id: str):
    res = services.listar_bibliografias(comp_id)
    return res.data

@router.delete("/bibliografias/{bib_id}", status_code=204)
def deletar_bibliografia(bib_id: str):
    services.deletar_bibliografia(bib_id)


# ══════════════════════════════════════════════
# Membros Institucionais
# ══════════════════════════════════════════════
@router.post("/membros", status_code=201)
def criar_membro(dados: MembroCreate):
    res = services.criar_membro(dados)
    return {"status": "ok", "data": res.data}

@router.get("/ppc/{ppc_id}/membros")
def listar_membros(ppc_id: str, tipo: str = None):
    res = services.listar_membros(ppc_id, tipo)
    return res.data

@router.delete("/membros/{membro_id}", status_code=204)
def deletar_membro(membro_id: str):
    services.deletar_membro(membro_id)


# ══════════════════════════════════════════════
# Coordenação
# ══════════════════════════════════════════════
@router.post("/coordenacao", status_code=201)
def criar_coordenacao(dados: CoordenacaoCreate):
    res = services.criar_coordenacao(dados)
    return {"status": "ok", "data": res.data}

@router.get("/ppc/{ppc_id}/coordenacao")
def buscar_coordenacao(ppc_id: str):
    try:
        res = services.buscar_coordenacao(ppc_id)
        return res.data
    except Exception:
        return None

@router.put("/coordenacao/{coord_id}")
def atualizar_coordenacao(coord_id: str, dados: CoordenacaoUpdate):
    res = services.atualizar_coordenacao(coord_id, dados)
    return {"status": "ok", "data": res.data}


# ══════════════════════════════════════════════
# Docentes
# ══════════════════════════════════════════════
@router.post("/docentes", status_code=201)
def criar_docente(dados: DocenteCreate):
    res = services.criar_docente(dados)
    return {"status": "ok", "data": res.data}

@router.get("/ppc/{ppc_id}/docentes")
def listar_docentes(ppc_id: str):
    res = services.listar_docentes(ppc_id)
    return res.data

@router.put("/docentes/{doc_id}")
def atualizar_docente(doc_id: str, dados: DocenteUpdate):
    res = services.atualizar_docente(doc_id, dados)
    return {"status": "ok", "data": res.data}

@router.delete("/docentes/{doc_id}", status_code=204)
def deletar_docente(doc_id: str):
    services.deletar_docente(doc_id)


# ══════════════════════════════════════════════
# Vínculo Docente <-> Componente
# ══════════════════════════════════════════════
@router.post("/docentes/vinculos", status_code=201)
def vincular_docente_componente(dados: DocenteComponenteCreate):
    res = services.vincular_docente_componente(dados)
    return {"status": "ok", "data": res.data}

@router.get("/docentes/{docente_id}/vinculos")
def listar_vinculos_docente(docente_id: str):
    res = services.listar_vinculos_docente(docente_id)
    return res.data

@router.delete("/docentes/vinculos/{vinculo_id}", status_code=204)
def deletar_vinculo_docente(vinculo_id: str):
    services.deletar_vinculo_docente(vinculo_id)


# ══════════════════════════════════════════════
# Ambientes
# ══════════════════════════════════════════════
@router.post("/ambientes", status_code=201)
def criar_ambiente(dados: AmbienteCreate):
    res = services.criar_ambiente(dados)
    return {"status": "ok", "data": res.data}

@router.get("/ppc/{ppc_id}/ambientes")
def listar_ambientes(ppc_id: str):
    res = services.listar_ambientes(ppc_id)
    return res.data

@router.put("/ambientes/{amb_id}")
def atualizar_ambiente(amb_id: str, dados: AmbienteUpdate):
    res = services.atualizar_ambiente(amb_id, dados)
    return {"status": "ok", "data": res.data}

@router.delete("/ambientes/{amb_id}", status_code=204)
def deletar_ambiente(amb_id: str):
    services.deletar_ambiente(amb_id)


# ══════════════════════════════════════════════
# Itens de Infraestrutura
# ══════════════════════════════════════════════
@router.post("/itens-infra", status_code=201)
def criar_item_infra(dados: ItemInfraCreate):
    res = services.criar_item_infra(dados)
    return {"status": "ok", "data": res.data}

@router.get("/ambientes/{amb_id}/itens")
def listar_itens_infra(amb_id: str):
    res = services.listar_itens_infra(amb_id)
    return res.data

@router.put("/itens-infra/{item_id}")
def atualizar_item_infra(item_id: str, dados: ItemInfraUpdate):
    res = services.atualizar_item_infra(item_id, dados)
    return {"status": "ok", "data": res.data}

@router.delete("/itens-infra/{item_id}", status_code=204)
def deletar_item_infra(item_id: str):
    services.deletar_item_infra(item_id)
