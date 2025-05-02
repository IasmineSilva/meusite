document.addEventListener('DOMContentLoaded', () => {
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const resultAmount = document.querySelector('.amount');
    const resultDetails = document.querySelectorAll('.detail-item .value');
    const forms = {
        juros: document.getElementById('jurosForm'),
        investimento: document.getElementById('investimentoForm'),
        emprestimo: document.getElementById('emprestimoForm'),
        cdb: document.getElementById('cdbForm'),
        comparacao: document.getElementById('comparacaoForm')
    };

    
    const tabelaIR = {
        180: 22.5,  
        360: 20,    
        720: 17.5,  
        9999: 15    
    };

    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    
    const formatPercent = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    };

    
    const animateValue = (element, start, end, duration, isPercent = false) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentValue = start + (end - start) * progress;
            element.textContent = isPercent ? formatPercent(currentValue) : formatCurrency(currentValue);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    
    const calcularJurosCompostos = (capital, taxa, tempo) => {
        const taxaDecimal = taxa / 100;
        const montante = capital * Math.pow(1 + taxaDecimal, tempo);
        const juros = montante - capital;
        return { montante, juros };
    };

    
    const calcularInvestimento = (valor, taxa, tempo) => {
        const taxaDecimal = taxa / 100;
        const montante = valor * Math.pow(1 + taxaDecimal, tempo);
        const juros = montante - valor;
        return { montante, juros };
    };

    
    const calcularEmprestimo = (valor, taxa, parcelas) => {
        const taxaDecimal = taxa / 100;
        const pmt = valor * (taxaDecimal * Math.pow(1 + taxaDecimal, parcelas)) / (Math.pow(1 + taxaDecimal, parcelas) - 1);
        const total = pmt * parcelas;
        const juros = total - valor;
        return { total, juros, pmt };
    };

    
    const calcularCDB = (valor, prazo, taxaCDI, percentualCDI) => {
        const taxaEfetiva = (taxaCDI * percentualCDI) / 100;
        const taxaDiaria = Math.pow(1 + taxaEfetiva / 100, 1 / 252) - 1;
        const dias = prazo;
        const montante = valor * Math.pow(1 + taxaDiaria, dias);
        const rendimentoBruto = montante - valor;

        
        let aliquotaIR = 0;
        for (const [diasLimite, aliquota] of Object.entries(tabelaIR)) {
            if (prazo <= parseInt(diasLimite)) {
                aliquotaIR = aliquota;
                break;
            }
        }

        const ir = rendimentoBruto * (aliquotaIR / 100);
        const rendimentoLiquido = rendimentoBruto - ir;
        const taxaEfetivaLiquida = (Math.pow(1 + rendimentoLiquido / valor, 252 / dias) - 1) * 100;

        return {
            montante,
            rendimentoBruto,
            ir,
            rendimentoLiquido,
            taxaEfetivaLiquida
        };
    };

    
    const calcularOutroInvestimento = (valor, prazo, taxa) => {
        const taxaDiaria = Math.pow(1 + taxa / 100, 1 / 252) - 1;
        const dias = prazo;
        const montante = valor * Math.pow(1 + taxaDiaria, dias);
        const rendimento = montante - valor;
        const taxaEfetiva = (Math.pow(1 + rendimento / valor, 252 / dias) - 1) * 100;

        return {
            montante,
            rendimento,
            taxaEfetiva
        };
    };

    
    const updateResults = (resultado) => {
        const startValue = parseFloat(resultAmount.textContent.replace(/[^\d,-]/g, '').replace(',', '.'));
        animateValue(resultAmount, startValue, resultado.montante, 1000);

        resultDetails.forEach((detail, index) => {
            let value;
            switch (index) {
                case 0: value = resultado.rendimentoBruto; break;
                case 1: value = resultado.ir; break;
                case 2: value = resultado.rendimentoLiquido; break;
                case 3: value = resultado.taxaEfetivaLiquida; break;
            }
            const startValue = parseFloat(detail.textContent.replace(/[^\d,-]/g, '').replace(',', '.'));
            animateValue(detail, startValue, value, 1000, index === 3);
        });
    };

    
    forms.juros.addEventListener('submit', (e) => {
        e.preventDefault();
        const capital = parseFloat(document.getElementById('capital').value);
        const taxa = parseFloat(document.getElementById('taxa').value);
        const tempo = parseFloat(document.getElementById('tempo').value);

        const { montante, juros } = calcularJurosCompostos(capital, taxa, tempo);
        updateResults({ montante, rendimentoBruto: juros });
    });

    forms.investimento.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = parseFloat(document.getElementById('valorInvestimento').value);
        const taxa = parseFloat(document.getElementById('taxaInvestimento').value);
        const tempo = parseFloat(document.getElementById('tempoInvestimento').value);

        const { montante, juros } = calcularInvestimento(valor, taxa, tempo);
        updateResults({ montante, rendimentoBruto: juros });
    });

    forms.emprestimo.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = parseFloat(document.getElementById('valorEmprestimo').value);
        const taxa = parseFloat(document.getElementById('taxaEmprestimo').value);
        const parcelas = parseFloat(document.getElementById('parcelas').value);

        const { total, juros, pmt } = calcularEmprestimo(valor, taxa, parcelas);
        updateResults({ montante: total, rendimentoBruto: juros });
    });

    forms.cdb.addEventListener('submit', (e) => {
        e.preventDefault();

        const valorInput = document.getElementById('valorInvestimento');
        const prazoInput = document.getElementById('prazo');
        const taxaInput = document.getElementById('taxa');
        const percentualInput = document.getElementById('percentualCDI');

        const valor = parseFloat(valorInput.value);
        const prazo = parseInt(prazoInput.value);
        const taxaCDI = parseFloat(taxaInput.value);
        const percentualCDI = parseFloat(percentualInput.value);

        if (isNaN(valor) || isNaN(prazo) || isNaN(taxaCDI) || isNaN(percentualCDI)) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        const resultado = calcularCDB(valor, prazo, taxaCDI, percentualCDI);
        updateResults(resultado);
    });

    forms.comparacao.addEventListener('submit', (e) => {
        e.preventDefault();

        const valorInput = document.getElementById('valorComparacao');
        const prazoInput = document.getElementById('prazoComparacao');
        const taxaInput = document.getElementById('taxaComparacao');

        const valor = parseFloat(valorInput.value);
        const prazo = parseInt(prazoInput.value);
        const taxa = parseFloat(taxaInput.value);

        if (isNaN(valor) || isNaN(prazo) || isNaN(taxa)) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        const resultadoCDB = calcularCDB(valor, prazo, 13.65, 100);
        const resultadoOutro = calcularOutroInvestimento(valor, prazo, taxa);

        updateComparisonChart(resultadoCDB, resultadoOutro);
    });

    
    let comparisonChart = null;
    const updateComparisonChart = (cdb, outro) => {
        const ctx = document.getElementById('comparisonChart').getContext('2d');

        if (comparisonChart) {
            comparisonChart.destroy();
        }

        comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['CDB Inter', 'Outro Investimento'],
                datasets: [{
                    label: 'Rendimento Líquido',
                    data: [cdb.rendimentoLiquido, outro.rendimento],
                    backgroundColor: [
                        'rgba(255, 107, 0, 0.8)',
                        'rgba(33, 150, 243, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 107, 0, 1)',
                        'rgba(33, 150, 243, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    };

    
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            if (e.target.value < 0) {
                e.target.value = 0;
            }
        });
    });
}); 
