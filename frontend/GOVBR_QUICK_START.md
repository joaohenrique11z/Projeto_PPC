# 🚀 Guia Rápido - Estilização GOV.BR

## Como Adicionar Novos Elementos com Estilo GOV.BR

### 1. Botões

#### Primário (Ação Principal)
```html
<button id="btn-acao-importante">
  <svg class="w-4 h-4"><!-- ícone --></svg>
  Ação Principal
</button>
```
**CSS automático**: Azul (#2378c3), pílula (border-radius: 100px)

#### Secundário (Cancelar/Voltar)
```html
<button id="btn-cancelar">
  Cancelar
</button>
```
**CSS automático**: Branco com borda cinzenta

#### Destrutivo (Deletar/Remover)
```html
<button id="btn-remover">
  Remover
</button>
```
**CSS automático**: Vermelho (#d32f2f)

---

### 2. Inputs e Textareas

```html
<label>Nome do Campo</label>
<input type="text" placeholder="Digite aqui">

<label>Descrição</label>
<textarea></textarea>

<label>Seleção</label>
<select>
  <option>Opção 1</option>
</select>
```
**CSS automático**: Borda cinzenta, focus azul

---

### 3. Abas (Tabs)

```html
<button role="tab" aria-selected="true" class="tab-btn">
  Aba Ativa
</button>
<button role="tab" aria-selected="false" class="tab-btn">
  Aba Inativa
</button>
```
**CSS automático**: Borda esquerda azul para ativa

---

### 4. Tabelas

```html
<table>
  <thead>
    <tr><th>Cabeçalho</th></tr>
  </thead>
  <tbody>
    <tr><td>Dado</td></tr>
  </tbody>
</table>
```
**CSS automático**: Header cinzento, bordas finas

---

### 5. Modais

```html
<div id="modal-novo">
  <div>
    <h3>Título do Modal</h3>
    <p>Conteúdo</p>
    <div class="flex gap-3">
      <button id="btn-cancelar-novo">Cancelar</button>
      <button id="btn-confirmar-novo">Confirmar</button>
    </div>
  </div>
</div>
```
**CSS automático**: Overlay com blur, container elevado

---

## Variáveis CSS Disponíveis

Use em seus estilos customizados:

```css
/* Cores */
var(--blue-50)      /* Azul primário */
var(--blue-70)      /* Azul logo */
var(--blue-80)      /* Azul headers */
var(--gray-5)       /* Cinza claro (background) */
var(--gray-60)      /* Cinza bordas */
var(--gray-80)      /* Cinza texto */
var(--pure-0)       /* Branco puro */
var(--red-error)    /* Vermelho erro */
var(--green-success) /* Verde sucesso */
var(--yellow-warning) /* Amarelo aviso */
```

---

## Padrões Importantes

### ✅ Fazendo certo:
```html
<!-- Usar IDs para seletores específicos -->
<button id="btn-nova-acao">Novo</button>

<!-- Classes genéricas apenas para estrutura -->
<div class="flex gap-3">
  <button id="btn-cancelar">Cancelar</button>
  <button id="btn-confirmar">Confirmar</button>
</div>

<!-- Manter atributos semânticos -->
<button role="tab" aria-selected="false" class="tab-btn">Aba</button>
```

### ❌ Evitar:
```html
<!-- Não adicionar classes Tailwind de estilo -->
<button class="px-4 py-2 bg-blue-700">Errado</button>

<!-- Não remover IDs ou aria-* -->
<button>Sem ID</button>

<!-- Não usar inline styles -->
<button style="background: blue">Errado</button>
```

---

## Dark Mode Automático

O CSS GOV.BR detecta automaticamente:
```css
@media (prefers-color-scheme: dark) {
  /* Ajustes automáticos */
}
```

Não é necessário adicionar classes `.dark` - funciona nativamente no navegador do usuário.

---

## Tipografia

Todas os textos herdam automaticamente a fonte Rawline:

```css
/* Headlines */
h1, h2, h3, h4, h5, h6 { font-family: 'rawline'; }

/* Body */
body { font-family: 'rawline'; }

/* Labels */
label { font-family: 'rawline'; }
```

Use apenas pesos e tamanhos, não a font-family.

---

## Acessibilidade

### Focus Visível (Automático)
Todos os botões e inputs mostram outline azul ao usar TAB:
```
:focus-visible {
  outline: 3px solid var(--blue-50);
  outline-offset: 2px;
}
```

### Redução de Movimento (Automático)
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms; }
}
```

---

## Checklist para Novos Componentes

- [ ] Use IDs para estilização específica
- [ ] Mantenha estrutura semântica (role, aria-*)
- [ ] Remova classes Tailwind de estilo
- [ ] Teste em Light e Dark Mode
- [ ] Valide com TAB (focus visível)
- [ ] Teste em mobile (768px)

---

## Suporte

Se um elemento não está sendo estilizado:

1. Verifique se o CSS está carregado: `<link rel="stylesheet" href="css/govbr-override.css">`
2. Inspecione o elemento no DevTools (F12)
3. Procure pelo ID no `govbr-override.css`
4. Se não existir, crie um novo ID e adicione a regra CSS

---

**Versão**: 1.0
**Compatibilidade**: GOV.BR Design System v3.7.0+
**Última atualização**: 15/06/2026
