document.addEventListener('DOMContentLoaded', () => {
    const modalLimpar = document.getElementById('modal-limpar');
    const btnCancelar = document.getElementById('btn-cancelar-limpar');
    const btnConfirmar = document.getElementById('btn-confirmar-limpar');
    
    let formToReset = null;
    let isConfirming = false;

    // Intercepta todos os eventos de reset na página
    document.addEventListener('reset', (e) => {
        // Se a limpeza foi confirmada no modal, não intercepta
        if (isConfirming) return;

        // Previne a limpeza padrão e mostra o modal
        e.preventDefault();
        formToReset = e.target;
        modalLimpar.classList.remove('hidden');
    });

    // Ação ao clicar em Cancelar
    btnCancelar.addEventListener('click', () => {
        modalLimpar.classList.add('hidden');
        formToReset = null;
    });

    // Ação ao clicar em Limpar Dados (Confirmar)
    btnConfirmar.addEventListener('click', () => {
        if (formToReset) {
            isConfirming = true; // Sinaliza que é uma limpeza confirmada para não abrir o modal novamente
            formToReset.reset(); // Executa a limpeza
            isConfirming = false;
        }
        
        modalLimpar.classList.add('hidden');
        formToReset = null;
    });

    // Fechar modal ao clicar fora da área branca (no fundo escuro)
    modalLimpar.addEventListener('click', (e) => {
        if (e.target === modalLimpar) {
            modalLimpar.classList.add('hidden');
            formToReset = null;
        }
    });
});
