document.addEventListener('DOMContentLoaded', () => {
    const cepInput = document.getElementById('cep');
    const loadingIcon = document.getElementById('cep-loading');
    
    const cidadeInput = document.getElementById('cidade');
    const bairroInput = document.getElementById('bairro');
    const ruaInput = document.getElementById('rua');

    if (!cepInput) return;

    cepInput.addEventListener('input', async (e) => {
        const rawValue = e.target.value;
        // The mask might be XXXXX-XXX, so we remove non-digits
        const cepValue = rawValue.replace(/\D/g, '');

        if (cepValue.length === 8) {
            // Show loading
            if (loadingIcon) loadingIcon.classList.remove('hidden');
            
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    if (cidadeInput) cidadeInput.value = data.localidade || '';
                    if (bairroInput) bairroInput.value = data.bairro || '';
                    if (ruaInput) ruaInput.value = data.logradouro || '';
                    
                    // Focus on the "numero" field so the user can continue typing
                    const numeroInput = document.getElementById('numero');
                    if (numeroInput) {
                        numeroInput.focus();
                    }
                } else {
                    console.warn("CEP não encontrado.");
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            } finally {
                // Hide loading
                if (loadingIcon) loadingIcon.classList.add('hidden');
            }
        }
    });
});
