/**
 * validation.js
 * Intercepts the "Enviar PPC" button and runs two validation rules:
 *   1. Table/list checks — each dynamic list must have at least one entry.
 *   2. Required-field checks — all required inputs inside the specified
 *      tab forms must be filled.
 *
 * If any rule fails the existing modal (#modal-validacao-envio) is opened
 * and the error list is injected into it dynamically.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — adjust these selectors if your HTML IDs ever change.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dynamic tables that must contain at least one data row (<tr>) in their
 * <tbody> before the form can be submitted.
 *
 * @type {Array<{ tbodyId: string, label: string }>}
 */
const TABLE_CHECKS = [
  { tbodyId: "membros-body",      label: "Membros Cadastrados"        },
  { tbodyId: "componentes-body",  label: "Grade Curricular"           },
  { tbodyId: "docentes-body",     label: "Docentes Cadastrados"       },
  { tbodyId: "ambientes-body",    label: "Ambientes Cadastrados"      },
  { tbodyId: "itens-infra-body",  label: "Itens de Infraestrutura"    },
];

/**
 * Tab sections whose required fields (input, select, textarea[required])
 * will be validated for emptiness.
 *
 * Each entry maps the tab's human-readable name to the CSS selector of its
 * containing <section> or <form> element. If a tab contains multiple forms,
 * list them all inside `formSelectors`.
 *
 * @type {Array<{ tabLabel: string, formSelectors: string[] }>}
 */
const TAB_FIELD_CHECKS = [
  {
    tabLabel:      "Dados Institucionais",
    formSelectors: ["#form-proponente"],
  },
  {
    tabLabel:      "Estrutura do Curso",
    formSelectors: ["#form-curso"],
  },
  {
    tabLabel:      "Situação e Avaliação do Curso",
    formSelectors: ["#form-situacao"],
  },
];

// IDs of the validation error modal and its close button.
const MODAL_ID              = "modal-validacao-envio";
const MODAL_CLOSE_BTN       = "btn-fechar-validacao";

// IDs of the confirmation modal and its action buttons.
const MODAL_CONFIRM_ID      = "modal-confirmar-envio";
const BTN_CONFIRM_SEND      = "btn-confirmar-envio";
const BTN_CANCEL_SEND       = "btn-cancelar-envio";

// ID of the submit button in the sidebar.
const SUBMIT_BTN_ID         = "btn-enviar-ppc";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the visible label text for a form field.
 * Looks for an associated <label> element; falls back to the field's
 * placeholder, name, or id attribute.
 *
 * @param {HTMLElement} field
 * @returns {string}
 */
function getFieldLabel(field) {
  // Try explicit <label for="...">
  if (field.id) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label) {
      // Strip the trailing " *" that many labels include.
      return label.textContent.replace(/\s*\*\s*$/, "").trim();
    }
  }
  // Fall back to placeholder, name, or id.
  return field.placeholder || field.name || field.id || "Campo desconhecido";
}

/**
 * Checks whether a form field is considered empty.
 * For <select>, an empty string value ("") counts as not selected.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field
 * @returns {boolean}
 */
