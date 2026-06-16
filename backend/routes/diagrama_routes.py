"""
routes/diagrama_routes.py

Endpoints para exportar diagramas de matriz curricular como .docx.

Rotas:
  GET /api/exportar-diagrama/{ppc_id}
      Exporta apenas o Diagrama 2 (Graphviz — rota original, mantida).

  GET /api/exportar-matrizes-unificadas/{ppc_id}
      Exporta Diagrama 1 (grade HTML) + Diagrama 2 (Graphviz) em um
      único arquivo .docx.
"""

import os
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from fastapi.responses import FileResponse

from services.diagrama_service import gerar_diagrama_docx, gerar_matrizes_unificadas_docx

router = APIRouter(prefix="/api", tags=["Diagrama"])


def _criar_limpador(caminhos: list[str]):
    """
    Retorna uma função que remove os arquivos temporários listados.

    O diretório temporário também é removido se ficar vazio após
    a deleção dos arquivos.

    Args:
        caminhos: Lista de caminhos absolutos a serem deletados.

    Returns:
        Função callable sem argumentos para uso em BackgroundTasks.
    """
    def _limpar():
        diretorios_vistos: set[str] = set()
        for caminho in caminhos:
            try:
                if os.path.exists(caminho):
                    os.remove(caminho)
                diretorios_vistos.add(os.path.dirname(caminho))
            except OSError:
                pass   # Falhas de limpeza não devem afetar o usuário

        for pasta in diretorios_vistos:
            try:
                if os.path.isdir(pasta) and not os.listdir(pasta):
                    os.rmdir(pasta)
            except OSError:
                pass

    return _limpar


@router.get("/exportar-diagrama/{ppc_id}")
def exportar_diagrama(ppc_id: str, background: BackgroundTasks):
    """
    Gera e retorna o diagrama Graphviz de pré-requisitos em formato .docx.

    Rota original mantida para compatibilidade.

    Args:
        ppc_id: UUID do PPC cujo diagrama será gerado.

    Returns:
        FileResponse com o arquivo .docx para download.
    """
    try:
        docx_path, png_path = gerar_diagrama_docx(ppc_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar diagrama: {err}",
        )

    background.add_task(_criar_limpador([docx_path, png_path]))

    return FileResponse(
        path=docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="matriz_curricular.docx",
        background=background,
    )


@router.get("/exportar-matrizes-unificadas/{ppc_id}")
def exportar_matrizes_unificadas(ppc_id: str, background: BackgroundTasks):
    """
    Gera e retorna os dois diagramas de matriz curricular em um único .docx.

    Diagrama 1 — Grade de disciplinas (HTML → PNG via Playwright).
    Diagrama 2 — Fluxograma de pré-requisitos (Graphviz → PNG).

    Os arquivos temporários (PNGs e .docx) são deletados automaticamente
    após o envio ao cliente via BackgroundTasks.

    Args:
        ppc_id: UUID do PPC cujas matrizes serão geradas.

    Returns:
        FileResponse com o arquivo .docx unificado para download.
    """
    try:
        docx_path, arquivos_tmp = gerar_matrizes_unificadas_docx(ppc_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except RuntimeError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err),
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar matrizes: {err}",
        )

    # Inclui o .docx na limpeza
    todos_os_temporarios = [docx_path] + arquivos_tmp
    background.add_task(_criar_limpador(todos_os_temporarios))

    return FileResponse(
        path=docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="matrizes_curriculares.docx",
        background=background,
    )
