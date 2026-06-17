"""
routes/ppc_routes.py
Endpoints REST para criação e listagem de PPCs.

Rotas:
  POST /api/ppc       — cria um PPC completo (recebe PPCPayload)
  POST /api/ppc/novo  — cria um PPC vazio com apenas um nome e status padrão
  GET  /api/ppc       — lista todos os PPCs (id, nome_curso, status_curso, data_ultima_atualizacao)
"""

from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
from database import supabase
from models.ppc import PPCPayload
from services.ppc_service import salvar_ppc, duplicar_ppc, carregar_ppc, atualizar_ppc, deletar_ppc
from services.document_service import document_service
from services.ppc_doc_generator import generate_document, DocumentGenerationError
from services.ppc_odt_generator import generate_odt_document, ODTGenerationError

router = APIRouter(prefix="/api/ppc", tags=["PPC"])


class NovoPPCRequest(BaseModel):
    """Payload para criar um novo PPC vazio."""
    nome_curso: str = "Novo PPC"


@router.post("/novo", status_code=status.HTTP_201_CREATED)
def criar_ppc_novo(request: NovoPPCRequest):
    """
    Cria um novo PPC vazio no banco de dados.
    
    Este endpoint é usado quando o usuário clica em "+ Novo PPC" para
    criar um registro básico que será preenchido posterormente.
    
    Args:
        request: Contém o nome_curso (opcional, padrão "Novo PPC")
    
    Returns:
        O PPC recém-criado com seu ID do banco de dados
    """
    try:
        dados = {
            "nome_curso": request.nome_curso,
            "status_curso": "Rascunho",
            "data_criacao": datetime.utcnow().isoformat(),
            "data_ultima_atualizacao": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("ppc").insert(dados).execute()
        
        if not response.data or len(response.data) == 0:
            raise Exception("Erro ao criar PPC no banco de dados")
        
        novo_ppc = response.data[0]
        
        return {
            "id": novo_ppc.get("id"),
            "nome_curso": novo_ppc.get("nome_curso"),
            "status_curso": novo_ppc.get("status_curso"),
            "data_ultima_atualizacao": novo_ppc.get("data_ultima_atualizacao")
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar novo PPC: {str(exc)}",
        )


@router.post("/{ppc_id}/duplicar", status_code=status.HTTP_201_CREATED)
def duplicar(ppc_id: str):
    """
    Duplica um PPC existente e todas as suas dependências.
    """
    try:
        resultado = duplicar_ppc(ppc_id)
        return resultado
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao duplicar PPC: {str(exc)}",
        )


@router.post("", status_code=status.HTTP_201_CREATED)
def criar_ppc(payload: PPCPayload):
    """
    Persiste o PPC completo no Supabase.

    Recebe todos os dados do formulário agrupados em um único payload
    e os insere nas tabelas na ordem correta de dependência.
    """
    try:
        resultado = salvar_ppc(payload)
        return resultado
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar PPC: {str(exc)}",
        )


@router.get("/{ppc_id}")
def obter_ppc(ppc_id: str):
    """
    Retorna um PPC completo com todas as entidades filhas.
    Usado pela tela de edição para popular todos os campos do formulário.
    """
    try:
        resultado = carregar_ppc(ppc_id)
        return resultado
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao carregar PPC: {str(exc)}",
        )


@router.put("/{ppc_id}")
def editar_ppc(ppc_id: str, payload: PPCPayload):
    """
    Atualiza um PPC existente e todas as suas entidades filhas.
    Usa estratégia delete + reinsert para simplicidade e consistência.
    """
    try:
        resultado = atualizar_ppc(ppc_id, payload)
        return resultado
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar PPC: {str(exc)}",
        )


@router.get("/{ppc_id}/exportar/docx")
def exportar_docx(ppc_id: str, background_tasks: BackgroundTasks):
    """
    Gera e retorna o PPC completo no formato DOCX.

    O documento é gerado em tempo real a partir dos dados do banco,
    usando o template Word localizado em templates/doc_ppc_modelo.docx.
    O arquivo é enviado ao cliente e removido do servidor em seguida.
    """
    try:
        output_path = generate_document(ppc_id)
    except DocumentGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro inesperado ao gerar documento: {str(exc)}",
        )

    # Remove o arquivo do disco após o envio para não acumular exports
    background_tasks.add_task(output_path.unlink, missing_ok=True)

    return FileResponse(
        path=str(output_path),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=output_path.name,
    )


@router.get("/{ppc_id}/exportar/odt")
def exportar_odt(ppc_id: str, background_tasks: BackgroundTasks):
    """
    Gera e retorna o PPC completo no formato ODT.
    """
    try:
        output_path = generate_odt_document(ppc_id)
    except ODTGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro inesperado ao gerar documento: {str(exc)}",
        )

    # Remove o arquivo do disco após o envio
    background_tasks.add_task(output_path.unlink, missing_ok=True)

    return FileResponse(
        path=str(output_path),
        media_type="application/vnd.oasis.opendocument.text",
        filename=output_path.name,
    )


@router.get("")
def listar_ppcs():
    """
    Retorna a lista de todos os PPCs cadastrados.
    Inclui apenas os campos necessários para exibição na tela inicial.
    """
    try:
        response = (
            supabase
            .table("ppc")
            .select("id, nome_curso, status_curso, data_ultima_atualizacao")
            .order("data_ultima_atualizacao", desc=True)
            .execute()
        )
        return response.data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar PPCs: {str(exc)}",
        )


@router.delete("/{ppc_id}", status_code=status.HTTP_200_OK)
def deletar_ppc_endpoint(ppc_id: str):
    """
    Deleta um PPC a partir do seu ID.
    """
    try:
        deletar_ppc(ppc_id)
        return {"message": "PPC deletado com sucesso"}
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar PPC: {str(exc)}",
        )


@router.get("/{ppc_id}/exportar")
def exportar_ppc(ppc_id: str):
    """
    Gera e exporta o documento do PPC (DOCX/PDF).
    
    Atualmente retorna apenas os dados estruturados (stub)
    para o preenchimento do template.
    """
    try:
        resultado = document_service.generate_ppc_document(ppc_id)
        return resultado
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao exportar documento do PPC: {str(exc)}",
        )
