# Sistema de Estoque Tributável — Front-end UX

Protótipo de interface web para apresentar a experiência de uso do Sistema de Estoque Tributável. Esta versão complementa o projeto original em Java de terminal e não substitui suas regras de negócio.

## Funcionalidades demonstradas

- Painel com produtos, estoque mínimo, valor armazenado e movimentações recentes.
- Cadastro e listagem de produtos com categoria, origem (nacional/importado), NCM e alíquota individual.
- Cadastro e listagem de clientes com validação dos dígitos verificadores do CPF.
- Cadastro e listagem de funcionários.
- Registro de entrada e saída, com bloqueio de saída maior que o estoque disponível.
- Filtro de produtos e buscas por produto/cliente.
- Resumo de regime tributário e simulação didática de impostos.

## Como executar

Não há dependências para instalar. Abra `index.html` em um navegador ou use uma extensão de servidor local, como **Live Server** no VS Code.

Os dados são de demonstração e ficam somente no `localStorage` do navegador. O botão **Restaurar dados de exemplo** volta ao estado inicial.

## Observação fiscal

As alíquotas e estimativas exibidas são didáticas para a atividade de UX. A tributação real depende de NCM, origem, regime, estado e demais regras fiscais; a aplicação definitiva deve ser validada por um profissional da área.

## Projeto relacionado

Versão de terminal em Java: [sistema-estoque-tributavel](https://github.com/xfcvw/sistema-estoque-tributavel)
