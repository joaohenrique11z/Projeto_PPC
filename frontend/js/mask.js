const masks = {
    cpf: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },
    cnpj: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },
    cep: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    },
    telefone: (value) => {
        value = value.replace(/\D/g, '');
        if (value.length > 10) {
            return value
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        } else {
            return value
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const applyMask = (selector, maskName) => {
        const element = document.querySelector(selector);
        if (element && masks[maskName]) {
            element.addEventListener('input', (e) => {
                e.target.value = masks[maskName](e.target.value);
            });
        }
    };

    // Aplica as máscaras nos campos existentes
    applyMask('#cnpj', 'cnpj');
    applyMask('#cep', 'cep');
    applyMask('#telefone_fax', 'telefone');
});
