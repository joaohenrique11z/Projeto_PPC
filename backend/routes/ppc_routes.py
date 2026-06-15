"""
routes/ppc_routes.py
Endpoints REST para criação e listagem de PPCs.

Rotas:
  POST /api/ppc       — cria um PPC completo (recebe PPCPayload)
  POST /api/ppc/novo  — cria um PPC vazio com apenas um nome e status padrão
  GET  /api/ppc       — lista todos os PPCs (id, nome_curso, status_curso, data_ultima_atualizacao)
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from database import supabase
from models.ppc import PPCPayload
from services.ppc_service import salvar_ppc

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
