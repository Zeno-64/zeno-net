/** Todo o conteúdo editável do site mora neste arquivo. */

export const site = {
  nick: 'zeno',
  titulo: 'Zeno',
  papel: 'Desenvolvedor',
  /** Linhas que o terminal digita, em loop. Mantenha curtas (~40 caracteres). */
  linhas: [
    'construindo coisas para a web',
    'aprendendo em público',
    'três domínios, um nick',
  ],
} as const

/** Foto de perfil: recorte quadrado de 1080x1080 de brand/kaneki.jpg,
 *  centrado na cabeça (x=966), usando a altura inteira do original. O
 *  vermelho do fundo aparece embaixo, dos dois lados do pescoço. */
export const perfil = {
  imagem: '/perfil.webp',
  alt: 'Kaneki, de Tokyo Ghoul, sobre fundo vermelho',
} as const

export type Trabalho = {
  nome: string
  host: string
  url: string
  descricao: string
}

export const tituloTrabalhos = 'My work'

export const trabalhos: Trabalho[] = [
  {
    nome: 'CleduArt',
    host: 'cleduart.com.br',
    url: 'https://www.cleduart.com.br/',
    descricao: 'Acervo de antiguidades e coleções',
  },
  {
    nome: 'Natalie Calegari',
    host: 'nataliecalegari.com.br',
    url: 'https://www.nataliecalegari.com.br/',
    descricao: 'Estética e injetáveis, em São Paulo',
  },
]

export type Dominio = {
  host: string
  url: string
  descricao: string
  /** true no domínio em que a página está sendo servida — não vira link. */
  atual?: boolean
  /** Texto do selo à direita. Trocar para 'no ar' quando o site subir. */
  estado: string
}

export const dominios: Dominio[] = [
  {
    host: 'zeno.net.br',
    url: 'https://zeno.net.br',
    descricao: 'aqui — a porta de entrada',
    atual: true,
    estado: 'no ar',
  },
  {
    host: 'zeno.dev.br',
    url: 'https://zeno.dev.br',
    descricao: 'projetos, código e experimentos',
    estado: 'em breve',
  },
  {
    host: 'zeno.blog.br',
    url: 'https://zeno.blog.br',
    descricao: 'estudos e anotações',
    estado: 'em breve',
  },
]

/** Preencher a `url` para o link aparecer; item com url vazia é ignorado. */
export const redes = [
  { nome: 'GitHub', url: '' },
  { nome: 'LinkedIn', url: '' },
  { nome: 'E-mail', url: '' },
].filter((rede) => rede.url !== '')
