"""
services/ppc_odt_generator.py

Gerador de documentos ODT para o PPC.

Utiliza a lib odfpy para criar um documento ODT estruturado com os dados
do PPC obtidos via carregar_ppc(). O documento inclui todas as seções
do PPC: identificação, colegiado, matriz curricular, ementas, corpo
docente e infraestrutura.
"""

import logging
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from odf.opendocument import OpenDocumentText
from odf.style import Style, TextProperties, ParagraphProperties, TableColumnProperties
from odf.text import H, P, Span
from odf.table import Table, TableColumn, TableRow, TableCell

from services.ppc_service import carregar_ppc

logger = logging.getLogger(__name__)

EXPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "exports"


# ─────────────────────────────────────────────────────────────────────────────
# Exceção
# ─────────────────────────────────────────────────────────────────────────────

class ODTGenerationError(Exception):
    """Raised when ODT generation fails."""


# ─────────────────────────────────────────────────────────────────────────────
# Helpers de estilo
# ─────────────────────────────────────────────────────────────────────────────

def _add_styles(doc: OpenDocumentText) -> dict[str, Style]:
    """
    Registra os estilos necessários no documento e retorna um dicionário
    de referência pelo nome para uso nas funções de construção.
    """
    styles: dict[str, Style] = {}

    # Estilo: título de seção (H1)
    h1 = Style(name="Heading1", family="paragraph")
    h1.addElement(ParagraphProperties(breakbefore="page"))
    h1.addElement(TextProperties(fontsize="16pt", fontweight="bold"))
    doc.styles.addElement(h1)
    styles["h1"] = h1

    # Estilo: título de subseção (H2)
    h2 = Style(name="Heading2", family="paragraph")
    h2.addElement(TextProperties(fontsize="13pt", fontweight="bold"))
    doc.styles.addElement(h2)
    styles["h2"] = h2

    # Estilo: parágrafo normal
    normal = Style(name="Normal", family="paragraph")
    normal.addElement(TextProperties(fontsize="11pt"))
    doc.styles.addElement(normal)
    styles["normal"] = normal

    # Estilo: cabeçalho de tabela
    th = Style(name="TableHeader", family="paragraph")
    th.addElement(TextProperties(fontsize="10pt", fontweight="bold"))
    doc.styles.addElement(th)
    styles["th"] = th

    # Estilo: célula de tabela
    td_style = Style(name="TableCell", family="paragraph")
    td_style.addElement(TextProperties(fontsize="10pt"))
    doc.styles.addElement(td_style)
    styles["td"] = td_style

    return styles


# ─────────────────────────────────────────────────────────────────────────────
# Funções auxiliares de construção
# ─────────────────────────────────────────────────────────────────────────────

def _str(value: Any) -> str:
    """Converte valor para string, retornando '' para None."""
    return str(value) if value is not None else ""


def _heading(doc: OpenDocumentText, text: str, level: int = 1) -> None:
    """Adiciona um heading ao documento."""
    h = H(outlinelevel=level, text=text)
    doc.text.addElement(h)


def _paragraph(doc: OpenDocumentText, text: str) -> None:
    """Adiciona um parágrafo simples ao documento."""
    p = P(text=text)
    doc.text.addElement(p)


def _blank_line(doc: OpenDocumentText) -> None:
    """Adiciona uma linha em branco."""
    doc.text.addElement(P())


def _table_2col(doc: OpenDocumentText, rows: list[tuple[str, str]]) -> None:
    """
    Cria uma tabela de 2 colunas (Campo / Valor) e a adiciona ao documento.
    """
    table = Table()
    table.addElement(TableColumn())
    table.addElement(TableColumn())

    for campo, valor in rows:
        tr = TableRow()
        # Coluna 1: campo (negrito)
        tc1 = TableCell()
        p1 = P()
        p1.addElement(Span(text=campo, attributes={"text:style-name": "TableHeader"}))
        tc1.addElement(p1)
        tr.addElement(tc1)
        # Coluna 2: valor
        tc2 = TableCell()
        tc2.addElement(P(text=_str(valor)))
        tr.addElement(tc2)
        table.addElement(tr)

    doc.text.addElement(table)


