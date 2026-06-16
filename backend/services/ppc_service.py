"""
services/ppc_service.py
Lógica de negócio para persistência do PPC completo no Supabase.

A inserção é sequencial seguindo a ordem de dependência das chaves estrangeiras:
  ppc → membros, coordenacao
  ppc → componentes → bibliografias
  ppc → docentes → docente_componente (exige IDs de componentes já inseridos)
  ppc → ambientes → itens_infraestrutura
"""

from datetime import datetime
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

    # Componentes devem ser inseridos antes dos docentes para que seus IDs
    # estejam disponíveis ao criar os vínculos na docente_componente.
    componente_id_por_codigo = _inserir_componentes(ppc_id, payload.componentes)

    _inserir_dependencias_componentes(componente_id_por_codigo, payload.componentes)

    docente_id_por_nome = _inserir_docentes(ppc_id, payload.docentes)

    _inserir_vinculos_docente_componente(
        docente_id_por_nome,
        componente_id_por_codigo,
        payload.docentes,
    )

    _inserir_ambientes(ppc_id, payload.ambientes)

    return {"ppc_id": ppc_id}


def deletar_ppc(ppc_id: str) -> None:
    """
    Remove um PPC e todas as suas dependências (via CASCADE).
    """
    response = supabase.table("ppc").delete().eq("id", ppc_id).execute()
    if not response.data:
        raise ValueError(f"PPC com id {ppc_id} não encontrado ou já deletado.")
        
def duplicar_ppc(ppc_id: str) -> dict:
    """
    Duplica um PPC existente e todas as suas dependências no Supabase.
    Retorna um dicionário com os dados básicos do novo PPC gerado.
    """
    # 1. Copiar PPC
    old_ppc = supabase.table("ppc").select("*").eq("id", ppc_id).execute().data
    if not old_ppc:
        raise ValueError("PPC não encontrado")
    
    ppc_data = old_ppc[0]
    del ppc_data["id"]
    nome_atual = ppc_data.get("nome_curso") or "PPC sem nome"
    ppc_data["nome_curso"] = f"{nome_atual} - Cópia"
    ppc_data["status_curso"] = "Rascunho"
    ppc_data["data_criacao"] = datetime.utcnow().isoformat()
    ppc_data["data_ultima_atualizacao"] = datetime.utcnow().isoformat()
    
    new_ppc = supabase.table("ppc").insert(ppc_data).execute().data[0]
    new_ppc_id = new_ppc["id"]

    # 2. Copiar Membros Institucionais
    membros = supabase.table("membro_institucional").select("*").eq("ppc_id", ppc_id).execute().data
    for m in membros:
        del m["id"]
        m["ppc_id"] = new_ppc_id
    if membros:
        supabase.table("membro_institucional").insert(membros).execute()

    # 3. Copiar Coordenação
    coords = supabase.table("coordenacao").select("*").eq("ppc_id", ppc_id).execute().data
    for c in coords:
        if "id" in c:
            del c["id"]
        c["ppc_id"] = new_ppc_id
    if coords:
        supabase.table("coordenacao").insert(coords).execute()

    # 4. Copiar Ambientes e Itens de Infraestrutura
    ambientes = supabase.table("ambiente").select("*").eq("ppc_id", ppc_id).execute().data
    for amb in ambientes:
        old_amb_id = amb["id"]
        del amb["id"]
        amb["ppc_id"] = new_ppc_id
        new_amb = supabase.table("ambiente").insert(amb).execute().data[0]
        
        itens = supabase.table("item_infraestrutura").select("*").eq("ambiente_id", old_amb_id).execute().data
        for item in itens:
            del item["id"]
            item["ambiente_id"] = new_amb["id"]
        if itens:
            supabase.table("item_infraestrutura").insert(itens).execute()

    # 5. Copiar Componentes e Bibliografias
    componentes = supabase.table("componente_curricular").select("*").eq("ppc_id", ppc_id).execute().data
    map_componentes = {}
    for comp in componentes:
        old_comp_id = comp["id"]
        del comp["id"]
        comp["ppc_id"] = new_ppc_id
        new_comp = supabase.table("componente_curricular").insert(comp).execute().data[0]
        map_componentes[old_comp_id] = new_comp["id"]
        
        bibs = supabase.table("bibliografia").select("*").eq("componente_id", old_comp_id).execute().data
        for b in bibs:
            del b["id"]
            b["componente_id"] = new_comp["id"]
        if bibs:
            supabase.table("bibliografia").insert(bibs).execute()

    # 6. Copiar Docentes
    docentes = supabase.table("docente").select("*").eq("ppc_id", ppc_id).execute().data
    map_docentes = {}
    for doc in docentes:
        old_doc_id = doc["id"]
        del doc["id"]
        doc["ppc_id"] = new_ppc_id
        new_doc = supabase.table("docente").insert(doc).execute().data[0]
        map_docentes[old_doc_id] = new_doc["id"]

    # 7. Copiar Vínculos (Docente - Componente)
    if map_componentes and map_docentes:
        old_doc_ids = list(map_docentes.keys())
        vinculos = supabase.table("docente_componente").select("*").in_("docente_id", old_doc_ids).execute().data
        new_vinculos = []
        for v in vinculos:
            if v["docente_id"] in map_docentes and v["componente_id"] in map_componentes:
                new_vinculos.append({
                    "docente_id": map_docentes[v["docente_id"]],
                    "componente_id": map_componentes[v["componente_id"]]
                })
        if new_vinculos:
            supabase.table("docente_componente").insert(new_vinculos).execute()

    # 8. Copiar Dependências (Componente - Componente)
    if map_componentes:
        old_comp_ids = list(map_componentes.keys())
        deps = supabase.table("componente_dependencia").select("*").in_("componente_alvo_id", old_comp_ids).execute().data
        new_deps = []
        for d in deps:
            if d["componente_base_id"] in map_componentes and d["componente_alvo_id"] in map_componentes:
                new_deps.append({
                    "componente_base_id": map_componentes[d["componente_base_id"]],
                    "componente_alvo_id": map_componentes[d["componente_alvo_id"]],
                    "tipo_vinculo": d["tipo_vinculo"]
                })
        if new_deps:
            supabase.table("componente_dependencia").insert(new_deps).execute()

    return {
        "id": new_ppc["id"],
        "nome_curso": new_ppc.get("nome_curso"),
        "status_curso": new_ppc.get("status_curso"),
        "data_ultima_atualizacao": new_ppc.get("data_ultima_atualizacao")
    }



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


