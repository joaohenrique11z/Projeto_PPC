/**
 * autosave.js — Gerenciador de autosave com debounce + delta + fila de saves
 *
 * Responsabilidades:
 * 1. Rastrear estado atual do formulário (currentState)
 * 2. Detectar mudanças (delta) em relação ao último estado salvo
 * 3. Implementar debounce de 3 segundos
 * 4. Manter fila FIFO de saves para evitar conflitos de concorrência
 * 5. Emitir eventos para feedback visual (autosave:feedback)
 *
 * Uso:
 *   autosaveManager.initializeAutosave();  // ao carregar página
 *   autosaveManager.onFieldChange();       // evento nos campos com data-autosave
 */

const autosaveManager = {
  // ─────────────────────────────────────────────────────────
  // Estado
  // ─────────────────────────────────────────────────────────
  currentState: {},           // último estado salvo no backend
  pendingChanges: {},         // mudanças acumuladas (será enviado como delta)
  saveQueue: [],              // fila FIFO de saves pendentes
  isSaving: false,            // true enquanto um save está em progresso
  debounceTimer: null,        // timer para debounce de 3s
  lastSavedVersion: null,     // timestamp da última save bem-sucedida
  ppcId: null,                // UUID do PPC sendo editado (null se novo)

  // ─────────────────────────────────────────────────────────
  // Inicialização
  // ─────────────────────────────────────────────────────────

  /**
   * Inicializa autosave: captura estado atual do formulário.
   * Deve ser chamado após o formulário estar completamente carregado.
   */
  initializeAutosave() {
    // Extrai current state do formulário
    this.currentState = this.extractFormState();
    this.pendingChanges = {};
    this.ppcId = new URLSearchParams(window.location.search).get("id");

    if (!this.ppcId) {
      console.log("Modo: Criando novo PPC (sem autosave até salvar pela primeira vez)");
      return;
    }

    console.log(`Autosave inicializado para PPC: ${this.ppcId}`);

    // Configura listeners em todos os campos com data-autosave
    this.setupFieldListeners();
  },

  /**
   * Configura event listeners para todos os campos com data-autosave.
   */
  setupFieldListeners() {
    const autosaveFields = document.querySelectorAll("[data-autosave]");
    autosaveFields.forEach((field) => {
      field.addEventListener("change", () => this.onFieldChange());
      field.addEventListener("input", () => this.onFieldChange());
    });
  },

  // ─────────────────────────────────────────────────────────
  // Detectar Mudanças
  // ─────────────────────────────────────────────────────────

  /**
   * Extrai o estado atual do formulário como objeto.
   * Lê todos os inputs, textareas, selects com data-autosave.
   *
   * Retorna estrutura: { ppc: {...}, membros: [], ... }
   */
  extractFormState() {
    const state = {
      ppc: {},
      membros: [],
      coordenacao: {},
      componentes: [],
      docentes: [],
      ambientes: [],
    };

    // ─ Campos simples do PPC (inputs com data-autosave)
    const ppcFields = document.querySelectorAll("[data-section='ppc'][data-autosave]");
    ppcFields.forEach((field) => {
      const fieldName = field.id || field.name;
      if (fieldName) {
        state.ppc[fieldName] = field.type === "checkbox" ? field.checked : field.value;
      }
    });

    // ─ Arrays de CRUD (reutiliza estado global se existir, senão extrai do DOM)
    // Nota: window.__crudState é populado por crud.js
    if (window.__crudState) {
      state.membros = window.__crudState.membros || [];
      state.docentes = window.__crudState.docentes || [];
      state.ambientes = window.__crudState.ambientes || [];
    }

    // ─ Componentes (reutiliza estado global)
    if (window.__componentesState) {
      state.componentes = window.__componentesState;
    }

    // ─ Coordenação (campos simples)
    const coordFields = document.querySelectorAll("[data-section='coordenacao'][data-autosave]");
    coordFields.forEach((field) => {
      const fieldName = field.id || field.name;
      if (fieldName) {
        state.coordenacao[fieldName] = field.type === "checkbox" ? field.checked : field.value;
      }
    });

    return state;
  },

  /**
   * Compara currentState com newState e retorna apenas campos que mudaram (delta).
   * Ignora campos que não estão presentes (undefined).
   */
  detectDelta(newState) {
    const delta = {};

    // Detecta mudanças em campos simples do PPC
    if (JSON.stringify(this.currentState.ppc || {}) !== JSON.stringify(newState.ppc || {})) {
      delta.ppc = newState.ppc;
    }

    // Detecta mudanças em arrays
    if (JSON.stringify(this.currentState.membros || []) !== JSON.stringify(newState.membros || [])) {
      delta.membros = newState.membros;
    }
    if (JSON.stringify(this.currentState.coordenacao || {}) !== JSON.stringify(newState.coordenacao || {})) {
      delta.coordenacao = newState.coordenacao;
    }
    if (JSON.stringify(this.currentState.componentes || []) !== JSON.stringify(newState.componentes || [])) {
      delta.componentes = newState.componentes;
    }
    if (JSON.stringify(this.currentState.docentes || []) !== JSON.stringify(newState.docentes || [])) {
      delta.docentes = newState.docentes;
    }
    if (JSON.stringify(this.currentState.ambientes || []) !== JSON.stringify(newState.ambientes || [])) {
      delta.ambientes = newState.ambientes;
    }

    return delta;
  },

  // ─────────────────────────────────────────────────────────
  // Debounce
  // ─────────────────────────────────────────────────────────

  /**
   * Chamado quando um campo muda.
   * Acumula mudanças e agenda um save após debounce de 3s.
   */
  onFieldChange() {
    // Limpa timer anterior
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Emite evento de "digitando" (opcional, para UI mostrar "Salvando...")
    this.emitFeedback("typing");

    // Agenda novo save após 3 segundos
    this.debounceTimer = setTimeout(() => {
      const newState = this.extractFormState();
      const delta = this.detectDelta(newState);

      if (Object.keys(delta).length > 0) {
        console.log("Delta detectado após debounce:", delta);
        this.queueSave(delta);
      }
    }, 3000); // 3 segundos de debounce
  },

  // ─────────────────────────────────────────────────────────
  // Fila de Saves
  // ─────────────────────────────────────────────────────────

  /**
   * Adiciona um delta à fila de saves.
   * Se não há save em progresso, processa a fila imediatamente.
   */
  queueSave(delta) {
    this.saveQueue.push(delta);
    console.log(`Delta adicionado à fila. Tamanho da fila: ${this.saveQueue.length}`);

    if (!this.isSaving) {
      this.processSaveQueue();
    }
  },

  /**
   * Processa saves da fila em FIFO.
   * Aguarda cada save terminar antes de processar o próximo.
   */
  async processSaveQueue() {
    if (this.saveQueue.length === 0) {
      return;
    }

    if (this.isSaving) {
      console.log("Save já em progresso, aguardando...");
      return;
    }

    const delta = this.saveQueue.shift();
    this.isSaving = true;

    console.log("Processando save da fila...", delta);
    this.emitFeedback("saving");

    try {
      const response = await this.sendAutosavePatch(this.ppcId, delta);

      if (response.success) {
        // Atualiza currentState com o delta enviado
        this.currentState = this.extractFormState();
        this.lastSavedVersion = response.version;

        console.log("Autosave bem-sucedido", response);
        this.emitFeedback("saved", response.message);
      } else {
        throw new Error(response.error || "Erro desconhecido");
      }
    } catch (error) {
      console.error("Erro ao autosave:", error);
      this.emitFeedback("error", `Erro ao salvar: ${error.message}`);
      // Deixa delta na fila para retry na próxima vez
      this.saveQueue.unshift(delta);
    } finally {
      this.isSaving = false;

      // Processa próximo da fila, se houver
      if (this.saveQueue.length > 0) {
        setTimeout(() => this.processSaveQueue(), 500); // pequeno delay entre saves
      }
    }
  },

  // ─────────────────────────────────────────────────────────
  // API Call
  // ─────────────────────────────────────────────────────────

  /**
   * Envia PATCH request ao backend com o delta.
   * Reutiliza função autosavePPC() definida em api.js
   */
  async sendAutosavePatch(ppcId, delta) {
    // Garante que autosavePPC está disponível (definida em api.js)
    if (typeof autosavePPC !== 'function') {
      throw new Error('autosavePPC não disponível. Verifique se api.js foi carregado.');
    }

    return await autosavePPC(ppcId, delta);
  },

  // ─────────────────────────────────────────────────────────
  // Eventos de Feedback
  // ─────────────────────────────────────────────────────────

  /**
   * Emite evento customizado para feedback visual.
   * Estrutura: { status: "typing|saving|saved|error", message, version }
   */
  emitFeedback(status, message = "", version = null) {
    const event = new CustomEvent("autosave:feedback", {
      detail: {
        status,
        message,
        version: version || this.lastSavedVersion,
        timestamp: new Date().toISOString(),
      },
    });

    document.dispatchEvent(event);
    console.log(`[Autosave Feedback] ${status}: ${message}`);
  },
};

// ─────────────────────────────────────────────────────────
// Export para uso global
// ─────────────────────────────────────────────────────────
// Expõe autosaveManager globalmente para uso em outros scripts
window.autosaveManager = autosaveManager;
