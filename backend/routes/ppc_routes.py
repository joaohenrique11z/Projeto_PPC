"""
routes/ppc_routes.py
Endpoints REST para criação e listagem de PPCs.

Rotas:
  POST /api/ppc  — cria um PPC completo (recebe PPCPayload)
  GET  /api/ppc  — lista todos os PPCs (id, nome_curso, status_curso, data_ultima_atualizacao)
"""

from fastapi import APIRouter, HTTPException, status
from database import supabase
from models.ppc import PPCPayload
from services.ppc_service import salvar_ppc

router = APIRouter(prefix="/api/ppc", tags=["PPC"])


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
