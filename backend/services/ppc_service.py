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


def carregar_ppc(ppc_id: str) -> dict:
    """
    Busca um PPC completo com todas as entidades filhas no Supabase.

    Retorna o payload no mesmo formato do PPCPayload para ser consumido
    pelo frontend na tela de edição.

    Args:
        ppc_id: UUID do PPC a ser carregado.

    Returns:
        Dicionário com ppc, coordenacao, membros, componentes, docentes e ambientes.

    Raises:
        ValueError: Se o PPC não for encontrado.
    """
    ppc_rows = supabase.table("ppc").select("*").eq("id", ppc_id).execute().data
    if not ppc_rows:
        raise ValueError("PPC não encontrado")
    ppc_data = {k: v for k, v in ppc_rows[0].items() if k not in ("id",)}

    coord_rows = supabase.table("coordenacao").select("*").eq("ppc_id", ppc_id).execute().data
    coordenacao = {k: v for k, v in coord_rows[0].items() if k not in ("id", "ppc_id")} if coord_rows else None

    membro_rows = supabase.table("membro_institucional").select("*").eq("ppc_id", ppc_id).execute().data
    membros = [
        {k: v for k, v in m.items() if k not in ("id", "ppc_id")}
        for m in membro_rows
    ]

    comp_rows = supabase.table("componente_curricular").select("*").eq("ppc_id", ppc_id).execute().data
    # Mapa UUID → código para resolver dependências
    id_para_codigo = {c["id"]: c.get("codigo") for c in comp_rows}

    componentes = []
    for comp in comp_rows:
        comp_id = comp["id"]

        bibs = supabase.table("bibliografia").select("*").eq("componente_id", comp_id).execute().data
        deps = supabase.table("componente_dependencia").select("*").eq("componente_alvo_id", comp_id).execute().data

        pre_req_codigo = None
        co_req_codigo = None
        for dep in deps:
            if dep["tipo_vinculo"] == "pre_requisito":
                pre_req_codigo = id_para_codigo.get(dep["componente_base_id"])
            elif dep["tipo_vinculo"] == "co_requisito":
                co_req_codigo = id_para_codigo.get(dep["componente_base_id"])

        componentes.append({
            **{k: v for k, v in comp.items() if k not in ("id", "ppc_id")},
            "pre_requisito_codigo": pre_req_codigo,
            "co_requisito_codigo": co_req_codigo,
            "bibliografias": [
                {"tipo": b["tipo"], "referencia_texto": b["referencia_texto"]}
                for b in bibs
            ],
        })

    doc_rows = supabase.table("docente").select("*").eq("ppc_id", ppc_id).execute().data
    docentes = []
    for doc in doc_rows:
        doc_id = doc["id"]
        vinculos = supabase.table("docente_componente").select("*").eq("docente_id", doc_id).execute().data
        comp_codigos = [
            id_para_codigo[v["componente_id"]]
            for v in vinculos
            if v["componente_id"] in id_para_codigo
        ]
        docentes.append({
            **{k: v for k, v in doc.items() if k not in ("id", "ppc_id")},
            "componentes_ministrados": comp_codigos,
        })

    amb_rows = supabase.table("ambiente").select("*").eq("ppc_id", ppc_id).execute().data
    ambientes = []
    for amb in amb_rows:
        amb_id = amb["id"]
        itens = supabase.table("item_infraestrutura").select("*").eq("ambiente_id", amb_id).execute().data
        ambientes.append({
            **{k: v for k, v in amb.items() if k not in ("id", "ppc_id")},
            "itens": [
                {k: v for k, v in item.items() if k not in ("id", "ambiente_id")}
                for item in itens
            ],
        })

    return {
        "ppc": ppc_data,
        "coordenacao": coordenacao,
        "membros": membros,
        "componentes": componentes,
        "docentes": docentes,
        "ambientes": ambientes,
    }


