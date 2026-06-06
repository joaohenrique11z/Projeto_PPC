from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

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

app.include_router(router, prefix="/api")


@app.get("/api/health")
def health_check():
    """Verifica se a API está no ar."""
    return {"status": "ok", "message": "PPC API funcionando"}
