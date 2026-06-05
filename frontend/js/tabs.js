/**
 * tabs.js — Lógica de navegação por Abas Laterais (Vertical Tabs)
 * Sistema Gerador de PPC — IFPE Campus Belo Jardim
 *
 * Responsabilidades:
 *  - Alternar visibilidade dos painéis de conteúdo
 *  - Atualizar estado visual (ativo/inativo) dos botões da sidebar
 *  - Navegação por teclado (↑ ↓ Enter/Space) — ARIA compliant
 *  - Persistência da última aba via sessionStorage
 *  - Comportamento responsivo: toggle mobile sidebar
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------------ */
    /* Seletores                                                            */
    /* ------------------------------------------------------------------ */
    const sidebar       = document.getElementById('ppc-sidebar');
    const tabButtons    = document.querySelectorAll('[data-tab]');
    const tabPanels     = document.querySelectorAll('.tab-panel');
    const mobileToggle  = document.getElementById('btn-mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const progressLabel = document.getElementById('sidebar-progress-label');

    /* ------------------------------------------------------------------ */
    /* Helpers                                                              */
    /* ------------------------------------------------------------------ */

    /** Retorna o índice (0-based) do botão atualmente ativo */
    function getActiveIndex() {
        return Array.from(tabButtons).findIndex(b => b.getAttribute('aria-selected') === 'true');
    }

    /** Atualiza o label de progresso na sidebar */
    function updateProgress(activeIndex) {
        if (!progressLabel) return;
        progressLabel.textContent = `Seção ${activeIndex + 1} de ${tabButtons.length}`;
    }

    /* ------------------------------------------------------------------ */
    /* Ativação de aba                                                      */
    /* ------------------------------------------------------------------ */

    /**
     * @param {string} targetTab  - valor do atributo data-tab do botão alvo
     * @param {boolean} [savePref=true] - se deve salvar no sessionStorage
     */
    function activateTab(targetTab, savePref = true) {
        let activeIndex = 0;

        tabButtons.forEach((btn, i) => {
            const isActive = btn.dataset.tab === targetTab;
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');

            /* --- estilos do botão sidebar --- */
            if (isActive) {
                btn.classList.add(
                    'bg-blue-50', 'dark:bg-blue-900/30',
                    'text-blue-700', 'dark:text-blue-400',
                    'border-l-4', 'border-blue-600', 'dark:border-blue-400',
                    'font-semibold'
                );
                btn.classList.remove(
                    'text-gray-600', 'dark:text-gray-400',
                    'border-l-4', 'border-transparent',
                    'hover:bg-gray-100', 'dark:hover:bg-gray-700/50'
                );
                activeIndex = i;
            } else {
                btn.classList.remove(
                    'bg-blue-50', 'dark:bg-blue-900/30',
                    'text-blue-700', 'dark:text-blue-400',
                    'border-l-4', 'border-blue-600', 'dark:border-blue-400',
                    'font-semibold'
                );
                btn.classList.add(
                    'text-gray-600', 'dark:text-gray-400',
                    'border-l-4', 'border-transparent',
                    'hover:bg-gray-100', 'dark:hover:bg-gray-700/50'
                );
            }
        });

        tabPanels.forEach(panel => {
            const isActive = panel.id === 'tab-' + targetTab;
            panel.classList.toggle('active', isActive);
        });

        updateProgress(activeIndex);

        if (savePref) {
            try { sessionStorage.setItem('ppc_active_tab', targetTab); } catch (_) {}
        }

        /* Fecha o menu mobile após seleção */
        closeMobileSidebar();
    }

    /* ------------------------------------------------------------------ */
    /* Eventos — clique                                                     */
    /* ------------------------------------------------------------------ */
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    /* ------------------------------------------------------------------ */
    /* Eventos — teclado (WAI-ARIA Authoring Practices: vertical tablist)  */
    /* ------------------------------------------------------------------ */
    tabButtons.forEach(btn => {
        btn.addEventListener('keydown', function (e) {
            const btns  = Array.from(tabButtons);
            const idx   = btns.indexOf(this);
            let next    = -1;

            if (e.key === 'ArrowDown')  { next = (idx + 1) % btns.length; }
            if (e.key === 'ArrowUp')    { next = (idx - 1 + btns.length) % btns.length; }
            if (e.key === 'Home')       { next = 0; }
            if (e.key === 'End')        { next = btns.length - 1; }

            if (next !== -1) {
                e.preventDefault();
                btns[next].focus();
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateTab(this.dataset.tab);
            }
        });
    });

    /* ------------------------------------------------------------------ */
    /* Comportamento Mobile — toggle da sidebar                            */
    /* ------------------------------------------------------------------ */
    function openMobileSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('-translate-x-full', 'opacity-0', 'pointer-events-none');
        sidebar.classList.add('translate-x-0', 'opacity-100');
        mobileOverlay && mobileOverlay.classList.remove('hidden');
        mobileToggle  && mobileToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMobileSidebar() {
        if (!sidebar) return;
        /* Só fecha se estiver na viewport mobile (< md) */
        if (window.innerWidth >= 768) return;
        sidebar.classList.add('-translate-x-full', 'opacity-0', 'pointer-events-none');
        sidebar.classList.remove('translate-x-0', 'opacity-100');
        mobileOverlay && mobileOverlay.classList.add('hidden');
        mobileToggle  && mobileToggle.setAttribute('aria-expanded', 'false');
    }

    mobileToggle  && mobileToggle.addEventListener('click', openMobileSidebar);
    mobileOverlay && mobileOverlay.addEventListener('click', closeMobileSidebar);

    /* Fecha ao redimensionar para desktop */
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            sidebar && sidebar.classList.remove('-translate-x-full', 'opacity-0', 'pointer-events-none');
            mobileOverlay && mobileOverlay.classList.add('hidden');
        }
    });

    /* ------------------------------------------------------------------ */
    /* Restaura última aba visitada                                        */
    /* ------------------------------------------------------------------ */
    function init() {
        let saved = null;
        try { saved = sessionStorage.getItem('ppc_active_tab'); } catch (_) {}
        const first = tabButtons[0] ? tabButtons[0].dataset.tab : 'institucional';
        activateTab(saved || first, false);
    }

    /* Aguarda o DOM estar pronto */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
    