def _table_ncol(
    doc: OpenDocumentText,
    headers: list[str],
    data_rows: list[list[str]],
) -> None:
    """
    Cria uma tabela com N colunas e a adiciona ao documento.
    """
    num_cols = len(headers)
    table = Table()
    for _ in range(num_cols):
        table.addElement(TableColumn())

    # Linha de cabeçalho
    tr_h = TableRow()
    for h_text in headers:
        tc = TableCell()
        p = P()
        p.addElement(Span(text=h_text, attributes={"text:style-name": "TableHeader"}))
        tc.addElement(p)
        tr_h.addElement(tc)
    table.addElement(tr_h)

    # Linhas de dados
    for row in data_rows:
        tr = TableRow()
        for cell_text in row:
            tc = TableCell()
            tc.addElement(P(text=_str(cell_text)))
            tr.addElement(tc)
        table.addElement(tr)

    doc.text.addElement(table)


# ─────────────────────────────────────────────────────────────────────────────
# Seções do documento
# ─────────────────────────────────────────────────────────────────────────────

def _section_identificacao(doc: OpenDocumentText, ppc: dict) -> None:
    """Seção 1: Identificação do curso."""
    _heading(doc, "1. Identificação do Curso", level=1)
    _heading(doc, "1.1 Dados da Instituição", level=2)

    _table_2col(doc, [
        ("Instituição", "Instituto Federal de Educação, Ciência e Tecnologia de Pernambuco"),
        ("Campus", ppc.get("campus_name", "")),
        ("CNPJ", ppc.get("cnpj", "")),
        ("CEP", ppc.get("cep", "")),
        ("Cidade", ppc.get("cidade", "")),
        ("Bairro", ppc.get("bairro", "")),
        ("Endereço", f"{ppc.get('rua', '')}, {ppc.get('numero', '')}".strip(", ")),
        ("Telefone/Fax", ppc.get("telefone_fax", "")),
        ("E-mail", ppc.get("email_contato", "")),
        ("Ato Legal de Criação", ppc.get("ato_legal", "")),
        ("Sítio Eletrônico", ppc.get("sitio_web", "")),
    ])

    _blank_line(doc)
    _heading(doc, "1.2 Dados do Curso", level=2)

    min_sem = ppc.get("integralizacao_min_semestres") or 0
    max_sem = ppc.get("integralizacao_max_semestres") or 0

    _table_2col(doc, [
        ("Curso", ppc.get("nome_curso", "")),
        ("Nível", ppc.get("nivel", "")),
        ("Modalidade", ppc.get("modalidade_curso", "")),
        ("Titulação", ppc.get("titulacao", "")),
        ("Área do Conhecimento", ppc.get("area_conhecimento", "")),
        ("Carga Horária Total (h/r)", _str(ppc.get("ch_total_relogio"))),
        ("Carga Horária Total (h/a)", _str(ppc.get("ch_total_aula"))),
        ("Duração da Aula (min)", _str(ppc.get("duracao_aula_minutos"))),
        ("CH de Extensão (h/r)", _str(ppc.get("ch_extensao"))),
        ("Atividades Complementares (h/r)", _str(ppc.get("atividades_complementares"))),
        ("Integralização Mínima", f"{round(min_sem / 2, 1)} ano(s) / {min_sem} semestre(s)" if min_sem else ""),
        ("Integralização Máxima", f"{round(max_sem / 2, 1)} ano(s) / {max_sem} semestre(s)" if max_sem else ""),
        ("Semanas Letivas por Semestre", _str(ppc.get("semanas_letivas"))),
        ("Turno(s)", ppc.get("turnos", "")),
        ("Vagas Anuais", _str(ppc.get("vagas_anuais"))),
        ("Vagas por Turno", _str(ppc.get("vagas_turno"))),
        ("Regime de Matrícula", ppc.get("regime_matricula", "")),
        ("Início do Curso", ppc.get("inicio_curso", "")),
        ("Forma de Ingresso", ppc.get("formas_acesso", "")),
        ("Status do Curso", ppc.get("status_curso", "")),
        ("Tipo de Reformulação", ppc.get("tipo_reformulacao", "")),
    ])

    _blank_line(doc)
    _heading(doc, "1.3 Indicadores de Qualidade", level=2)
    _table_ncol(doc,
        headers=["CC", "CPC", "ENADE", "IGC"],
        data_rows=[[
            _str(ppc.get("conceito_cc")),
            _str(ppc.get("conceito_cpc")),
            _str(ppc.get("conceito_enade")),
            _str(ppc.get("igc")),
        ]],
    )


