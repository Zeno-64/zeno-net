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
src/
  data/site.ts        TODO o conteúdo editável (nick, frases, domínios, redes)
  components/
    Fundo.tsx         brilho azul + malha do fundo (decorativo)
    Janela.tsx        a janela em si
    Digitando.tsx     efeito de digitação em loop
    LinhaDominio.tsx  cada linha da lista de domínios
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

## Editar depois

- **Frases do terminal, papel, domínios:** `src/data/site.ts`.
- **Quando o `.dev` e o `.blog` subirem:** trocar `estado: 'em breve'` para
  `'no ar'` no mesmo arquivo.
- **Links de GitHub / LinkedIn / e-mail:** preencher a `url` em `redes` — item
  com url vazia não é renderizado. Hoje estão todos vazios, então o rodapé de
  redes nem aparece.
- **Cores:** o bloco `@theme` no topo de `src/index.css`.

## Os outros dois domínios

- `zeno.dev.br` — portfólio/projetos. Repositório separado, mesma stack.
- `zeno.blog.br` — blog de estudos. Repositório separado; conteúdo em Markdown.

O que os três compartilham hoje é a paleta e a tipografia (bloco `@theme`).
Se um dia virarem muitos, vale extrair esse bloco para um pacote comum — mas
com três sites, copiar o `@theme` é mais barato que manter um monorepo.
