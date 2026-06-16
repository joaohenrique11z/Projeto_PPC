/**
 * autosave-feedback.js — Handler para eventos de autosave
 *
 * Responsabilidades:
 * 1. Escutar eventos "autosave:feedback" disparados por autosave.js
 * 2. Log no console para debug
 * 3. (Futuro) Mostrar UI de feedback: "Salvando...", "Salvo", "Erro"
 *
 * Uso:
 * - Apenas incluir o script no HTML
 * - Eventos serão automaticamente logados
 */

document.addEventListener('autosave:feedback', (event) => {
  const { status, message, version, timestamp } = event.detail;

  console.log(`[AutosaveFeedback] ${timestamp}`);
  console.log(`  Status: ${status}`);
  console.log(`  Message: ${message}`);
  console.log(`  Version: ${version}`);

  // ─────────────────────────────────────────────────────────
  // Feedback Visual (estrutura preparada para futura implementação)
  // ─────────────────────────────────────────────────────────

  switch (status) {
    case 'typing':
      // Usuário digitando, aguardando debounce
      // Futura: mostrar "Digitando..."
      break;

    case 'saving':
      // Enviando save ao servidor
      // Futura: mostrar "Salvando..." com spinner
      console.log('  → Enviando alterações ao servidor...');
      break;

    case 'saved':
      // Save bem-sucedido
      // Futura: mostrar "Salvo" com checkmark, desaparecer após 2s
      console.log('  ✓ Alterações salvas com sucesso');
      break;

    case 'error':
      // Save falhou
      // Futura: mostrar "Erro ao salvar" em vermelho, com opção de retry
      console.warn('  ✗ Erro ao salvar. Tentarão novamente automaticamente.');
      break;

    default:
      console.log(`  ? Status desconhecido: ${status}`);
  }
});

// ─────────────────────────────────────────────────────────
// Estrutura para implementação de UI futura
// ─────────────────────────────────────────────────────────

/*
Exemplo de futuro handler com toast visual:

const autosaveFeedbackUI = {
  toastElement: null,

  showToast(message, type = 'info', duration = 2000) {
    // Remove toast anterior
    if (this.toastElement) this.toastElement.remove();

    // Cria novo toast
    const toast = document.createElement('div');
    toast.className = `
      fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg
      text-white text-sm font-medium z-50
      ${type === 'saving' ? 'bg-blue-600' : ''}
      ${type === 'saved' ? 'bg-green-600' : ''}
      ${type === 'error' ? 'bg-red-600' : ''}
      ${type === 'info' ? 'bg-gray-600' : ''}
      animate-fade-in
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    this.toastElement = toast;

    // Remove automaticamente
    if (duration > 0) {
      setTimeout(() => {
        if (this.toastElement === toast) {
          toast.remove();
          this.toastElement = null;
        }
      }, duration);
    }
  },
};

// Integraria assim:
document.addEventListener('autosave:feedback', (event) => {
  const { status, message } = event.detail;
  if (status === 'saving') autosaveFeedbackUI.showToast('Salvando...', 'saving', 0);
  if (status === 'saved') autosaveFeedbackUI.showToast('Salvo ✓', 'saved', 2000);
  if (status === 'error') autosaveFeedbackUI.showToast('Erro ao salvar', 'error', 3000);
});
*/
