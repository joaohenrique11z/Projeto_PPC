"""
services/ppc_service.py
Lógica de negócio para persistência do PPC completo no Supabase.

A inserção é sequencial seguindo a ordem de dependência das chaves estrangeiras:
  ppc → membros, coordenacao, docentes
  ppc → componentes → bibliografias
  ppc → ambientes → itens_infraestrutura
"""

from database import supabase
from models.ppc import PPCPayload


def salvar_ppc(payload: PPCPayload) -> dict:
    """
    Persiste o PPC completo no Supabase em cascata.

    Args:
        payload: Todos os dados do formulário agrupados.

    Returns:
        Dicionário com o ppc_id gerado pelo banco.

    Raises:
        Exception: Propagada com a mensagem de qual etapa falhou.
    """
    ppc_id = _inserir_ppc(payload.ppc.model_dump(exclude_none=True))

    _inserir_membros(ppc_id, payload.membros)
    _inserir_coordenacao(ppc_id, payload.coordenacao)
    _inserir_docentes(ppc_id, payload.docentes)
    _inserir_componentes(ppc_id, payload.componentes)
    _inserir_ambientes(ppc_id, payload.ambientes)

    return {"ppc_id": ppc_id}


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS PRIVADOS
# ─────────────────────────────────────────────────────────────────────────────

def _inserir_ppc(dados: dict) -> str:
    """Insere os dados gerais do PPC e retorna o UUID gerado."""
    response = supabase.table("ppc").insert(dados).execute()
    return response.data[0]["id"]


def _inserir_membros(ppc_id: str, membros: list) -> None:
    """Insere todos os membros institucionais vinculados ao PPC."""
    if not membros:
        return

    rows = [
        {**m.model_dump(), "ppc_id": ppc_id}
        for m in membros
    ]
    supabase.table("membro_institucional").insert(rows).execute()


def _inserir_coordenacao(ppc_id: str, coordenacao) -> None:
    """Insere os dados do coordenador do curso, se informados."""
    if not coordenacao:
        return

    dados = {**coordenacao.model_dump(exclude_none=True), "ppc_id": ppc_id}
    supabase.table("coordenacao").insert(dados).execute()


def _inserir_docentes(ppc_id: str, docentes: list) -> None:
    """Insere todos os docentes vinculados ao PPC."""
    if not docentes:
        return

    rows = [
        {**d.model_dump(exclude_none=True), "ppc_id": ppc_id}
        for d in docentes
    ]
    supabase.table("docente").insert(rows).execute()


def _inserir_componentes(ppc_id: str, componentes: list) -> None:
    """
    Insere cada componente curricular e, em seguida,
    suas referências bibliográficas.
    """
    for componente in componentes:
        bibliografias = componente.bibliografias

        # Remove as bibliografias do dict antes de inserir o componente
        dados_componente = componente.model_dump(exclude={"bibliografias"}, exclude_none=True)
        dados_componente["ppc_id"] = ppc_id

        response = supabase.table("componente_curricular").insert(dados_componente).execute()
        componente_id = response.data[0]["id"]

        _inserir_bibliografias(componente_id, bibliografias)


def _inserir_bibliografias(componente_id: str, bibliografias: list) -> None:
    """Insere as referências bibliográficas de um componente."""
    if not bibliografias:
        return

    rows = [
        {**b.model_dump(), "componente_id": componente_id}
        for b in bibliografias
    ]
    supabase.table("bibliografia").insert(rows).execute()


def _inserir_ambientes(ppc_id: str, ambientes: list) -> None:
    """
    Insere cada ambiente físico e, em seguida,
    os itens de infraestrutura que ele contém.
    """
    for ambiente in ambientes:
        itens = ambiente.itens

        dados_ambiente = ambiente.model_dump(exclude={"itens"}, exclude_none=True)
        dados_ambiente["ppc_id"] = ppc_id

        response = supabase.table("ambiente").insert(dados_ambiente).execute()
        ambiente_id = response.data[0]["id"]

        _inserir_itens_infraestrutura(ambiente_id, itens)


def _inserir_itens_infraestrutura(ambiente_id: str, itens: list) -> None:
    """Insere os itens de equipamento/mobiliário de um ambiente."""
    if not itens:
        return

    rows = [
        {**item.model_dump(exclude_none=True), "ambiente_id": ambiente_id}
        for item in itens
    ]
    supabase.table("item_infraestrutura").insert(rows).execute()
