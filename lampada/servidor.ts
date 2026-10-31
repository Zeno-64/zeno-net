import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { criarLampada } from './config.ts'
import type { Estado, Lampada } from './tipos.ts'

/** Servidor HTTP que a página /luz do site chama. Escuta só em
 *  127.0.0.1, então só quem está neste computador consegue falar com
 *  ele — e, pelo navegador, só as origens listadas abaixo. */

const PORTA = Number(process.env.LAMPADA_PORTA) || 3131
const ORIGENS_FIXAS = ['https://zeno.net.br', 'https://www.zeno.net.br']
const ORIGENS_EXTRAS = (process.env.LAMPADA_ORIGENS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function origemPermitida(origem: string) {
  if (ORIGENS_FIXAS.includes(origem) || ORIGENS_EXTRAS.includes(origem)) return true
  // o site rodando em dev/preview nesta mesma máquina
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem)
}

class ErroHttp extends Error {
  status: number
  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

let lampada: Lampada
try {
  lampada = criarLampada()
} catch (erro) {
  console.error('[lâmpada] erro:', erro instanceof Error ? erro.message : erro)
  process.exit(1)
}

async function rotear(metodo: string, caminho: string, corpo: Record<string, unknown>): Promise<Estado | object> {
  if (metodo === 'GET' && caminho === '/') {
    return { nome: 'zeno-net/lampada', rotas: ['GET /estado', 'POST /ligar', 'POST /desligar', 'POST /brilho', 'POST /temperatura', 'POST /cor'] }
  }
  if (metodo === 'GET' && caminho === '/estado') return lampada.estado()
  if (metodo !== 'POST') throw new ErroHttp(405, 'use GET /estado ou POST nas outras rotas')

  switch (caminho) {
    case '/ligar':
      return lampada.ligar(corpo.ligada === undefined ? true : Boolean(corpo.ligada))
    case '/desligar':
      return lampada.ligar(false)
    case '/brilho':
      return lampada.brilho(porcento(corpo.valor))
    case '/temperatura':
      return lampada.temperatura(porcento(corpo.valor))
    case '/cor': {
      const hex = typeof corpo.hex === 'string' ? corpo.hex : ''
      if (!/^#?[0-9a-f]{6}$/i.test(hex)) throw new ErroHttp(400, 'envie {"hex": "#rrggbb"}')
      return lampada.cor(hex)
    }
    default:
      throw new ErroHttp(404, `rota desconhecida: ${caminho}`)
  }
}

function porcento(valor: unknown) {
  const n = Number(valor)
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new ErroHttp(400, 'envie {"valor": 0–100}')
  return n
}

async function lerCorpo(req: IncomingMessage): Promise<Record<string, unknown>> {
  const partes: Buffer[] = []
  for await (const parte of req) partes.push(parte as Buffer)
  const texto = Buffer.concat(partes).toString('utf8').trim()
  if (!texto) return {}
  try {
    const json = JSON.parse(texto)
    return typeof json === 'object' && json !== null ? json : {}
  } catch {
    throw new ErroHttp(400, 'corpo não é JSON válido')
  }
}

function responder(res: ServerResponse, status: number, cabecalhos: Record<string, string>, corpo: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cabecalhos })
  res.end(JSON.stringify(corpo))
}

const servidor = createServer(async (req, res) => {
  const origem = req.headers.origin
  const cors: Record<string, string> = {}
  if (origem) {
    if (!origemPermitida(origem)) {
      responder(res, 403, {}, { erro: `origem não permitida: ${origem}` })
      return
    }
    cors['Access-Control-Allow-Origin'] = origem
    cors['Vary'] = 'Origin'
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...cors,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Max-Age': '600',
    })
    res.end()
    return
  }

  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const corpo = req.method === 'POST' ? await lerCorpo(req) : {}
    const resultado = await rotear(req.method ?? 'GET', url.pathname, corpo)
    responder(res, 200, cors, resultado)
  } catch (erro) {
    const status = erro instanceof ErroHttp ? erro.status : 502
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    if (status >= 500) console.error('[lâmpada]', mensagem)
    responder(res, status, cors, { erro: mensagem })
  }
})

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`[lâmpada] ouvindo em http://127.0.0.1:${PORTA} — abra o site em /luz`)
})

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, () => {
    lampada.fechar()
    servidor.close(() => process.exit(0))
  })
}
