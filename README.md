# NightShade's Music Player

Um aplicativo moderno de reprodução de música construído com Angular e Electron, com interface responsiva otimizada para desktops e para operação em modo kiosk.

## Sumário

- [Visão geral](#visão-geral)
- [Stack tecnológica](#stack-tecnológica)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Executar em desenvolvimento](#executar-em-desenvolvimento)
- [Build para produção](#build-para-produção)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Scripts disponíveis](#scripts-disponíveis)
- [Características](#características)
- [Configurações Electron](#configurações-electron)
- [Desenvolvimento](#desenvolvimento)
- [Troubleshooting](#troubleshooting)
- [Implantação em Linux (Kiosk)](#implantação-em-linux-kiosk)
- [Próximos passos](#próximos-passos)

## Visão geral

O projeto é um player de música elegante, organizado pela hierarquia **Artista → Álbum → Músicas**, com:

- **Frontend** em Angular com componentes standalone
- **Design responsivo** otimizado para resolução 1024x768
- **Angular Material** para componentes de UI de alta qualidade
- **Electron** para execução como aplicativo desktop nativo
- **TypeScript** e **SCSS** para tipagem segura e estilos escaláveis
- **Material Icons** para controles intuitivos do player

## Stack tecnológica

| Camada                      | Tecnologia                          |
| --------------------------- | ----------------------------------- |
| Framework                   | Angular (componentes standalone)    |
| UI                          | Angular Material (tema Indigo/Pink) |
| Desktop runtime             | Electron                            |
| Linguagem                   | TypeScript                          |
| Estilos                     | SCSS                                |
| Servidor de desenvolvimento | Express                             |

## Requisitos

- **Node.js 22.13.1+**
- **npm 12.0.2+**

## Instalação

```bash
npm install
```

## Executar em desenvolvimento

**Web (navegador):**

```bash
npm start
```

A aplicação fica disponível em `http://localhost:4200/`.

**Desktop (Electron):**

```bash
npm run electron:dev
```

Sobe o Angular em modo dev e abre a janela do Electron carregando o mesmo servidor, com a resolução padrão de 1024x768.

## Build para produção

**Web:**

```bash
npm run build
```

Os artefatos gerados ficam na pasta `dist/kiosk-music-player`.

**Desktop:**

```bash
npm run electron:build
```

Gera o executável do aplicativo desktop via `electron-builder`.

## Estrutura do projeto

```
.
├── src/
│   ├── app/
│   │   ├── music-player/
│   │   │   ├── music-player.component.ts
│   │   │   ├── music-player.component.html
│   │   │   └── music-player.component.scss
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── electron/
│   ├── main.ts        # configuração de janela 1024x768
│   └── preload.ts
├── public/
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts disponíveis

| Script                        | Descrição                                              |
| ----------------------------- | ------------------------------------------------------ |
| `npm start`                   | Inicia o dev server Angular na porta 4200              |
| `npm run build`               | Gera build de produção                                 |
| `npm run watch`               | Build em modo watch                                    |
| `npm test`                    | Executa testes com Karma/Jasmine                       |
| `npm run electron:dev`        | Inicia Angular + Electron simultaneamente              |
| `npm run electron:build`      | Cria o executável do app desktop                       |
| `npm run electron:build-main` | Compila o TypeScript do processo principal do Electron |

## Características

- ✨ **Design responsivo** — interface fluida com percentuais de dimensão para adaptar-se a diferentes resoluções
- 🎵 **Navegação por biblioteca** — hierarquia Artista → Álbum → Músicas, sem necessidade de gerenciar playlists
- 🎨 **Tema personalizado** — paleta purple/pink com gradientes modernos
- 📱 **Resolução otimizada** — dimensão mínima de 800x600, padrão 1024x768
- 🚀 **Desktop nativo** — empacotável como aplicativo Electron para macOS, Windows e Linux

## Configurações Electron

A janela do Electron é configurada com:

- **Resolução padrão**: 1024x768
- **Resolução mínima**: 800x600
- **Título dinâmico**: `NightShade's Music Player - {versão}`
- **Context isolation** e demais práticas de segurança habilitadas

## Desenvolvimento

### Adicionar novos componentes

```bash
ng generate component components/novo-componente
```

### Estilos

Os estilos usam SCSS com um design system baseado em percentuais para responsividade:

- Cores neutras e gradientes modernos
- Tipografia com Inter e Segoe UI
- Grid layout com media queries para telas menores

### Ícones

Os ícones do Material são importados automaticamente. Uso:

```html
<mat-icon>icone_name</mat-icon>
```

Lista completa em [Material Symbols & Icons](https://fonts.google.com/icons).

## Troubleshooting

**Ícones não aparecem?**

- Verifique se a importação de Material Icons está presente em `src/index.html`
- Limpe o cache do navegador

**Erro de versão do Node?**

```bash
nvm install 22.13.1
nvm use 22.13.1
```

**`npm install` falha?**

```bash
rm -rf node_modules package-lock.json
npm install
```

## Implantação em Linux (Kiosk)

O projeto é otimizado para ser executado como um **kiosk de música** em uma imagem Linux dedicada, iniciando diretamente na interface da aplicação em vez do desktop do sistema.

### Configuração de Kiosk

1. **Instalação na máquina Linux**

   ```bash
   git clone <repositorio> kiosk-music-player
   cd kiosk-music-player

   npm install
   npm run electron:build
   ```

2. **Autostart em modo kiosk**
   - Configurar login automático e inicialização do Electron junto com a sessão gráfica (via `.desktop` autostart ou serviço `systemd`)
   - Aplicativo executa na resolução configurada (ajustável)
   - Interface otimizada para leitura à distância

3. **Modo tela cheia**
   - O Electron pode ser configurado com `fullscreen: true` e `kiosk: true`
   - Oculta a barra de tarefas e os controles do sistema

4. **Gerenciamento remoto** (roadmap)
   - Atualizar a biblioteca musical via endpoint HTTP
   - Sincronizar conteúdo entre instâncias
   - Monitorar a saúde do aplicativo

### Requisitos para Kiosk Linux

- Linux com Xorg ou Wayland
- Node.js 22.13.1+
- ~500MB de espaço em disco
- GPU com suporte a aceleração 2D/3D (recomendado)

## Próximos passos

- Implementar reprodução real de áudio (Web Audio API / módulo nativo)
- Varredura automática de diretório para popular a biblioteca (ex.: `D:/musicas`)
- Histórico de reprodução e favoritos
- Sincronização entre web e desktop
- API REST para gerenciamento remoto de kiosk
- Dashboard de monitoramento de instâncias