def _inserir_componentes(ppc_id: str, componentes: list) -> dict[str, str]:
    """
    Insere cada componente curricular e suas referências bibliográficas.

    Os campos `pre_requisito_codigo` e `co_requisito_codigo` são excluídos
    do insert pois não existem na tabela `componente_curricular` — as
    dependências são persistidas separadamente em `componente_dependencia`.

    Returns:
        Mapa {codigo_do_componente: uuid_inserido} para uso posterior
        na criação dos vínculos docente_componente e componente_dependencia.
    """
    componente_id_por_codigo: dict[str, str] = {}

    for componente in componentes:
        bibliografias = componente.bibliografias

        # Exclui os campos auxiliares de dependência e bibliografias antes de inserir
        dados_componente = componente.model_dump(
            exclude={"bibliografias", "pre_requisito_codigo", "co_requisito_codigo"},
            exclude_none=True,
        )
        dados_componente["ppc_id"] = ppc_id

        response = supabase.table("componente_curricular").insert(dados_componente).execute()
        componente_id = response.data[0]["id"]
        componente_id_por_codigo[componente.codigo] = componente_id

        _inserir_bibliografias(componente_id, bibliografias)

    return componente_id_por_codigo


def _inserir_bibliografias(componente_id: str, bibliografias: list) -> None:
    """Insere as referências bibliográficas de um componente."""
    if not bibliografias:
        return

    rows = [
        {**b.model_dump(), "componente_id": componente_id}
        for b in bibliografias
    ]
    supabase.table("bibliografia").insert(rows).execute()


def _inserir_dependencias_componentes(
    componente_id_por_codigo: dict[str, str],
    componentes: list,
) -> None:
    """
    Cria os vínculos na tabela `componente_dependencia` para todos os
    componentes que possuem pré-requisito ou co-requisito declarado.

    Schema da tabela:
      - componente_base_id: o componente que é o requisito (o que vem antes)
      - componente_alvo_id: o componente que depende do base (o atual)
      - tipo_vinculo: "pre_requisito" ou "co_requisito"

    Componentes cujo código de dependência não está no mapa são ignorados.
    """
    rows = []

    for componente in componentes:
        alvo_id = componente_id_por_codigo.get(componente.codigo)
        if not alvo_id:
            continue

        if componente.pre_requisito_codigo:
            base_id = componente_id_por_codigo.get(componente.pre_requisito_codigo)
            if base_id:
                rows.append({
                    "componente_base_id": base_id,
                    "componente_alvo_id": alvo_id,
                    "tipo_vinculo":       "pre_requisito",
                })

        if componente.co_requisito_codigo:
            base_id = componente_id_por_codigo.get(componente.co_requisito_codigo)
            if base_id:
                rows.append({
                    "componente_base_id": base_id,
                    "componente_alvo_id": alvo_id,
                    "tipo_vinculo":       "co_requisito",
                })

    if rows:
        supabase.table("componente_dependencia").insert(rows).execute()


def _inserir_docentes(ppc_id: str, docentes: list) -> dict[str, str]:
    """
    Insere todos os docentes vinculados ao PPC.

    Returns:
        Mapa {nome_do_docente: uuid_inserido} para uso posterior
        na criação dos vínculos docente_componente.
    """
    if not docentes:
        return {}

    rows = [
        {
            **d.model_dump(
                exclude={"componentes_ministrados"}, exclude_none=True
            ),
            "ppc_id": ppc_id,
        }
        for d in docentes
    ]
    response = supabase.table("docente").insert(rows).execute()

    # Constrói o mapa nome → id a partir dos registros retornados pelo banco
    return {row["nome"]: row["id"] for row in response.data}


def _inserir_vinculos_docente_componente(
    docente_id_por_nome: dict[str, str],
    componente_id_por_codigo: dict[str, str],
    docentes: list,
) -> None:
    """
    Cria os vínculos na tabela docente_componente cruzando os IDs
    de docentes e componentes que foram inseridos nessa sessão.

    Componentes referenciados mas não encontrados no mapa (ex.: código
    inválido ou componente não cadastrado) são silenciosamente ignorados.
    """
    rows = []
    for docente in docentes:
        docente_id = docente_id_por_nome.get(docente.nome)
        if not docente_id:
            continue

        for codigo in docente.componentes_ministrados:
            componente_id = componente_id_por_codigo.get(codigo)
            if not componente_id:
                continue
            rows.append({
                "docente_id":     docente_id,
                "componente_id":  componente_id,
            })

    if rows:
        supabase.table("docente_componente").insert(rows).execute()


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
