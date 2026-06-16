import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PPC API",
    description="API para geração de Projetos Pedagógicos de Curso - IFPE Campus Belo Jardim",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir para o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from routes.ppc_routes import router as ppc_router
from routes.diagrama_routes import router as diagrama_router

app.include_router(ppc_router)
app.include_router(diagrama_router)

@app.get("/api/health")
def health_check():
    """Verifica se a API está no ar."""
    return {"status": "ok", "message": "PPC API funcionando"}

# ─── Configuração do Frontend ───
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")

# Servir arquivos estáticos (JS, CSS, etc)
app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Catch-all para servir arquivos do frontend e SPA routing
@app.get("/{file_path:path}", include_in_schema=False)
async def serve_frontend(file_path: str):
    """Serve arquivos do frontend. Se o arquivo não existir, retorna index.html (SPA)."""
    
    # Evitar servir arquivos da API
    if file_path.startswith("api/"):
        # Deixar que a API trate (vai retornar 404 normalmente)
        from fastapi import HTTPException
        raise HTTPException(status_code=404)
    
    # Caminho completo do arquivo
    file_full_path = os.path.join(frontend_path, file_path)
    
    # Verificar se o arquivo existe e está dentro da pasta frontend
    if os.path.isfile(file_full_path) and os.path.abspath(file_full_path).startswith(os.path.abspath(frontend_path)):
        return FileResponse(file_full_path)
    
    # Se não encontrar o arquivo, retornar index.html (SPA routing)
    return FileResponse(os.path.join(frontend_path, "index.html"), media_type="text/html")
