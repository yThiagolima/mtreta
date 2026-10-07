# Estoque do Thiago

Sistema web estático para gerenciamento de estoque, compras, vendas, entregas, custos e lucros.

## Tecnologia

- HTML5
- CSS3
- JavaScript moderno
- `localStorage` para persistência
- Sem backend obrigatório
- Sem dependências externas obrigatórias
- Preparado para GitHub Pages

## Como executar

1. Extraia o projeto.
2. Abra `index.html` no navegador para uso local.
3. Para publicar, envie todos os arquivos para um repositório GitHub.
4. No GitHub, abra **Settings → Pages**.
5. Escolha **Deploy from a branch**, selecione a branch principal e a pasta `/root`.
6. Salve e aguarde a publicação.

## Backup

Em **Configurações**, use **Exportar backup** para baixar um JSON com todos os dados. Para restaurar, selecione o JSON em **Importar backup**.

O backup inclui:
- Produtos
- Vendas
- Entregas
- Custos vinculados
- Configurações
- Histórico

## Dados

Os dados ficam salvos no `localStorage` do navegador. Limpar os dados do site/navegador pode remover os registros locais. Por isso, mantenha backups JSON.

## Estrutura

```text
/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── products.js
│   ├── sales.js
│   ├── deliveries.js
│   ├── dashboard.js
│   ├── finance.js
│   ├── reports.js
│   └── settings.js
└── assets/
    └── images/
```

## Arquitetura

`storage.js` concentra a persistência. As demais telas utilizam `Store` em vez de acessar diretamente o `localStorage`. Isso facilita substituir a implementação por uma API/Supabase futuramente.

## Observação

A primeira versão começa vazia para uso real. Todos os cálculos são feitos no navegador.