def atualizar_ppc(ppc_id: str, payload: PPCPayload) -> dict:
    """
    Atualiza um PPC existente usando estratégia delete + reinsert.

    1. Apaga todas as entidades filhas na ordem correta de FK.
    2. Atualiza os campos da tabela ppc.
    3. Reinsere as entidades com os novos dados, reutilizando os helpers privados.

    Args:
        ppc_id: UUID do PPC a atualizar.
        payload: Payload completo com os novos dados.

    Returns:
        Dicionário com o ppc_id atualizado.
    """
    # Coleta IDs das entidades filhas para deleção em cascata
    comp_ids = [
        c["id"] for c in
        supabase.table("componente_curricular").select("id").eq("ppc_id", ppc_id).execute().data
    ]
    doc_ids = [
        d["id"] for d in
        supabase.table("docente").select("id").eq("ppc_id", ppc_id).execute().data
    ]
    amb_ids = [
        a["id"] for a in
        supabase.table("ambiente").select("id").eq("ppc_id", ppc_id).execute().data
    ]

    # Deleção respeitando a ordem das foreign keys
    if doc_ids:
        supabase.table("docente_componente").delete().in_("docente_id", doc_ids).execute()
    if comp_ids:
        supabase.table("componente_dependencia").delete().in_("componente_alvo_id", comp_ids).execute()
        supabase.table("bibliografia").delete().in_("componente_id", comp_ids).execute()
    supabase.table("componente_curricular").delete().eq("ppc_id", ppc_id).execute()
    supabase.table("docente").delete().eq("ppc_id", ppc_id).execute()
    if amb_ids:
        supabase.table("item_infraestrutura").delete().in_("ambiente_id", amb_ids).execute()
    supabase.table("ambiente").delete().eq("ppc_id", ppc_id).execute()
    supabase.table("membro_institucional").delete().eq("ppc_id", ppc_id).execute()
    supabase.table("coordenacao").delete().eq("ppc_id", ppc_id).execute()

    # Atualiza os campos gerais do PPC
    update_data = payload.ppc.model_dump(exclude_none=True)
    update_data["data_ultima_atualizacao"] = datetime.utcnow().isoformat()
    supabase.table("ppc").update(update_data).eq("id", ppc_id).execute()

    # Reinsere todas as entidades filhas com os novos dados
    _inserir_membros(ppc_id, payload.membros)
    _inserir_coordenacao(ppc_id, payload.coordenacao)
    componente_id_por_codigo = _inserir_componentes(ppc_id, payload.componentes)
    _inserir_dependencias_componentes(componente_id_por_codigo, payload.componentes)
    docente_id_por_nome = _inserir_docentes(ppc_id, payload.docentes)
    _inserir_vinculos_docente_componente(docente_id_por_nome, componente_id_por_codigo, payload.docentes)
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

