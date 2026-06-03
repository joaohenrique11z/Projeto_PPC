# Gerador de PPC - IFPE Belo Jardim

## 📄 Sobre o Projeto
Este é um Produto Mínimo Viável (MVP) de uma ferramenta web desenvolvida para automatizar a criação de **Projetos Pedagógicos de Curso (PPC)**. O PPC é um documento oficial e obrigatório (exigido pelo MEC) que consolida todas as informações de planejamento e diretrizes de um curso acadêmico. 

O sistema tem como objetivo guiar coordenadores e professores do **IFPE - Campus Belo Jardim** em um formulário estruturado para preenchimento, validação e futura exportação do documento nos padrões exigidos. A ferramenta foi desenhada para rodar de maneira autônoma e local (sem requerer autenticação ou sincronização em nuvem neste momento).

## 🛠️ Tecnologias Utilizadas
A arquitetura do Frontend prioriza simplicidade, legibilidade e fácil manutenção:
- **Estrutura e Lógica:** HTML5 e Vanilla JavaScript (sem frameworks complexos).
- **Estilização:** Tailwind CSS (carregado via CDN).

## ✨ Funcionalidades Já Implementadas

* **Interface e Layout**
  * Layout responsivo, focado em uso desktop, organizado em blocos semânticos.
  * Suporte nativo à alternância entre **Tema Claro e Tema Escuro** (`theme.js`).
* **Validação e Preenchimento Automático**
  * **Máscaras Dinâmicas:** Formatação em tempo real para campos como CNPJ, CEP e Telefones (`mask.js`).
  * **Integração ViaCEP:** Ao digitar um CEP válido, o sistema consome a API do ViaCEP exibe um *loading* e preenche automaticamente o endereço (Cidade, Bairro, Rua), focando diretamente no campo de Número para agilizar a digitação (`cep.js`).
* **Gestão de Componentes Curriculares**
  * CRUD local de disciplinas: Adição, edição e remoção de matérias da grade curricular, tudo diretamente na interface (`componentes.js`).
  * Alimentação automática e em tempo real dos campos de pré-requisitos e correquisitos com base nas disciplinas já cadastradas.
  * Segurança contra vulnerabilidades de XSS na renderização da tabela.
* **Segurança de Navegação**
  * Sistema de modal de confirmação para interceptar cliques acidentais no botão de limpar os dados da tela, prevenindo perda de trabalho (`modal.js`).

## 🚀 Como Executar

Por ser construído com tecnologias web padrão (sem necessidade de *build steps* para o Frontend no momento), basta:

1. Clonar este repositório.
2. Navegar até a pasta raiz.
3. Abrir o arquivo `frontend/index.html` diretamente em qualquer navegador moderno.

---
*Projeto em desenvolvimento ativo. MVP estruturado para o IFPE Campus Belo Jardim.*