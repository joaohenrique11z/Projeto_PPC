document.addEventListener('DOMContentLoaded', () => {
    const modalLimpar = document.getElementById('modal-limpar');
    const btnCancelar = document.getElementById('btn-cancelar-limpar');
    const btnConfirmar = document.getElementById('btn-confirmar-limpar');
    
    let formToReset = null;

    // Intercepta cliques nos botões de reset
    document.querySelectorAll('button[type="reset"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            formToReset = btn.closest('form');
            if (formToReset) {
                modalLimpar.classList.remove('hidden');
            }
        });
    });

    // Ação ao clicar em Cancelar
    btnCancelar.addEventListener('click', () => {
        modalLimpar.classList.add('hidden');
        formToReset = null;
    });

    // Ação ao clicar em Limpar Dados (Confirmar)
    btnConfirmar.addEventListener('click', () => {
        if (formToReset) {
            formToReset.reset(); // Executa a limpeza
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
