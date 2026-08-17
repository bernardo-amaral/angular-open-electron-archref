# OpenPDV

Aplicação web e desktop para gestão de ponto de venda (PDV), construída com Angular 22 e preparada para execução local em navegador e em Electron.

## Visão geral

O projeto foi estruturado para funcionar como uma solução moderna de caixa, com:

- frontend em Angular 22
- roteamento e componentes standalone
- renderização SSR com Express para compatibilidade com a base do Angular 22
- empacotamento desktop com Electron
- build otimizada para produção com Angular CLI

## Stack tecnológica

- Angular 22
- Angular SSR
- Express
- Electron
- TypeScript
- SCSS

## Requisitos

- Node.js 22.22.3+ (ou versão compatível recomendada pelo Angular 22)
- npm 10+

## Instalação

```bash
npm install
```

## Executar em desenvolvimento

```bash
npm start
```

A aplicação fica disponível em:

```text
http://localhost:4200/
```

## Build para produção

```bash
npm run build
```

Os artefatos gerados ficam na pasta `dist/open-pdv`.

## Executar com Electron

Em desenvolvimento:

```bash
npm run electron:dev
```

Build do aplicativo desktop:

```bash
npm run electron:build
```

## Estrutura principal

```text
.
├── src/
│   ├── app/
│   ├── index.html
│   ├── main.ts
│   └── main.server.ts
├── electron/
│   ├── main.ts
│   └── preload.ts
├── server.ts
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts disponíveis

- `npm start` — inicia o ambiente de desenvolvimento do Angular
- `npm run build` — gera o build de produção
- `npm run watch` — build em watch para desenvolvimento
- `npm test` — executa os testes unitários com Karma
- `npm run electron:dev` — inicia Angular + Electron em ambiente de desenvolvimento
- `npm run electron:build` — gera a build do app desktop

## Observações importantes

- O projeto usa a estrutura atual do Angular 22, incluindo SSR em `server.ts`.
- A compatibilidade com a versão do Node é importante: se o CLI indicar erro de versão, atualize o Node antes de rodar o projeto.
- Para ajustes de infraestrutura, módulos e componentes, os arquivos principais ficam em `src/app` e `server.ts`.

## Próximos passos

A aplicação está pronta para evoluir com:

- cadastro de produtos
- controle de estoque
- abertura e fechamento de caixa
- vendas por itens
- relatórios e faturamento
- autenticação e permissões

## Licença

Este projeto foi configurado para uso interno e desenvolvimento local. Ajustes de licença podem ser definidos conforme a necessidade do projeto.
