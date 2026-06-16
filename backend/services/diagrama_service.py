"""
services/diagrama_service.py

Gera o diagrama de matriz curricular (fluxograma de pré-requisitos
agrupado por períodos) e exporta um arquivo .docx contendo a imagem.

Fluxo:
  1. Buscar componentes e dependências do ppc_id no Supabase.
  2. Montar o grafo com Graphviz (subgrafos por período, cores por núcleo).
  3. Renderizar como PNG temporário.
  4. Criar .docx com python-docx inserindo o PNG.
  5. Retornar os caminhos dos arquivos temporários para limpeza posterior.
"""

import os
import tempfile
import graphviz
from docx import Document
from docx.shared import Inches
from database import supabase

# Garante que o executável dot do Graphviz seja encontrado no Windows,
# mesmo quando o PATH do sistema ainda não foi recarregado após a instalação.
_GRAPHVIZ_BIN = r"C:\Program Files\Graphviz\bin"
if os.path.isdir(_GRAPHVIZ_BIN) and _GRAPHVIZ_BIN not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _GRAPHVIZ_BIN + os.pathsep + os.environ.get("PATH", "")



# Mapeamento de núcleo curricular → cor de preenchimento (tons pastéis)
CORES_NUCLEO: dict[str, str] = {
    "Básico":          "#AED6F1",  # azul claro
    "Específico":      "#A9DFBF",  # verde claro
    "Profissional":    "#F9E79F",  # amarelo claro
    "Optativo":        "#F5CBA7",  # laranja claro
    "Extensão":        "#D7BDE2",  # lilás claro
}
COR_PADRAO = "#E8E8E8"  # cinza claro para núcleos não mapeados


def _buscar_componentes(ppc_id: str) -> list[dict]:
    """
    Retorna todos os componentes curriculares de um PPC.

    Args:
        ppc_id: UUID do PPC.

    Returns:
        Lista de dicionários com os campos do componente_curricular.
    """
    response = (
        supabase
        .table("componente_curricular")
        .select("id, nome, periodo, nucleo_curricular, ch_total_relogio, ch_total_aula")
        .eq("ppc_id", ppc_id)
        .order("periodo")
        .execute()
    )
    return response.data or []


def _buscar_dependencias(ppc_id: str) -> list[dict]:
    """
    Retorna todas as dependências entre componentes que pertencem ao PPC.

    A tabela componente_dependencia não tem ppc_id diretamente, por isso
    filtramos via join com componente_curricular.

    Args:
        ppc_id: UUID do PPC.

    Returns:
        Lista de dicts com campos componente_base_id e componente_alvo_id.
    """
    # Busca os IDs dos componentes deste PPC para filtrar as arestas
    response = (
        supabase
        .table("componente_dependencia")
        .select(
            "componente_base_id, componente_alvo_id, "
            "componente_curricular!componente_dependencia_componente_base_id_fkey(ppc_id)"
        )
        .execute()
    )

    deps = response.data or []

    # Filtra apenas arestas cujo componente_base pertence a este ppc_id
    return [
        d for d in deps
        if d.get("componente_curricular", {}).get("ppc_id") == ppc_id
    ]


def _agrupados_por_periodo(componentes: list[dict]) -> dict[int, list[dict]]:
    """
    Organiza os componentes em um dicionário indexado pelo período.

    Args:
        componentes: Lista de componentes curriculares.

    Returns:
        Dict { periodo: [componente, ...] }.
    """
    grupos: dict[int, list[dict]] = {}
    for comp in componentes:
        periodo = comp.get("periodo", 0)
        grupos.setdefault(periodo, []).append(comp)
    return grupos


def _label_componente(comp: dict) -> str:
    """
    Monta o label de texto exibido dentro do nó do componente.

    Args:
        comp: Dicionário com dados do componente.

    Returns:
        String de label formatada.
    """
    nome = comp.get("nome", "?")
    ch_rel = comp.get("ch_total_relogio") or 0
    ch_aula = comp.get("ch_total_aula") or 0
    return f"{nome}\n{ch_rel}h/r | {ch_aula}h/a"


