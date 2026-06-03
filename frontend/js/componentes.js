document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-componente');
    const tbody = document.getElementById('componentes-body');
    const emptyMsg = document.getElementById('table-empty-msg');
    const preRequisitosSelect = document.getElementById('pre_requisitos');
    const correquisitosSelect = document.getElementById('correquisitos');
    const btnAdicionar = document.getElementById('btn-adicionar');

    let componentes = [];
    let editIndex = -1;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const codigo = document.getElementById('comp_codigo').value;
        const nome = document.getElementById('comp_nome').value;
        const tipo = document.getElementById('comp_tipo').value;
        const periodo = document.getElementById('comp_periodo').value;
        const credPraticas = parseInt(document.getElementById('creditos_praticas').value) || 0;
        const credTeoricas = parseInt(document.getElementById('creditos_teoricas').value) || 0;
        const credExtensao = parseInt(document.getElementById('creditos_extensao').value) || 0;
        const hrPraticas = parseInt(document.getElementById('horas_praticas').value) || 0;
        const hrTeoricas = parseInt(document.getElementById('horas_teoricas').value) || 0;
        const hrExtensao = parseInt(document.getElementById('horas_extensao').value) || 0;
        const preReq = document.getElementById('pre_requisitos').value;
        const coReq = document.getElementById('correquisitos').value;

        const totalCreditos = credPraticas + credTeoricas + credExtensao;
        const totalHoras = hrPraticas + hrTeoricas + hrExtensao;

        const novoComponente = {
            codigo,
            nome,
            tipo,
            periodo,
            totalCreditos,
            totalHoras,
            hrPraticas,
            hrTeoricas,
            preReq,
            coReq,
            credPraticas,
            credTeoricas,
            credExtensao,
            hrExtensao
        };

        if (editIndex === -1) {
            // Check if code already exists to avoid duplicates
            if (componentes.some(c => c.codigo === codigo)) {
                alert('Já existe um componente cadastrado com este código!');
                return;
            }
            componentes.push(novoComponente);
        } else {
            // Check if updated code already exists and it's not the same item
            if (componentes.some((c, i) => c.codigo === codigo && i !== editIndex)) {
                alert('Já existe um componente cadastrado com este código!');
                return;
            }
            componentes[editIndex] = novoComponente;
            editIndex = -1;
            btnAdicionar.textContent = 'Adicionar';
            btnAdicionar.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            btnAdicionar.classList.add('bg-blue-700', 'hover:bg-blue-800');
        }

        limparForm();
        atualizarTabela();
        atualizarSelectsRequisitos();
    });

    // Observar resets do formulário para cancelar modo de edição se o usuário clicar no botão "Limpar Formulário"
    form.addEventListener('reset', () => {
        // Usa um pequeno delay para que o form resete os campos antes de mudarmos o botão, mas não é estritamente necessário.
        setTimeout(() => {
            if (editIndex !== -1) {
                editIndex = -1;
                btnAdicionar.textContent = 'Adicionar';
                btnAdicionar.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
                btnAdicionar.classList.add('bg-blue-700', 'hover:bg-blue-800');
            }
        }, 10);
    });

    function atualizarTabela() {
        tbody.innerHTML = '';
        
        if (componentes.length === 0) {
            emptyMsg.classList.remove('hidden');
        } else {
            emptyMsg.classList.add('hidden');
            
            componentes.forEach((comp, index) => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors';
                
                tr.innerHTML = `
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.codigo}</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200 font-medium">${comp.nome}</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.tipo}</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.periodo}º</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.totalCreditos}</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.totalHoras}h</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.hrPraticas}h</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.hrTeoricas}h</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.preReq || '-'}</td>
                    <td class="py-3 px-3 text-gray-800 dark:text-gray-200">${comp.coReq || '-'}</td>
                    <td class="py-3 px-3">
                        <div class="flex gap-3">
                            <button type="button" class="font-medium text-blue-600 dark:text-blue-400 hover:underline" onclick="editarComponente(${index})">Editar</button>
                            <button type="button" class="font-medium text-red-600 dark:text-red-400 hover:underline" onclick="removerComponente(${index})">Remover</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    function atualizarSelectsRequisitos() {
        const currentValuePre = preRequisitosSelect.value;
        const currentValueCo = correquisitosSelect.value;

        const optionsHTML = '<option value="">Nenhum</option>' + componentes.map(c => `<option value="${c.codigo}">${c.codigo} - ${c.nome}</option>`).join('');
        
        preRequisitosSelect.innerHTML = optionsHTML;
        correquisitosSelect.innerHTML = optionsHTML;

        // Tentar restaurar o valor anterior se ele ainda existir na lista
        if (componentes.some(c => c.codigo === currentValuePre)) {
            preRequisitosSelect.value = currentValuePre;
        }
        if (componentes.some(c => c.codigo === currentValueCo)) {
            correquisitosSelect.value = currentValueCo;
        }
    }

    window.editarComponente = (index) => {
        const comp = componentes[index];
        editIndex = index;
        
        document.getElementById('comp_codigo').value = comp.codigo;
        document.getElementById('comp_nome').value = comp.nome;
        document.getElementById('comp_tipo').value = comp.tipo;
        document.getElementById('comp_periodo').value = comp.periodo;
        document.getElementById('creditos_praticas').value = comp.credPraticas;
        document.getElementById('creditos_teoricas').value = comp.credTeoricas;
        document.getElementById('creditos_extensao').value = comp.credExtensao;
        document.getElementById('horas_praticas').value = comp.hrPraticas;
        document.getElementById('horas_teoricas').value = comp.hrTeoricas;
        document.getElementById('horas_extensao').value = comp.hrExtensao;
        
        // Atualiza os selects de pre-requisitos pra garantir que contém todas as opções
        atualizarSelectsRequisitos();
        document.getElementById('pre_requisitos').value = comp.preReq;
        document.getElementById('correquisitos').value = comp.coReq;

        btnAdicionar.textContent = 'Atualizar Componente';
        btnAdicionar.classList.remove('bg-blue-700', 'hover:bg-blue-800');
        btnAdicionar.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        
        // Focar no formulário para facilitar
        document.getElementById('comp_codigo').focus();
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.removerComponente = (index) => {
        if (confirm('Tem certeza que deseja remover este componente?')) {
            const compRemovido = componentes[index];
            
            // Bloqueia a remoção se ele for pré-requisito de outro componente
            const usadoComoPre = componentes.some(c => c.preReq === compRemovido.codigo);
            const usadoComoCo = componentes.some(c => c.coReq === compRemovido.codigo);
            
            if (usadoComoPre || usadoComoCo) {
                alert('Não é possível remover este componente pois ele é requisito para outro(s) na grade.');
                return;
            }

            componentes.splice(index, 1);

            if (editIndex === index) {
                // Cancel edit mode if editing the removed item
                limparForm();
            } else if (editIndex > index) {
                editIndex--;
            }

            atualizarTabela();
            atualizarSelectsRequisitos();
        }
    };

    function limparForm() {
        document.getElementById('comp_codigo').value = '';
        document.getElementById('comp_nome').value = '';
        document.getElementById('comp_tipo').value = 'Obrigatória';
        document.getElementById('comp_periodo').value = '';
        document.getElementById('creditos_praticas').value = '0';
        document.getElementById('creditos_teoricas').value = '0';
        document.getElementById('creditos_extensao').value = '0';
        document.getElementById('horas_praticas').value = '0';
        document.getElementById('horas_teoricas').value = '0';
        document.getElementById('horas_extensao').value = '0';
        document.getElementById('pre_requisitos').value = '';
        document.getElementById('correquisitos').value = '';
        
        editIndex = -1;
        btnAdicionar.textContent = 'Adicionar';
        btnAdicionar.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        btnAdicionar.classList.add('bg-blue-700', 'hover:bg-blue-800');
    }
});
