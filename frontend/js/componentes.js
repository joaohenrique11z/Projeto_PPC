document.addEventListener('DOMContentLoaded', () => {
    const form               = document.getElementById('form-componente');
    const tbody              = document.getElementById('componentes-body');
    const emptyMsg           = document.getElementById('table-empty-msg');
    const preRequisitosSelect = document.getElementById('pre_requisitos');
    const correquisitosSelect = document.getElementById('correquisitos');
    const btnAdicionar       = document.getElementById('btn-adicionar');

    let componentes = [];
    let editIndex   = -1;
    let componenteToRemoveIndex = -1;

    const modalRemover       = document.getElementById('modal-remover-componente');
    const btnCancelarRemover = document.getElementById('btn-cancelar-remover');
    const btnConfirmarRemover = document.getElementById('btn-confirmar-remover');

    /** Coleta todos os valores do formulário e retorna um objeto componente. */
    function coletarFormulario() {
        return {
            codigo:        document.getElementById('comp_codigo').value.trim(),
            nome:          document.getElementById('comp_nome').value.trim(),
            tipo:          document.getElementById('comp_tipo').value,
            periodo:       document.getElementById('comp_periodo').value,
            nucleo:        document.getElementById('nucleo_curricular').value,
            subNucleo:     document.getElementById('sub_nucleo').value.trim(),
            totalCreditos: parseInt(document.getElementById('comp_creditos').value) || 0,
            totalHorasAula: parseInt(document.getElementById('comp_ch_total_aula').value) || 0,
            totalHoras:    parseInt(document.getElementById('comp_ch_total_relogio').value) || 0,
            hrExtensao:    parseInt(document.getElementById('horas_extensao').value) || 0,
            hrTeoricas:    parseInt(document.getElementById('horas_teoricas').value) || 0,
            hrPraticas:    parseInt(document.getElementById('horas_praticas').value) || 0,
            preReq:        document.getElementById('pre_requisitos').value,
            coReq:         document.getElementById('correquisitos').value,
            // [FIX] Captura dos campos textuais de ementa e bibliografia
            ementa:        document.getElementById('comp_ementa').value.trim(),
            bibBasica:     document.getElementById('bib_basica').value.trim(),
            bibComplementar: document.getElementById('bib_complementar').value.trim(),
        };
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const novoComponente = coletarFormulario();

        if (editIndex === -1) {
            // Verifica duplicidade de código ao adicionar
            if (componentes.some(c => c.codigo === novoComponente.codigo)) {
                alert('Já existe um componente cadastrado com este código!');
                return;
            }
            componentes.push(novoComponente);
        } else {
            // Verifica duplicidade de código ao editar, excluindo o próprio item
            if (componentes.some((c, i) => c.codigo === novoComponente.codigo && i !== editIndex)) {
                alert('Já existe um componente cadastrado com este código!');
                return;
            }
            componentes[editIndex] = novoComponente;
            editIndex = -1;
            btnAdicionar.textContent = 'Adicionar Componente';
            btnAdicionar.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            btnAdicionar.classList.add('bg-blue-700', 'hover:bg-blue-800');
        }

        limparForm();
        atualizarTabela();
        // Atualiza os selects sem filtro (nenhum componente em edição)
        atualizarSelectsRequisitos(null);
    });

    // Cancela o modo de edição quando o usuário clica em "Limpar Formulário"
    form.addEventListener('reset', () => {
        setTimeout(() => {
            if (editIndex !== -1) {
                editIndex = -1;
                btnAdicionar.textContent = 'Adicionar Componente';
                btnAdicionar.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
                btnAdicionar.classList.add('bg-blue-700', 'hover:bg-blue-800');
                // Restaura os selects sem filtro após cancelar edição
                atualizarSelectsRequisitos(null);
            }
        }, 10);
    });

    function atualizarTabela() {
        tbody.replaceChildren();

        if (componentes.length === 0) {
            emptyMsg.classList.remove('hidden');
            return;
        }

        emptyMsg.classList.add('hidden');

        componentes.forEach((comp, index) => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors';

            const colunas = [
                comp.codigo,
                comp.nome,
                comp.tipo,
                `${comp.periodo}º`,
                comp.nucleo || '-',
                comp.totalCreditos,
                `${comp.totalHoras}h`,
                `${comp.hrTeoricas}h`,
                `${comp.hrPraticas}h`,
                `${comp.hrExtensao}h`,
                comp.preReq || '-',
                comp.coReq || '-',
            ];

            colunas.forEach((texto, i) => {
                const td = document.createElement('td');
                td.className = i === 1
                    ? 'py-3 px-3 text-gray-800 dark:text-gray-200 font-medium'
                    : 'py-3 px-3 text-gray-800 dark:text-gray-200';
                td.textContent = texto; // Proteção contra XSS
                tr.appendChild(td);
            });

            // Coluna de Ações
            const tdAcoes = document.createElement('td');
            tdAcoes.className = 'py-3 px-3';
            const divAcoes = document.createElement('div');
            divAcoes.className = 'flex gap-3';

            const btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.className = 'font-medium text-blue-600 dark:text-blue-400 hover:underline';
            btnEditar.textContent = 'Editar';
            btnEditar.onclick = () => editarComponente(index);

            const btnRemover = document.createElement('button');
            btnRemover.type = 'button';
            btnRemover.className = 'font-medium text-red-600 dark:text-red-400 hover:underline';
            btnRemover.textContent = 'Remover';
            btnRemover.onclick = () => removerComponente(index);

            divAcoes.appendChild(btnEditar);
            divAcoes.appendChild(btnRemover);
            tdAcoes.appendChild(divAcoes);
            tr.appendChild(tdAcoes);
            tbody.appendChild(tr);
        });
    }

    /**
     * Atualiza os selects de pré-requisitos e co-requisitos.
     *
     * [FIX] Recebe o código do componente em edição para filtrá-lo da lista,
     * prevenindo que uma disciplina seja pré-requisito ou co-requisito de si mesma.
     *
     * @param {string|null} codigoEmEdicao - Código do componente sendo editado, ou null.
     */
    function atualizarSelectsRequisitos(codigoEmEdicao) {
        const currentValuePre = preRequisitosSelect.value;
        const currentValueCo  = correquisitosSelect.value;

        preRequisitosSelect.replaceChildren();
        correquisitosSelect.replaceChildren();

        const addOption = (select, value, text) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = text; // Proteção contra XSS
            select.appendChild(opt);
        };

        addOption(preRequisitosSelect, '', 'Nenhum');
        addOption(correquisitosSelect, '', 'Nenhum');

        componentes.forEach(c => {
            // [FIX] Filtro de auto-referência: omite o componente que está sendo editado
            if (c.codigo === codigoEmEdicao) return;

            const texto = `${c.codigo} - ${c.nome}`;
            addOption(preRequisitosSelect, c.codigo, texto);
            addOption(correquisitosSelect, c.codigo, texto);
        });

        // Restaura o valor selecionado anteriormente, se ainda existir na lista
        if (componentes.some(c => c.codigo === currentValuePre && c.codigo !== codigoEmEdicao)) {
            preRequisitosSelect.value = currentValuePre;
        }
        if (componentes.some(c => c.codigo === currentValueCo && c.codigo !== codigoEmEdicao)) {
            correquisitosSelect.value = currentValueCo;
        }
    }

    /**
     * Popula o formulário com os dados do componente selecionado para edição.
     * [FIX] Inclui os campos de ementa, bibliografia básica e complementar,
     * além de sub-núcleo, que estavam ausentes.
     */
    window.editarComponente = (index) => {
        const comp = componentes[index];
        editIndex   = index;

        document.getElementById('comp_codigo').value          = comp.codigo;
        document.getElementById('comp_nome').value            = comp.nome;
        document.getElementById('comp_tipo').value            = comp.tipo;
        document.getElementById('comp_periodo').value         = comp.periodo;
        document.getElementById('nucleo_curricular').value    = comp.nucleo || '';
        document.getElementById('sub_nucleo').value           = comp.subNucleo || '';
        document.getElementById('comp_creditos').value        = comp.totalCreditos;
        document.getElementById('comp_ch_total_aula').value   = comp.totalHorasAula;
        document.getElementById('comp_ch_total_relogio').value = comp.totalHoras;
        document.getElementById('horas_praticas').value       = comp.hrPraticas;
        document.getElementById('horas_teoricas').value       = comp.hrTeoricas;
        document.getElementById('horas_extensao').value       = comp.hrExtensao;

        // [FIX] Restaura os campos textuais que estavam sendo ignorados
        document.getElementById('comp_ementa').value          = comp.ementa || '';
        document.getElementById('bib_basica').value           = comp.bibBasica || '';
        document.getElementById('bib_complementar').value     = comp.bibComplementar || '';

        // [FIX] Atualiza os selects filtrando o próprio componente (anti-auto-referência)
        atualizarSelectsRequisitos(comp.codigo);
        document.getElementById('pre_requisitos').value = comp.preReq || '';
        document.getElementById('correquisitos').value  = comp.coReq || '';

        btnAdicionar.textContent = 'Atualizar Componente';
        btnAdicionar.classList.remove('bg-blue-700', 'hover:bg-blue-800');
        btnAdicionar.classList.add('bg-yellow-600', 'hover:bg-yellow-700');

        document.getElementById('comp_codigo').focus();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.removerComponente = (index) => {
        const compRemovido = componentes[index];

        // Bloqueia a remoção se o componente é pré-requisito ou co-requisito de outro
        const usadoComoPre = componentes.some(c => c.preReq === compRemovido.codigo);
        const usadoComoCo  = componentes.some(c => c.coReq  === compRemovido.codigo);

        if (usadoComoPre || usadoComoCo) {
            alert('Não é possível remover este componente pois ele é requisito para outro(s) na grade.');
            return;
        }

        componenteToRemoveIndex = index;
        modalRemover.classList.remove('hidden');
    };

    btnCancelarRemover.addEventListener('click', () => {
        modalRemover.classList.add('hidden');
        componenteToRemoveIndex = -1;
    });

    btnConfirmarRemover.addEventListener('click', () => {
        if (componenteToRemoveIndex > -1) {
            componentes.splice(componenteToRemoveIndex, 1);

            if (editIndex === componenteToRemoveIndex) {
                // Cancela o modo de edição se o item removido era o que estava sendo editado
                limparForm();
            } else if (editIndex > componenteToRemoveIndex) {
                editIndex--;
            }

            atualizarTabela();
            atualizarSelectsRequisitos(null);
        }
        modalRemover.classList.add('hidden');
        componenteToRemoveIndex = -1;
    });

    /** Limpa todos os campos do formulário e reseta o estado de edição. */
    function limparForm() {
        document.getElementById('comp_codigo').value          = '';
        document.getElementById('comp_nome').value            = '';
        document.getElementById('comp_tipo').value            = 'Obrigatória';
        document.getElementById('comp_periodo').value         = '';
        document.getElementById('nucleo_curricular').value    = '';
        document.getElementById('sub_nucleo').value           = '';
        document.getElementById('comp_creditos').value        = '0';
        document.getElementById('comp_ch_total_aula').value   = '0';
        document.getElementById('comp_ch_total_relogio').value = '0';
        document.getElementById('horas_praticas').value       = '0';
        document.getElementById('horas_teoricas').value       = '0';
        document.getElementById('horas_extensao').value       = '0';
        document.getElementById('pre_requisitos').value       = '';
        document.getElementById('correquisitos').value        = '';
        // [FIX] Limpa os campos textuais que antes não eram resetados
        document.getElementById('comp_ementa').value          = '';
        document.getElementById('bib_basica').value           = '';
        document.getElementById('bib_complementar').value     = '';

        editIndex = -1;
        btnAdicionar.textContent = 'Adicionar Componente';
        btnAdicionar.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        btnAdicionar.classList.add('bg-blue-700', 'hover:bg-blue-800');
    }
});