function isFieldEmpty(field) {
  return field.value.trim() === "";
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rule 1 — Table/list checks.
 * Verifies that each configured <tbody> contains at least one <tr>.
 *
 * @returns {string[]} Array of human-readable error messages.
 */
function validateTables() {
  const errors = [];

  for (const { tbodyId, label } of TABLE_CHECKS) {
    const tbody = document.getElementById(tbodyId);

    // If the element doesn't exist in the DOM, skip silently.
    if (!tbody) continue;

    const rowCount = tbody.querySelectorAll("tr").length;
    if (rowCount === 0) {
      errors.push(
        `A tabela "${label}" precisa ter pelo menos um registro inserido.`
      );
    }
  }

  return errors;
}

/**
 * Rule 2 — Required-field checks.
 * Iterates over each configured form/section and collects every required
 * field that is currently empty.
 *
 * @returns {string[]} Array of human-readable error messages.
 */
function validateRequiredFields() {
  const errors = [];

  for (const { tabLabel, formSelectors } of TAB_FIELD_CHECKS) {
    for (const selector of formSelectors) {
      const container = document.querySelector(selector);
      if (!container) continue;

      // Select all required inputs, selects, and textareas inside this form.
      const requiredFields = container.querySelectorAll(
        "input[required], select[required], textarea[required]"
      );

      for (const field of requiredFields) {
        if (isFieldEmpty(field)) {
          const fieldLabel = getFieldLabel(field);
          errors.push(
            `O campo "${fieldLabel}" na aba "${tabLabel}" é obrigatório.`
          );
        }
      }
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Injects an error list into the validation modal and opens it.
 * The list is appended after the existing header content inside the modal.
 *
 * @param {string[]} errors - Non-empty list of error messages.
 */
function showValidationModal(errors) {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) {
    // Fallback: browser alert when the modal element is missing.
    alert("Corrija os seguintes itens antes de enviar:\n\n" + errors.join("\n"));
    return;
  }

  // Remove any previously injected error list to avoid duplicates.
  const existingList = modal.querySelector("#validation-error-list");
  if (existingList) existingList.remove();

  // Build the error list element.
  const errorList = document.createElement("ul");
  errorList.id = "validation-error-list";
  errorList.className = [
    "mt-4",
    "mb-4",
    "space-y-1.5",
    "max-h-60",
    "overflow-y-auto",
    "text-sm",
    "text-red-700",
    "dark:text-red-400",
    "border",
    "border-red-200",
    "dark:border-red-800/40",
    "rounded-lg",
    "bg-red-50",
    "dark:bg-red-900/20",
    "p-3",
  ].join(" ");

  for (const message of errors) {
    const item = document.createElement("li");
    item.className = "flex items-start gap-2";
    item.innerHTML = `
      <span class="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></span>
      <span>${message}</span>
    `;
    errorList.appendChild(item);
  }

  // The modal card is the first direct child <div> inside the overlay.
  const card     = modal.querySelector(":scope > div");
  const closeRow = card ? card.querySelector(".flex.justify-end") : null;

  if (card && closeRow) {
    card.insertBefore(errorList, closeRow);
  } else if (card) {
    card.appendChild(errorList);
  } else {
    modal.appendChild(errorList);
  }

  // Open the modal by removing the "hidden" class.
  modal.classList.remove("hidden");
}

/**
 * Closes the validation modal.
 */
function closeValidationModal() {
  const modal = document.getElementById(MODAL_ID);
  if (modal) modal.classList.add("hidden");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VALIDATION HANDLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs all validation rules and, if any fail, prevents the default action
 * and shows the modal with the collected errors.
 *
 * @param {Event} event - The click event from the submit button.
 */
function handleSubmitValidation(event) {
  event.preventDefault();

  const tableErrors  = validateTables();
  const fieldErrors  = validateRequiredFields();
  const allErrors    = [...tableErrors, ...fieldErrors];

  if (allErrors.length > 0) {
    showValidationModal(allErrors);
    return;
  }

  // All validations passed — open the confirmation modal before dispatching.
  console.info("[validation.js] All checks passed. Opening confirmation modal.");
  const confirmModal = document.getElementById(MODAL_CONFIRM_ID);
  if (confirmModal) confirmModal.classList.remove("hidden");

  
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOTSTRAP — attach listeners once the DOM is ready
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Attach validation to the "Enviar PPC" sidebar button.
  const submitBtn = document.getElementById(SUBMIT_BTN_ID);
  if (submitBtn) {
    submitBtn.addEventListener("click", handleSubmitValidation);
  } else {
    console.warn(
      `[validation.js] Submit button "#${SUBMIT_BTN_ID}" not found in the DOM.`
    );
  }

  // Attach close behaviour to the validation modal's "Entendido" button.
  const closeBtn = document.getElementById(MODAL_CLOSE_BTN);
  if (closeBtn) {
    closeBtn.addEventListener("click", closeValidationModal);
  }

  // Also close validation modal when clicking the backdrop.
  const modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeValidationModal();
    });
  }

  // ── Confirmation modal listeners ─────────────────────────────────────
  const confirmModal  = document.getElementById(MODAL_CONFIRM_ID);
  const btnConfirm    = document.getElementById(BTN_CONFIRM_SEND);
  const btnCancelSend = document.getElementById(BTN_CANCEL_SEND);

  /** Closes the confirmation modal without taking any action. */
  function closeConfirmModal() {
    if (confirmModal) confirmModal.classList.add("hidden");
  }

  if (btnCancelSend) {
    btnCancelSend.addEventListener("click", closeConfirmModal);
  }

  // Close when clicking the backdrop of the confirmation modal.
  if (confirmModal) {
    confirmModal.addEventListener("click", (event) => {
      if (event.target === confirmModal) closeConfirmModal();
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
      closeConfirmModal();
      // Redirect to index.html since the collector test was removed.
      console.info("[validation.js] User confirmed. Redirecting to index.");
      window.location.href = "index.html";
    });
  }
});
