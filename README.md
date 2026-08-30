# zeno.net.br — porta de entrada

Página única e estática: uma janelinha central, estilo terminal, com um facho
de **luz azul correndo na borda**, e a lista dos três domínios do nick `zeno`.

Este repositório é só o `.net`. Os outros dois (`zeno.dev.br` e `zeno.blog.br`)
são projetos separados — ver "Os outros dois domínios" no fim.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (config no CSS, via `@theme` em `src/index.css`)
- Sem backend, sem imagens: a página inteira é CSS + texto (~62 kB gzip)

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # gera /dist
npm run preview  # serve o /dist
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
src/
  data/site.ts        TODO o conteúdo editável (nick, frases, domínios,
                      redes, perfil, trabalhos)
  components/
    Fundo.tsx         brilho azul + malha do fundo (decorativo)
    Janela.tsx        a janela em si
    Avatar.tsx        foto de perfil com o facho vermelho
    Digitando.tsx     efeito de digitação em loop
    LinhaDominio.tsx  cada linha da lista de domínios
    Trabalhos.tsx     as duas telinhas com o facho branco
  index.css           tema (@theme) + a animação da borda (.moldura-luz)
  App.tsx
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

## Os outros dois domínios

- `zeno.dev.br` — portfólio/projetos. Repositório separado, mesma stack.
- `zeno.blog.br` — blog de estudos. Repositório separado; conteúdo em Markdown.

O que os três compartilham hoje é a paleta e a tipografia (bloco `@theme`).
Se um dia virarem muitos, vale extrair esse bloco para um pacote comum — mas
com três sites, copiar o `@theme` é mais barato que manter um monorepo.
