"""
routes/diagrama_routes.py

Endpoint para exportar o diagrama de matriz curricular de um PPC
como um arquivo .docx para download.

Rota:
  GET /api/exportar-diagrama/{ppc_id}
"""

import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from services.diagrama_service import gerar_diagrama_docx

router = APIRouter(prefix="/api", tags=["Diagrama"])


@router.get("/exportar-diagrama/{ppc_id}")
def exportar_diagrama(ppc_id: str):
    """
    Gera e retorna o diagrama de matriz curricular em formato .docx.

    Cria um grafo de pré-requisitos agrupado por períodos usando Graphviz,
    renderiza como PNG e insere no documento Word. Os arquivos temporários
    são deletados após o envio.

    Args:
        ppc_id: UUID do PPC cujo diagrama será gerado.

    Returns:
        FileResponse com o arquivo .docx para download.
    """
    try:
        docx_path, png_path = gerar_diagrama_docx(ppc_id)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar diagrama: {str(exc)}",
        )

    nome_arquivo = "matriz_curricular.docx"

    # FileResponse faz o streaming do arquivo. A limpeza ocorre via
    # background_tasks para garantir que o arquivo já foi lido antes de deletar.
    from fastapi import BackgroundTasks

    def _limpar_temporarios():
        """Remove os arquivos temporários após o envio."""
        for caminho in (docx_path, png_path):
            try:
                if os.path.exists(caminho):
                    os.remove(caminho)
                # Remove o diretório temporário se estiver vazio
                tmp_dir = os.path.dirname(caminho)
                if os.path.isdir(tmp_dir) and not os.listdir(tmp_dir):
                    os.rmdir(tmp_dir)
            except OSError:
                pass  # Falhas de limpeza não devem afetar o usuário

    background = BackgroundTasks()
    background.add_task(_limpar_temporarios)

    return FileResponse(
        path=docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=nome_arquivo,
        background=background,
    )