def aplicar_delta_ppc(ppc_id: str, delta: dict) -> dict:
    """
    Aplica um delta (mudanças parciais) a um PPC existente.

    O delta é um dicionário parcial contendo apenas os campos/arrays que foram alterados.
    Campos não presentes no delta são ignorados (não atualizados).

    Estratégia para arrays (membros, componentes, docentes, ambientes):
    - Se presente no delta, DELETE todos os antigos + INSERT os novos (reutiliza logic de salvar_ppc)
    - Se não presente no delta, deixa intocado

    Estratégia para campos simples (ppc.nome_curso, ppc.ch_total_relogio, etc):
    - Se presente no delta, UPDATE direto
    - Se não presente no delta, deixa intocado

    Args:
        ppc_id: UUID do PPC a atualizar
        delta: Dicionário com campos alterados, e.g.:
            {
                "ppc": {"nome_curso": "novo nome", "ch_total_relogio": 2400},
                "membros": [...],  # se vazio, deleta todos os membros
                "componentes": [...],  # se omitido, não toca em componentes
            }

    Returns:
        {"success": True, "ppc_id": ppc_id, "version": timestamp}

    Raises:
        ValueError: Se PPC não existir
    """
    # Verifica se PPC existe
    ppc_check = supabase.table("ppc").select("id").eq("id", ppc_id).execute().data
    if not ppc_check:
        raise ValueError(f"PPC com id {ppc_id} não encontrado")

    # 1. Atualizar campos simples do PPC (se presentes no delta)
    if "ppc" in delta and delta["ppc"]:
        update_data = delta["ppc"]
        update_data["data_ultima_atualizacao"] = datetime.utcnow().isoformat()
        supabase.table("ppc").update(update_data).eq("id", ppc_id).execute()

    # 2. Membros: se presente no delta, delete all + insert new
    if "membros" in delta:
        supabase.table("membro_institucional").delete().eq("ppc_id", ppc_id).execute()
        if delta["membros"]:
            _inserir_membros(ppc_id, delta["membros"])

    # 3. Coordenação: se presente no delta, delete + insert new
    if "coordenacao" in delta:
        supabase.table("coordenacao").delete().eq("ppc_id", ppc_id).execute()
        if delta["coordenacao"]:
            _inserir_coordenacao(ppc_id, delta["coordenacao"])

    # 4. Componentes: se presente, delete all (com cascata) + insert new
    if "componentes" in delta:
        # Coleta IDs dos componentes atuais para deleção em cascata
        comp_ids = [
            c["id"] for c in
            supabase.table("componente_curricular").select("id").eq("ppc_id", ppc_id).execute().data
        ]
        if comp_ids:
            supabase.table("componente_dependencia").delete().in_("componente_alvo_id", comp_ids).execute()
            supabase.table("componente_dependencia").delete().in_("componente_base_id", comp_ids).execute()
            supabase.table("bibliografia").delete().in_("componente_id", comp_ids).execute()
        supabase.table("componente_curricular").delete().eq("ppc_id", ppc_id).execute()

        # Reinsere componentes e dependências
        if delta["componentes"]:
            componente_id_por_codigo = _inserir_componentes(ppc_id, delta["componentes"])
            _inserir_dependencias_componentes(componente_id_por_codigo, delta["componentes"])

    # 5. Docentes: se presente, delete all (com cascata) + insert new
    if "docentes" in delta:
        doc_ids = [
            d["id"] for d in
            supabase.table("docente").select("id").eq("ppc_id", ppc_id).execute().data
        ]
        if doc_ids:
            supabase.table("docente_componente").delete().in_("docente_id", doc_ids).execute()
        supabase.table("docente").delete().eq("ppc_id", ppc_id).execute()

        # Reinsere docentes e vínculos (precisa de componentes já existentes)
        if delta["docentes"]:
            # Busca IDs dos componentes existentes (não deletados)
            comp_rows = supabase.table("componente_curricular").select("id, codigo").eq("ppc_id", ppc_id).execute().data
            componente_id_por_codigo = {c["codigo"]: c["id"] for c in comp_rows}

            docente_id_por_nome = _inserir_docentes(ppc_id, delta["docentes"])
            _inserir_vinculos_docente_componente(docente_id_por_nome, componente_id_por_codigo, delta["docentes"])

    # 6. Ambientes: se presente, delete all (com cascata) + insert new
    if "ambientes" in delta:
        amb_ids = [
            a["id"] for a in
            supabase.table("ambiente").select("id").eq("ppc_id", ppc_id).execute().data
        ]
        if amb_ids:
            supabase.table("item_infraestrutura").delete().in_("ambiente_id", amb_ids).execute()
        supabase.table("ambiente").delete().eq("ppc_id", ppc_id).execute()

        # Reinsere ambientes
        if delta["ambientes"]:
            _inserir_ambientes(ppc_id, delta["ambientes"])

    # Retorna sucesso com versioning
    timestamp = datetime.utcnow().isoformat()
    return {
        "success": True,
        "ppc_id": ppc_id,
        "version": timestamp,
        "message": "Alterações salvas automaticamente"
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