def gerar_diagrama_docx(ppc_id: str) -> tuple[str, str]:
    """
    Gera o diagrama de matriz curricular como PNG e depois como .docx.

    Args:
        ppc_id: UUID do PPC a ser diagramado.

    Returns:
        Tupla (caminho_docx, caminho_png) com os arquivos temporários gerados.

    Raises:
        ValueError: Se nenhum componente for encontrado para o ppc_id.
    """
    componentes = _buscar_componentes(ppc_id)
    if not componentes:
        raise ValueError(f"Nenhum componente curricular encontrado para o PPC '{ppc_id}'.")

    dependencias = _buscar_dependencias(ppc_id)

    # ── Configuração global do grafo ──────────────────────────────────────────
    grafo = graphviz.Digraph(
        name="matriz_curricular",
        graph_attr={
            "rankdir": "TB",
            "splines": "ortho",
            "nodesep": "0.5",
            "ranksep": "0.8",
            "fontname": "Helvetica",
            "bgcolor": "white",
        },
        node_attr={
            "shape": "box",
            "style": "filled,rounded",
            "fontname": "Helvetica",
            "fontsize": "9",
            "margin": "0.15",
        },
        edge_attr={
            "arrowsize": "0.7",
            "color": "#555555",
        },
    )

    # ── Subgrafos por período (rank=same para alinhamento horizontal) ─────────
    grupos = _agrupados_por_periodo(componentes)
    for periodo in sorted(grupos.keys()):
        with grafo.subgraph(name=f"cluster_periodo_{periodo}") as sub:
            sub.attr(
                label=f"  {periodo}º Período  ",
                style="rounded,filled",
                color="#CCCCCC",
                fillcolor="#F7F7F7",
                fontname="Helvetica",
                fontsize="10",
                fontcolor="#333333",
            )
            sub.attr(rank="same")
            for comp in grupos[periodo]:
                nucleo = comp.get("nucleo_curricular") or ""
                cor = CORES_NUCLEO.get(nucleo, COR_PADRAO)
                sub.node(
                    comp["id"],
                    label=_label_componente(comp),
                    fillcolor=cor,
                )

    # ── Arestas de dependência ────────────────────────────────────────────────
    for dep in dependencias:
        grafo.edge(dep["componente_base_id"], dep["componente_alvo_id"])

    # ── Renderizar PNG em diretório temporário ────────────────────────────────
    tmp_dir = tempfile.mkdtemp()
    png_base = os.path.join(tmp_dir, "diagrama")

    # graphviz.render grava o arquivo como <base>.png
    grafo.render(
        filename=png_base,
        format="png",
        cleanup=True,   # remove o arquivo .gv intermediário
    )
    png_path = f"{png_base}.png"

    # ── Montar documento Word ─────────────────────────────────────────────────
    doc = Document()

    # Título
    titulo = doc.add_heading("Matriz Curricular — Diagrama de Pré-Requisitos", level=1)
    titulo.alignment = 1  # center (WD_ALIGN_PARAGRAPH.CENTER = 1)

    doc.add_paragraph()  # espaço antes da imagem

    # Inserir imagem com largura de 7 polegadas
    doc.add_picture(png_path, width=Inches(7))

    # Legenda dos núcleos
    doc.add_paragraph()
    legenda = doc.add_paragraph()
    legenda.add_run("Legenda de Núcleos:").bold = True

    for nucleo, cor in CORES_NUCLEO.items():
        legenda = doc.add_paragraph(f"   ■ {nucleo}  (cor: {cor})")
        legenda.paragraph_format.space_before = legenda.paragraph_format.space_before

    # Salvar .docx
    docx_path = os.path.join(tmp_dir, "matriz_curricular.docx")
    doc.save(docx_path)

    return docx_path, png_path
