document.addEventListener('DOMContentLoaded', function () {

    const URL_DO_SUPABASE = 'https://ibkfmvafllxdlimvdxkm.supabase.co';
    const CHAVE_ANONIMA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia2ZtdmFmbGx4ZGxpbXZkeGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMzA2OTMsImV4cCI6MjA2MTYwNjY5M30.t_kC0_bj7fhxrPJDns2BLMTRVQ1sdj-TPa-iPXgqbho';
    const supabase = window.supabase.createClient(URL_DO_SUPABASE, CHAVE_ANONIMA);

    function formatarData(textoData) {
        if (!textoData) return '-';
        const data = new Date(textoData);
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
    }

    function formatarPreco(preco) {
        return 'R$ ' + Number(preco).toFixed(2).replace('.', ',');
    }

    async function buscarEMostrarProdutos() {
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('id');

            if (error) throw new Error('Erro ao buscar produtos: ' + error.message);

            document.getElementById('mensagemCarregando').style.display = 'none';

            if (!data || data.length === 0) {
                document.getElementById('mensagemErro').style.display = 'block';
                document.getElementById('mensagemErro').textContent = 'Nenhum produto encontrado na tabela.';
                return;
            }

            const corpoTabela = document.getElementById('corpoDaTabela');
            corpoTabela.innerHTML = '';

            data.forEach(produto => {
                const linha = document.createElement('tr');

                linha.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome || '-'}</td>
            <td>${produto.descricao || '-'}</td>
            <td>${formatarPreco(produto.preco)}</td>
            <td>
              <input type="number" 
                     value="${produto.estoque}" 
                     min="0"
                     class="estoque-input"
                     data-original="${produto.estoque}"
                     style="width: 60px; border: none;" />
            </td>
            <td>${formatarData(produto.created_at)}</td>
          `;

                corpoTabela.appendChild(linha);
            });

            document.querySelectorAll('.estoque-input').forEach(input => {
                input.addEventListener('input', function () {
                    const container = document.querySelector('.container');
                    const original = parseInt(this.dataset.original);
                    const atual = parseInt(this.value);
                    const botao = document.getElementById('button');

                    if (original !== atual) {
                        botao.style.display = 'inline-block';
                        container.style.paddingBottom = '80px';
                    } else {
                        const algumAlterado = Array.from(document.querySelectorAll('.estoque-input')).some(inp => {
                            return parseInt(inp.dataset.original) !== parseInt(inp.value);
                        });

                        if (!algumAlterado) {
                            botao.style.display = 'none';
                            container.style.paddingBottom = '20px';
                        }
                    }
                });

                input.addEventListener('keydown', function (e) {
                    const permitido = ['ArrowUp', 'ArrowDown', 'Tab'];
                    if (!permitido.includes(e.key)) e.preventDefault();
                });

                input.addEventListener('paste', e => e.preventDefault());
            });

            document.getElementById('tabelaProdutos').style.display = 'table';

        } catch (erro) {
            document.getElementById('mensagemCarregando').style.display = 'none';
            document.getElementById('mensagemErro').style.display = 'block';
            document.getElementById('mensagemErro').textContent = erro.message;
            console.error('Erro: ', erro);
        }
    }

    document.getElementById('button').addEventListener('click', async function () {
        const linhas = document.querySelectorAll('#corpoDaTabela tr');
        const produtosAlterados = [];

        linhas.forEach(linha => {
            const id = linha.children[0].textContent.trim();
            const input = linha.querySelector('.estoque-input');
            const estoqueOriginal = parseInt(input.dataset.original);
            const estoqueAtual = parseInt(input.value);

            if (estoqueOriginal !== estoqueAtual) {
                produtosAlterados.push({ id, estoque: estoqueAtual });
            }
        });

        if (produtosAlterados.length === 0) {
            alert('Nenhuma alteração detectada.');
            return;
        }

        try {
            for (const produto of produtosAlterados) {
                const { error } = await supabase
                    .from('produtos')
                    .update({ estoque: produto.estoque })
                    .eq('id', produto.id);

                if (error) {
                    throw new Error(`Erro ao atualizar produto ${produto.id}: ${error.message}`);
                }
            }

            alert('Estoque atualizado com sucesso!');

            const botao = document.getElementById('button');
            const container = document.querySelector('.container');
            botao.style.display = 'none';
            container.style.paddingBottom = '20px';

            buscarEMostrarProdutos();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar alterações: ' + err.message);
        }
    });

    buscarEMostrarProdutos();
});