def _section_colegiado(doc: OpenDocumentText, membros: list[dict]) -> None:
    """Seção 2: Composição do colegiado e comissão."""
    _heading(doc, "2. Equipe de Trabalho", level=1)

    def lookup(tipo: str, cargo: str) -> str:
        for m in membros:
            if m.get("tipo", "").lower() == tipo.lower() and m.get("cargo", "").lower() == cargo.lower():
                return m.get("nome", "") or ""
        return ""

    _heading(doc, "2.1 Colegiado Institucional", level=2)
    _table_2col(doc, [
        ("Reitor", lookup("Colegiado", "Reitor")),
        ("Pró-Reitora de Ensino", lookup("Colegiado", "Pró-Reitora de Ensino")),
        ("Pró-Reitora de Pesquisa, Pós-Graduação e Inovação", lookup("Colegiado", "Pró-Reitora de Pesquisa, Pós-Graduação e Inovação")),
        ("Pró-Reitora de Extensão", lookup("Colegiado", "Pró-Reitora de Extensão")),
        ("Pró-Reitora de Integração e Desenvolvimento Institucional", lookup("Colegiado", "Pró-Reitora de Integração e Desenvolvimento Institucional")),
        ("Pró-Reitor de Administração", lookup("Colegiado", "Pró-Reitor de Administração")),
        ("Diretor Geral do Campus", lookup("Colegiado", "Diretor Geral do Campus")),
        ("Diretora de Administração e Planejamento", lookup("Colegiado", "Diretora de Administração e Planejamento")),
        ("Diretor de Desenvolvimento Educacional", lookup("Colegiado", "Diretor de Desenvolvimento Educacional")),
        ("Coordenador do Curso", lookup("Colegiado", "Coordenador do Curso")),
        ("Assessoria Pedagógica", lookup("Colegiado", "Assessoria Pedagógica")),
    ])

    _blank_line(doc)
    _heading(doc, "2.2 Comissão de Elaboração do PPC", level=2)
    comissao = [m for m in membros if m.get("tipo", "").lower() == "comissão de elaboração"]
    if comissao:
        _table_ncol(doc,
            headers=["Nome", "Cargo", "Portaria"],
            data_rows=[[
                m.get("nome", ""),
                m.get("cargo", ""),
                m.get("portaria", "") or "—",
            ] for m in comissao],
        )


def _section_matriz(doc: OpenDocumentText, componentes: list[dict]) -> None:
    """Seção 3: Matriz curricular."""
    _heading(doc, "3. Matriz Curricular", level=1)

    por_periodo: dict[int, list[dict]] = defaultdict(list)
    for c in componentes:
        por_periodo[c.get("periodo") or 0].append(c)

    for periodo in sorted(por_periodo.keys()):
        _heading(doc, f"Período {periodo}" if periodo else "Sem Período", level=2)
        _table_ncol(doc,
            headers=["Componente Curricular", "CH (h/r)", "CH (h/a)", "Créd.", "Pré-req.", "Co-req."],
            data_rows=[[
                c.get("nome") or "",
                _str(c.get("ch_total_relogio")),
                _str(c.get("ch_total_aula")),
                _str(c.get("creditos")),
                c.get("pre_requisito_codigo") or "—",
                c.get("co_requisito_codigo") or "—",
            ] for c in por_periodo[periodo]],
        )
        _blank_line(doc)


def _section_ementas(doc: OpenDocumentText, componentes: list[dict]) -> None:
    """Seção 4: Ementas dos componentes curriculares."""
    _heading(doc, "4. Ementas", level=1)

    sorted_comps = sorted(componentes, key=lambda c: (c.get("periodo") or 0, c.get("nome") or ""))
    for comp in sorted_comps:
        _heading(doc, comp.get("nome") or "Sem nome", level=2)

        bibs_basicas = [b["referencia_texto"] for b in comp.get("bibliografias", []) if b.get("tipo", "").lower() in ("básica", "basica")]
        bibs_comp = [b["referencia_texto"] for b in comp.get("bibliografias", []) if b.get("tipo", "").lower() == "complementar"]

        _table_2col(doc, [
            ("Créditos", _str(comp.get("creditos"))),
            ("CH Total (h/r)", _str(comp.get("ch_total_relogio"))),
            ("CH Teórica", _str(comp.get("ch_teorica"))),
            ("CH Prática", _str(comp.get("ch_pratica"))),
            ("CH Extensão", _str(comp.get("ch_extensao"))),
            ("Pré-requisitos", comp.get("pre_requisito_codigo") or "—"),
            ("Ementa", comp.get("ementa") or ""),
            ("Referências Básicas", "\n".join(bibs_basicas) if bibs_basicas else "—"),
            ("Referências Complementares", "\n".join(bibs_comp) if bibs_comp else "—"),
        ])
        _blank_line(doc)


