<div align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</div>

<br>

<div align="center">
  <h1>📚 Gerador de Projeto Pedagógico de Curso (PPC)</h1>
  <p><i>Automação do preenchimento e geração de PPCs para o IFPE Campus Belo Jardim.</i></p>
</div>

---

## 🎯 Visão Geral

O **Gerador de PPC** é um sistema web de uso interno desenvolvido para o **IFPE Campus Belo Jardim**, com o objetivo de automatizar a criação dos **Projetos Pedagógicos de Curso** — documentos obrigatórios exigidos pelo MEC para todos os cursos de nível superior.

O sistema conduz coordenadores e professores por um assistente em abas (wizard), coletando todos os dados necessários: identificação do curso, matriz curricular, ementas, corpo docente, infraestrutura e equipe institucional. Ao final, o documento é gerado e exportado nos formatos **PDF/A** e **ODT**.

O sistema roda **inteiramente em localhost**, sem necessidade de internet em tempo de execução e sem qualquer sistema de autenticação neste MVP.

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.13+, FastAPI |
| Banco de Dados | Supabase (PostgreSQL) |
| Frontend | HTML5, JavaScript (Vanilla), Tailwind CSS |

---

## 📂 Estrutura do Projeto

```text
📦 Projeto_PPC
 ┣ 📂 backend
 ┃ ┣ 📂 models        # Modelos de dados (Pydantic)
 ┃ ┣ 📂 routes        # Rotas da API REST (/api/...)
 ┃ ┣ 📂 services      # Regras de negócio
 ┃ ┣ 📜 database.py   # Conexão com o Supabase
 ┃ ┣ 📜 main.py       # Ponto de entrada do FastAPI
 ┃ ┗ 📜 requirements.txt
 ┣ 📂 frontend
 ┃ ┣ 📂 js
 ┃ ┃ ┣ 📜 cep.js           # Integração com ViaCEP (busca de endereço)
 ┃ ┃ ┣ 📜 componentes.js   # CRUD de componentes curriculares
 ┃ ┃ ┣ 📜 crud.js          # CRUD de membros, docentes e infraestrutura
 ┃ ┃ ┣ 📜 mask.js          # Máscaras e formatação de inputs
 ┃ ┃ ┣ 📜 modal.js         # Controle de modais de confirmação
 ┃ ┃ ┣ 📜 tabs.js          # Navegação entre abas do wizard
 ┃ ┃ ┗ 📜 theme.js         # Alternância de tema (Light / Dark)
 ┃ ┗ 📜 index.html         # Interface principal
 ┣ 📂 templates            # Templates base para geração dos documentos
 ┗ 📜 README.md
```

---

## 🚀 Como Executar

### Pré-requisitos

- Python 3.13+
- Uma instância do Supabase configurada (variáveis no `.env`)

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/joaohenrique11z/Projeto_PPC.git
   cd Projeto_PPC
   ```

2. Crie e ative o ambiente virtual:
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   ```

3. Instale as dependências do backend:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Configure as variáveis de ambiente copiando o arquivo de exemplo:
   ```bash
   copy .env.example .env
   # Edite o .env com as credenciais do Supabase
   ```

5. Inicie o servidor:
   ```bash
   uvicorn backend.main:app --reload
   ```

6. Abra `frontend/index.html` no navegador ou acesse `http://localhost:8000`.

---

<div align="center">
  <p>Desenvolvido para o <strong>IFPE Campus Belo Jardim</strong> — descomplicando o planejamento acadêmico.</p>
</div>
