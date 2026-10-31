# zeno.net.br — porta de entrada

Página única e estática: uma janelinha central, estilo terminal, com um facho
de **luz azul correndo na borda**, e a lista dos três domínios do nick `zeno`.

Este repositório é só o `.net`. Os outros dois (`zeno.dev.br` e `zeno.blog.br`)
são projetos separados — ver "Os outros dois domínios" no fim.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (config no CSS, via `@theme` em `src/index.css`)
- Sem backend, sem imagens: a página inteira é CSS + texto (~62 kB gzip)
- À parte, um script Node em `lampada/` controla a lâmpada inteligente da
  casa; a página `/luz` do site é só o painel dele (ver "A lâmpada")

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # gera /dist
npm run preview  # serve o /dist
npm test         # testes das conversões de cor da lâmpada
```

Requer Node 22 (ver `.nvmrc`).

## Deploy — Cloudflare Workers (assets estáticos, plano grátis)

`wrangler.jsonc` e `.nvmrc` já estão prontos. No painel do Cloudflare:

- Workers & Pages → Create application → importar do Git
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- **"Protect with Cloudflare Access" desligado** (senão o site público pede login)

Validar antes de subir: `npx wrangler deploy --dry-run`.

Domínio provisório: `zeno-net.<conta>.workers.dev`. Para apontar `zeno.net.br`,
seguir o passo a passo em `conhecimento-natalie-stesunshine.md`, seção 3, na
pasta acima.

## Estrutura

```
public/       favicon.svg · robots.txt · sitemap.xml
              perfil.webp  recorte quadrado do rosto (o que vai pro ar)
brand/        kaneki.jpg — original enviado. Fica FORA de public/ pra não
              ser publicado junto: só serve de fonte do recorte
index.html    a porta de entrada (/)
luz.html      o painel da lâmpada (/luz) — ver "A lâmpada"
src/
  data/site.ts        TODO o conteúdo editável (nick, frases, domínios,
                      redes, perfil, trabalhos)
  data/luz.ts         porta do script da lâmpada, cores rápidas, intervalo
  components/
    Fundo.tsx         brilho azul + malha do fundo (decorativo)
    Janela.tsx        a janela em si
    Avatar.tsx        foto de perfil com o facho vermelho
    Digitando.tsx     efeito de digitação em loop
    LinhaDominio.tsx  cada linha da lista de domínios
    Trabalhos.tsx     as duas telinhas com o facho branco
    PainelLuz.tsx     o painel da lâmpada
  index.css           tema (@theme) + a animação da borda (.moldura-luz)
  App.tsx · main.tsx  a página inicial
  luz.tsx             a página /luz
