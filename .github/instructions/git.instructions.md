# Git Instructions

## Branch Strategy

Create one branch per feature or change.

Naming conventions:

* feature/feature-name
* fix/fix-name
* refactor/refactor-name
* docs/documentation-name

Examples:

* feature/course-registration
* feature/ppc-generation
* fix/workload-validation
* refactor/course-service

Branch names must be written in English.

---

## Commit Messages

Commit messages must be written in Brazilian Portuguese.

Use the following prefixes:

* feat:
* fix:
* refactor:
* docs:
* test:
* chore:

Examples:

```text
feat: adiciona cadastro de disciplinas

feat: implementa geração de PPC

fix: corrige cálculo de carga horária

refactor: simplifica service de cursos

docs: atualiza documentação da API

test: adiciona testes de autenticação
```

English terms are allowed only when there is no natural Portuguese equivalent or when referring to technical concepts already used in the codebase.

Examples:

```text
feat: adiciona endpoint de login

fix: corrige validação do schema Course

refactor: simplifica repository de disciplinas
```

---

## Commit Best Practices

* One logical change per commit.
* Keep commits small and focused.
* Avoid generic commit messages.
* Commit frequently.
* Make commit history easy to read.