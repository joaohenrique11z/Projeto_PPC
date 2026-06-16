// Script para preenchimento automático do formulário com dados aleatórios para testes

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function preencherDadosTeste() {
    // Tab 1: Dados Institucionais
    const dadosInstitucionais = {
        'campus_name': getRandomItem(['Belo Jardim', 'Recife', 'Pesqueira', 'Garanhuns', 'Igarassu']),
        'cnpj': getRandomItem(['10.767.239/0001-45', '10.767.239/0002-26', '10.767.239/0003-07']),
        'cep': getRandomItem(['55150-000', '50740-540', '55200-000']),
        'cidade': getRandomItem(['Belo Jardim', 'Recife', 'Pesqueira', 'Caruaru']),
        'bairro': getRandomItem(['São Pedro', 'Várzea', 'Centro', 'Prado']),
        'rua': getRandomItem(['Av. Sebastião Rodrigues da Costa', 'Av. Prof. Moraes Rego', 'BR-232, Km 208']),
        'numero': getRandomItem(['S/N', '1234', '500']),
        'telefone_fax': getRandomItem(['(81) 3726-1024', '(81) 2125-1600', '(87) 3835-1122']),
        'email_contato': getRandomItem(['campus@ifpe.edu.br', 'direcao@ifpe.edu.br', 'contato@ifpe.edu.br']),
        'ato_legal': getRandomItem(['Lei nº 11.892, de 29/12/2008', 'Portaria MEC nº 1.234/2015', 'Resolução CONSUP nº 15/2020']),
        'sitio_web': getRandomItem(['https://www.ifpe.edu.br/campus/belojardim', 'https://www.ifpe.edu.br/campus/recife'])
    };

    // Tab 2: Estrutura do Curso
    const estruturaCurso = {
        'nome_curso': getRandomItem(['Engenharia de Software', 'Sistemas de Informação', 'Ciência da Computação', 'Engenharia de Computação']),
        'area_conhecimento': getRandomItem(['Ciências Exatas e da Terra', 'Engenharias', 'Ciências Aplicadas']),
        'nivel': getRandomItem(['Graduação', 'Pós-Graduação']), 
        'tipo_curso': getRandomItem(['Bacharelado', 'Licenciatura', 'Tecnólogo']),
        'modalidade_curso': getRandomItem(['Presencial', 'EaD', 'Híbrido']),
        'eixo_tecnologico': getRandomItem(['Informação e Comunicação', 'Controle e Processos Industriais', 'Gestão e Negócios']),
        'titulacao': getRandomItem(['Bacharel', 'Licenciado', 'Tecnólogo']),
        'ch_total_relogio': getRandomItem(['3205', '3600', '4000']),
        'ch_total_aula': getRandomItem(['3846', '4320', '4800']),
        'duracao_aula_minutos': getRandomItem(['50', '45', '60']),
        'atividades_complementares': getRandomItem(['200', '150', '300']),
        'ch_extensao': getRandomItem(['320', '360', '400']),
        'integralizacao_min_semestres': getRandomItem(['8', '6', '10']),
        'integralizacao_max_semestres': getRandomItem(['16', '12', '15']),
        'semanas_letivas': getRandomItem(['20', '18', '22']),
        'periodicidade_letiva': getRandomItem(['Semestral', 'Anual']),
        'inicio_curso': getRandomItem(['2024.1', '2023.2', '2025.1']),
        'matriz_curricular_alterada': getRandomItem(['2024.1', '2022.2', '2021.1']),
        'regime_matricula': getRandomItem(['Seriado', 'Créditos']),
        'formas_acesso': getRandomItem(['Sisu', 'Vestibular', 'Transferência']),
        'pre_requisito_ingresso': getRandomItem(['Ensino Médio Completo', 'Ensino Técnico Completo']),
        'turnos': getRandomItem(['Integral', 'Noturno', 'Matutino', 'Vespertino']),
        'vagas_anuais': getRandomItem(['60', '80', '40']),
        'vagas_turno': getRandomItem(['30', '40', '20']),
        'cursos_tecnicos_afins': getRandomItem(['Técnico em Informática', 'Técnico em Redes', 'Técnico em Desenvolvimento de Sistemas']),
        'cursos_graduacao_afins': getRandomItem(['Sistemas para Internet', 'Gestão de TI', 'Redes de Computadores'])
    };

    // Tab 3: Situação e Avaliação
    const situacaoAvaliacao = {
        'status_curso': getRandomItem([
            'Aguardando autorização do conselho superior', 
            'Autorizado pelo conselho superior', 
            'Em funcionamento', 
            'Aguardando reconhecimento do MEC', 
            'Reconhecido pelo MEC'
        ]),
        'tipo_reformulacao': getRandomItem([
            'Apresentação Inicial do PPC', 
            'Reformulação do PPC', 
            'Reconhecimento', 
            'Renovação de Reconhecimento'
        ]),
        'conceito_cc': getRandomItem(['3', '4', '5']),
        'conceito_cpc': getRandomItem(['3', '4', '5']),
        'conceito_enade': getRandomItem(['3', '4', '5']),
        'igc': getRandomItem(['3', '4', '5'])
    };

    // Tab 6: Coordenação
    const coordenacaoCurso = {
        'coord_nome': getRandomItem(['Prof. Dr. Marcos Silveira', 'Profa. Dra. Ana Carolina', 'Prof. Me. Carlos Eduardo', 'Profa. Ma. Julia Nunes']),
        'coord_email': getRandomItem(['coordenador.es@ifpe.edu.br', 'coordenacao.ti@ifpe.edu.br', 'coord.bcc@ifpe.edu.br']),
        'coord_regime_trabalho': getRandomItem(['DE', '40h', '20h']),
        'coord_ch_semanal': getRandomItem(['20', '10', '40']),
        'coord_qualificacao': getRandomItem(['Doutor em Informática', 'Mestre em Ciência da Computação', 'Doutor em Engenharia de Software']),
        'coord_tempo_ies': getRandomItem(['10 anos', '5 anos', '15 anos']),
        'coord_tempo_coord': getRandomItem(['3 anos', '1 ano', '5 anos']),
        'coord_grupos_pesquisa': getRandomItem(['Engenharia de Software Aplicada', 'Inteligência Artificial', 'Redes e Segurança']),
        'coord_linhas_pesquisa': getRandomItem(['Qualidade de Software', 'Machine Learning', 'Cibersegurança']),
        'coord_exp_profissional': getRandomItem(['15', '10', '8', '20']),
        'coord_exp_gestao': getRandomItem(['5 anos como coordenador', '2 anos como diretor', 'Nenhuma']),
        'coord_titulacao': getRandomItem([
            'Doutorado em Ciência da Computação - UFPE (2018)',
            'Mestrado em Engenharia Informática - UFPB (2015)',
            'Doutorado em Computação - UFCG (2020)'
        ])
    };

    // Mesclar todos os dados
    const todosDados = {
        ...dadosInstitucionais,
        ...estruturaCurso,
        ...situacaoAvaliacao,
        ...coordenacaoCurso
    };

    // Preencher os campos
    for (const [id, valor] of Object.entries(todosDados)) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = valor;
            elemento.dispatchEvent(new Event('input', { bubbles: true }));
            elemento.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // Gerar tabelas com valores aleatórios também

    // Membros Institucionais (2 opções de listas)
    const opcoesMembros = [
        [
            { tipo: 'Gestão', cargo: 'Reitor', nome: 'José da Silva' },
            { tipo: 'Gestão', cargo: 'Diretor Geral do Campus', nome: 'Maria Souza' }
        ],
        [
            { tipo: 'NDE', cargo: 'Assessoria Pedagógica', nome: 'Roberto Alves' },
            { tipo: 'Comissão de Elaboração', cargo: 'Coordenador do Curso', nome: 'Fernanda Lima' },
            { tipo: 'Gestão', cargo: 'Pró-Reitora de Ensino', nome: 'Silvana Marques' }
        ]
    ];

    // Docentes (2 opções de listas)
    const opcoesDocentes = [
        [
            {
                nome: 'João Professor',
                titulacao: 'Doutor',
                regime_trabalho: 'DE',
                experiencia_docencia_anos: 10,
                link_lattes: 'http://lattes.cnpq.br/12345',
                formacao_academica: 'Doutorado em Ciência da Computação',
                componentes_ministrados: ['COMP01', 'COMP02']
            },
            {
                nome: 'Laura Cientista',
                titulacao: 'Pós-Doutor',
                regime_trabalho: 'DE',
                experiencia_docencia_anos: 15,
                link_lattes: 'http://lattes.cnpq.br/67890',
                formacao_academica: 'Pós-Doutorado em IA',
                componentes_ministrados: ['COMP03']
            }
        ],
        [
            {
                nome: 'Carlos Mestre',
                titulacao: 'Mestre',
                regime_trabalho: '40h',
                experiencia_docencia_anos: 5,
                link_lattes: 'http://lattes.cnpq.br/abcde',
                formacao_academica: 'Mestrado em Engenharia Elétrica',
                componentes_ministrados: ['MAT01', 'FIS01']
            }
        ]
    ];

    // Ambientes (2 opções)
    const opcoesAmbientes = [
        [
            {
                categoria: 'Área do Curso',
                nome_ambiente: 'Laboratório de Informática 1',
                quantidade: 2,
                area_m2: '40',
                itens: [
                    { tipo: 'Equipamento', nome_item: 'Computador Dell i7', quantidade: 20, especificacoes: 'i7, 16GB RAM' },
                    { tipo: 'Mobiliário', nome_item: 'Cadeira Ergonômica', quantidade: 20, especificacoes: 'Com braços' }
                ]
            }
        ],
        [
            {
                categoria: 'Área Comum',
                nome_ambiente: 'Biblioteca Central',
                quantidade: 1,
                area_m2: '200',
                itens: [
                    { tipo: 'Mobiliário', nome_item: 'Mesa de Estudos', quantidade: 10, especificacoes: 'Madeira' },
                    { tipo: 'Mobiliário', nome_item: 'Estante de Livros', quantidade: 30, especificacoes: 'Aço' }
                ]
            },
            {
                categoria: 'Área do Curso',
                nome_ambiente: 'Laboratório de Redes',
                quantidade: 1,
                area_m2: '50',
                itens: [
                    { tipo: 'Equipamento', nome_item: 'Switch Cisco', quantidade: 5, especificacoes: '24 portas' },
                    { tipo: 'Equipamento', nome_item: 'Roteador', quantidade: 5, especificacoes: 'Gigabit' }
                ]
            }
        ]
    ];

    // Componentes Curriculares (2 opções, com dependências diferentes)
    const opcoesComponentes = [
        [
            {
                codigo: 'COMP01',
                nome: 'Algoritmos e Programação',
                tipo: 'Obrigatória',
                periodo: 1,
                nucleo_curricular: 'Núcleo Básico',
                creditos: 4,
                ch_total_aula: 80,
                ch_total_relogio: 66,
                ch_teorica: 33,
                ch_pratica: 33,
                ch_extensao: 0,
                ementa: 'Conceitos básicos de programação.',
                bibliografias: [
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE ALGORITMOS 1' },
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE ALGORITMOS 2' },
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE ALGORITMOS 3' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR 1' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR 2' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR 3' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR 4' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR 5' }
                ]
            },
            {
                codigo: 'COMP02',
                nome: 'Estrutura de Dados',
                tipo: 'Obrigatória',
                periodo: 2,
                nucleo_curricular: 'Núcleo Profissionalizante',
                creditos: 4,
                ch_total_aula: 80,
                ch_total_relogio: 66,
                ch_teorica: 33,
                ch_pratica: 33,
                ch_extensao: 0,
                ementa: 'Estruturas de dados avançadas.',
                pre_requisito_codigo: 'COMP01',
                bibliografias: [
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE ED 1' },
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE ED 2' },
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE ED 3' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR ED 1' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR ED 2' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR ED 3' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR ED 4' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR ED 5' }
                ]
            },
            {
                codigo: 'COMP03',
                nome: 'Banco de Dados',
                tipo: 'Obrigatória',
                periodo: 3,
                nucleo_curricular: 'Núcleo Profissionalizante',
                creditos: 4,
                ch_total_aula: 80,
                ch_total_relogio: 66,
                ch_teorica: 33,
                ch_pratica: 33,
                ch_extensao: 0,
                ementa: 'Modelagem e SQL.',
                co_requisito_codigo: 'COMP02',
                bibliografias: [
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE BD 1' },
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE BD 2' },
                    { tipo: 'Básica', referencia_texto: 'LIVRO DE BD 3' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR BD 1' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR BD 2' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR BD 3' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR BD 4' },
                    { tipo: 'Complementar', referencia_texto: 'COMPLEMENTAR BD 5' }
                ]
            }
        ],
        [
            {
                codigo: 'MAT01',
                nome: 'Cálculo Diferencial e Integral',
                tipo: 'Obrigatória',
                periodo: 1,
                nucleo_curricular: 'Núcleo Básico',
                creditos: 4,
                ch_total_aula: 80,
                ch_total_relogio: 66,
                ch_teorica: 66,
                ch_pratica: 0,
                ch_extensao: 0,
                ementa: 'Limites, Derivadas e Integrais.',
                bibliografias: [
                    { tipo: 'Básica', referencia_texto: 'Cálculo Guidorizzi Vol 1' },
                    { tipo: 'Básica', referencia_texto: 'Cálculo Stewart Vol 1' },
                    { tipo: 'Básica', referencia_texto: 'Cálculo Thomas Vol 1' },
                    { tipo: 'Complementar', referencia_texto: 'Cálculo Leithold' },
                    { tipo: 'Complementar', referencia_texto: 'Cálculo Apostol' },
                    { tipo: 'Complementar', referencia_texto: 'Cálculo Spivak' },
                    { tipo: 'Complementar', referencia_texto: 'Cálculo Courant' },
                    { tipo: 'Complementar', referencia_texto: 'Cálculo Simmons' }
                ]
            },
            {
                codigo: 'FIS01',
                nome: 'Física I',
                tipo: 'Obrigatória',
                periodo: 2,
                nucleo_curricular: 'Núcleo Básico',
                creditos: 4,
                ch_total_aula: 80,
                ch_total_relogio: 66,
                ch_teorica: 44,
                ch_pratica: 22,
                ch_extensao: 0,
                ementa: 'Cinemática e Dinâmica.',
                co_requisito_codigo: 'MAT01',
                bibliografias: [
                    { tipo: 'Básica', referencia_texto: 'Física Halliday Vol 1' },
                    { tipo: 'Básica', referencia_texto: 'Física Sears Vol 1' },
                    { tipo: 'Básica', referencia_texto: 'Física Tipler Vol 1' },
                    { tipo: 'Complementar', referencia_texto: 'Física Alonso Vol 1' },
                    { tipo: 'Complementar', referencia_texto: 'Física Feynman Vol 1' },
                    { tipo: 'Complementar', referencia_texto: 'Física Nussenzveig Vol 1' },
                    { tipo: 'Complementar', referencia_texto: 'Física Resnick Vol 1' },
                    { tipo: 'Complementar', referencia_texto: 'Física Serway Vol 1' }
                ]
            }
        ]
    ];

    document.dispatchEvent(new CustomEvent('ppc:dados-membros', { detail: getRandomItem(opcoesMembros) }));
    document.dispatchEvent(new CustomEvent('ppc:dados-docentes', { detail: getRandomItem(opcoesDocentes) }));
    document.dispatchEvent(new CustomEvent('ppc:dados-ambientes', { detail: getRandomItem(opcoesAmbientes) }));
    document.dispatchEvent(new CustomEvent('ppc:dados-componentes', { detail: getRandomItem(opcoesComponentes) }));

    alert('Campos e tabelas preenchidos aleatoriamente para teste!');
}

// Adicionar um botão no cabeçalho ou flutuante
document.addEventListener('DOMContentLoaded', () => {
    // Evita duplicar se recarregar
    if(document.getElementById('btn-test-filler')) return;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'fixed bottom-4 right-4 z-50';
    
    const btn = document.createElement('button');
    btn.id = 'btn-test-filler';
    btn.type = 'button';
    btn.className = 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-lg flex items-center gap-2 transition-transform active:scale-95';
    btn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        Preenchimento Aleatório
    `;
    btn.onclick = preencherDadosTeste;
    
    btnContainer.appendChild(btn);
    document.body.appendChild(btnContainer);
});