lampada/      o script que fala com a lâmpada (Node, roda no seu computador)
```

## Como a luz da borda funciona

`.moldura-luz` (em `src/index.css`) é uma caixa com `padding: 1px` cujo fundo é
um `conic-gradient` girando; o miolo opaco tampa o centro e sobra só 1px de luz
na borda. Um `::before` com o mesmo fundo e `blur(16px)` faz o brilho vazar.

O giro depende de `@property --angulo` — sem ele o navegador não interpola um
ângulo dentro de `conic-gradient`. Em navegador antigo a borda fica azul e
parada, o que é um fallback aceitável. Com `prefers-reduced-motion: reduce`,
a borda e o cursor param de animar de propósito.

A cor e a velocidade são variáveis, então a mesma animação serve os três usos:

| Classe | Onde | Luz |
| --- | --- | --- |
| `.moldura-luz` | a janela principal | azul (padrão) |
| `+ .luz-vermelha` | a foto de perfil | vermelha |
| `+ .luz-branca` | as duas telinhas | branca |

`.giro-rapido` (4s) e `.giro-lento` (9s) mudam só a velocidade. Como o avatar
é uma foto inteiramente vermelha, ele leva um anel escuro entre a foto e a
moldura — sem esse respiro a luz se dissolve dentro da imagem.

## A foto de perfil

`public/perfil.webp` é gerado de `brand/kaneki.jpg`: recorte quadrado de
1080×1080 centrado na cabeça (x=966), usando a altura inteira do original.

Vale saber por que não dá pra enquadrar de outro jeito: a cabeça tem 1444px de
largura e a foto só 1080px de altura. Um quadrado que mostre o fundo vermelho
dos dois lados teria que ser mais largo que 1444px, logo mais alto que a foto —
sobraria faixa vazia. Com o recorte de 1080 o cabelo sangra pelas laterais no
alto e o vermelho real aparece embaixo, ao lado do pescoço, sem inventar fundo.

Para trocar a foto: substituir `brand/kaneki.jpg`, achar o centro da cabeça e rodar
de novo o recorte com Pillow, mantendo o nome `perfil.webp`.

## Editar depois

- **Frases do terminal, papel, domínios:** `src/data/site.ts`.
- **Quando o `.dev` e o `.blog` subirem:** trocar `estado: 'em breve'` para
  `'no ar'` no mesmo arquivo.
- **Links de GitHub / LinkedIn / e-mail:** preencher a `url` em `redes` — item
  com url vazia não é renderizado. Hoje estão todos vazios, então o rodapé de
  redes nem aparece.
- **Cores e fontes:** o bloco `@theme` no topo de `src/index.css`. A fonte do
  logotipo é a `--font-marca` (Chakra Petch itálico); trocar exige mexer
  também no `<link>` do Google Fonts em `index.html`.

## A lâmpada (`/luz`)

Além da porta de entrada, o site tem uma página escondida, `/luz`, que
controla a lâmpada inteligente da Positivo: liga e desliga, brilho, branco
quente ou frio e cor. Ela não é linkada de lugar nenhum e tem `noindex`.

O site é estático e público, então quem fala com a lâmpada não é ele — é um
script Node rodando **no seu computador**, em `127.0.0.1:3131`. A página
`/luz` só chama esse script. Consequências:

- só funciona no navegador do computador em que o script está rodando (no
  celular, continua sendo o app da Positivo);
- nenhuma chave vai pro site nem pro git: tudo fica no `.env`, que é
  ignorado pelo git;
- o script escuta só na interface local e só aceita chamadas vindas de
  `zeno.net.br` e de `localhost` (CORS). Outras origens, como o domínio
  provisório `*.workers.dev`, entram em `LAMPADA_ORIGENS` no `.env`.

Na primeira vez, o Chrome (142+) pergunta se o site pode acessar a rede
local — permita. O Firefox também funciona; o Safari costuma bloquear.

### 1. Pegar o id e a chave da lâmpada

As lâmpadas da Positivo rodam na plataforma Tuya (o app "Positivo Casa
Inteligente" é um app Tuya de marca própria). Pra falar com ela por fora do
app é preciso uma conta de desenvolvedor Tuya, grátis:

1. Crie uma conta em <https://iot.tuya.com> e, em **Cloud → Development**,
   um projeto *Smart Home* no plano *Trial* (não cobra). Em *Service API*,
   assine **IoT Core** e **Authorization**.
2. Na aba **Devices → Link Tuya App Account**, escolha o data center
   **Western America** (é o que atende o Brasil) e clique em *Add App
   Account*. No app, vá em *Eu → ícone de scan* (canto superior direito) e
   leia o QR code. Se o app da Positivo não aceitar, instale o **Smart
   Life** (mesma plataforma), pareie a lâmpada nele e leia o código por ele.
3. Anote o **Access ID** e o **Access Secret** do projeto (aba *Overview*).
4. No computador, rode `npx @tuyapi/cli wizard` e responda com o Access ID,
   o Access Secret e o *Virtual ID* de qualquer aparelho (está em
   *Devices*). Ele imprime o `id` e a `key` de cada aparelho.

A `key` muda sempre que a lâmpada é removida e pareada de novo no app;
quando isso acontecer, rode o wizard outra vez. O plano Trial da Tuya
expira depois de um tempo e precisa ser renovado no painel (de graça).

### 2. Configurar e rodar

```bash
cp .env.exemplo .env     # preencha TUYA_ID e TUYA_KEY
npm run luz -- estado    # testa pela linha de comando
npm run luz:servidor     # deixa rodando e abra https://zeno.net.br/luz
```

Outros comandos da linha de comando: `ligar`, `desligar`, `brilho 60`,
`temperatura 20` (0 = quente, 100 = frio) e `cor ff8800`.

Se o script não achar a lâmpada na rede, preencha `TUYA_IP` (o app mostra o
IP em *Informações do dispositivo*) e, se precisar, `TUYA_VERSAO` (3.3, 3.4
ou 3.5). Muitas Tuya só aceitam um cliente local por vez: se outro programa
(Home Assistant, por exemplo) estiver conectado nela, a conexão é recusada.
Por isso o script solta a conexão depois de 1 minuto sem uso.

### Se a chave local não sair: modo nuvem

Há relatos de a Tuya deixar de mostrar a chave local de alguns aparelhos.
Nesse caso, preencha `TUYA_ACCESS_ID`, `TUYA_ACCESS_SECRET` e `TUYA_ID` no
`.env` e deixe `TUYA_KEY` vazio: o script passa a mandar os comandos pela
nuvem da Tuya — mais lento e dependente de internet, mas a página não muda.

### Sem lâmpada: modo simulado

Com o `.env` vazio (ou `LAMPADA_MODO=simulada`), o servidor sobe com uma
lâmpada de mentira em memória. Serve pra mexer na página sem a lâmpada por
perto.

### Como está montado

```
lampada/
  tipos.ts      o contrato entre site e script (Estado, Lampada)
  cor.ts        hex ↔ HSV e as duas codificações de cor da Tuya (+ cor.test.ts)
  local.ts      fala com a lâmpada pela rede local (tuyapi)
  nuvem.ts      fala pela OpenAPI da Tuya (assinatura HMAC-SHA256)
  simulada.ts   lâmpada em memória
  config.ts     lê o .env e escolhe entre as três
  servidor.ts   o HTTP em 127.0.0.1:3131 que a página chama
  cli.ts        npm run luz -- <comando>
```

O script roda os `.ts` direto no Node 22 (sem passo de build), por isso os
imports levam a extensão `.ts`. As faixas de brilho e cor variam entre
lâmpadas Tuya antigas (dps 1–5) e atuais (dps 20–24); o script descobre
qual é ao ler o estado pela primeira vez. Em dev, a página fica em
`http://localhost:5180/luz.html`; no Cloudflare, `/luz` já serve `luz.html`.

## Os outros dois domínios

- `zeno.dev.br` — portfólio/projetos. Repositório separado, mesma stack.
- `zeno.blog.br` — blog de estudos. Repositório separado; conteúdo em Markdown.

O que os três compartilham hoje é a paleta e a tipografia (bloco `@theme`).
Se um dia virarem muitos, vale extrair esse bloco para um pacote comum — mas
com três sites, copiar o `@theme` é mais barato que manter um monorepo.
