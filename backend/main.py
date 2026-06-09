from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PPC API",
    description="API para geração de Projetos Pedagógicos de Curso - IFPE Campus Belo Jardim",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir para o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from routes.ppc_routes import router as ppc_router

app.include_router(ppc_router)

@app.get("/api/health")
def health_check():
    """Verifica se a API está no ar."""
    return {"status": "ok", "message": "PPC API funcionando"}