def _section_coordenacao(doc: OpenDocumentText, coordenacao: dict) -> None:
    """Seção 5: Perfil do coordenador do curso."""
    _heading(doc, "5. Coordenação do Curso", level=1)
    _table_2col(doc, [
        ("Nome do Professor", coordenacao.get("nome_professor", "")),
        ("Regime de Trabalho", coordenacao.get("regime_trabalho", "")),
        ("CH Semanal de Coordenação", _str(coordenacao.get("ch_semanal_coordenacao"))),
        ("Tempo de Exercício na IES", coordenacao.get("tempo_exercicio_ies", "")),
        ("Tempo como Coordenador", coordenacao.get("tempo_coordenacao_curso", "")),
        ("Qualificação", coordenacao.get("qualificacao", "")),
        ("Titulação", coordenacao.get("titulacao", "")),
        ("Grupos de Pesquisa", coordenacao.get("grupos_pesquisa", "")),
        ("Linhas de Pesquisa", coordenacao.get("linhas_pesquisa", "")),
        ("Experiência Profissional (anos)", _str(coordenacao.get("experiencia_profissional"))),
        ("Experiência em Gestão", coordenacao.get("experiencia_gestao", "")),
        ("E-mail", coordenacao.get("email", "")),
    ])


def _section_docentes(doc: OpenDocumentText, docentes: list[dict]) -> None:
    """Seção 6: Corpo docente."""
    _heading(doc, "6. Corpo Docente", level=1)
    if docentes:
        _table_ncol(doc,
            headers=["Nome", "Titulação", "Regime de Trabalho", "Componentes Ministrados"],
            data_rows=[[
                d.get("nome") or "",
                d.get("titulacao") or "",
                d.get("regime_trabalho") or "",
                ", ".join(d.get("componentes_ministrados") or []) or "—",
            ] for d in docentes],
        )
    else:
        _paragraph(doc, "Nenhum docente cadastrado.")


# ─────────────────────────────────────────────────────────────────────────────
# Orquestrador principal
# ─────────────────────────────────────────────────────────────────────────────

def generate_odt_document(ppc_id: str) -> Path:
    """
    Gera o documento ODT completo para o PPC informado.

    Fluxo:
      1. Busca dados via carregar_ppc()
      2. Cria o documento ODT com odfpy
      3. Constrói todas as seções
      4. Salva o arquivo em exports/

    Args:
        ppc_id: UUID do PPC a ser exportado.

    Returns:
        Caminho absoluto do arquivo ODT gerado.

    Raises:
        ODTGenerationError: Em caso de falha em qualquer etapa.
    """
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Iniciando geração de ODT para PPC %s", ppc_id)

    try:
        payload = carregar_ppc(ppc_id)
    except ValueError as exc:
        raise ODTGenerationError(f"PPC {ppc_id} não encontrado: {exc}") from exc
    except Exception as exc:
        raise ODTGenerationError(f"Erro ao buscar dados do PPC: {exc}") from exc

    ppc: dict = payload.get("ppc") or {}
    coordenacao: dict = payload.get("coordenacao") or {}
    membros: list[dict] = payload.get("membros") or []
    componentes: list[dict] = payload.get("componentes") or []
    docentes: list[dict] = payload.get("docentes") or []

    try:
        doc = OpenDocumentText()
        _add_styles(doc)

        # Capa
        nome_curso = ppc.get("nome_curso") or "PPC"
        data_atualizacao = ppc.get("data_ultima_atualizacao", "")
        try:
            ano = str(datetime.fromisoformat(data_atualizacao.replace("Z", "+00:00")).year)
        except (ValueError, AttributeError):
            ano = ""

        _heading(doc, nome_curso, level=1)
        _paragraph(doc, f"Projeto Pedagógico de Curso — {ano}")
        _paragraph(doc, f"Campus {ppc.get('campus_name', '')}")
        _blank_line(doc)

        # Seções
        _section_identificacao(doc, ppc)
        _section_colegiado(doc, membros)
        _section_matriz(doc, componentes)
        _section_ementas(doc, componentes)
        _section_coordenacao(doc, coordenacao)
        _section_docentes(doc, docentes)

    except Exception as exc:
        raise ODTGenerationError(f"Erro ao construir documento ODT: {exc}") from exc

    safe_name = re.sub(r"[^\w\-]", "_", nome_curso)[:60]
    output_path = EXPORTS_DIR / f"PPC_{safe_name}_{ppc_id[:8]}.odt"

    try:
        doc.save(str(output_path))
    except Exception as exc:
        raise ODTGenerationError(f"Erro ao salvar ODT: {exc}") from exc

    logger.info("ODT gerado com sucesso: %s", output_path)
    return output_path
