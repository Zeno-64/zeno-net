import TuyaDevice from 'tuyapi'
import type { Estado, Lampada, Modo } from './tipos.ts'
import {
  type HSV,
  hexParaHsv,
  hsvParaHex,
  hsvParaTuyaA,
  hsvParaTuyaB,
  paraAparelho,
  paraPorcento,
  tuyaAParaHsv,
  tuyaBParaHsv,
} from './cor.ts'

/** Mapa dos "data points" (dps) da lâmpada. As Tuya têm dois esquemas:
 *  o antigo (1–5) e o atual (20–24). Descobrimos qual é ao ler o estado. */
type Esquema = {
  ligada: string
  modo: string
  brilho: string
  temperatura: string
  cor: string
  brilhoMin: number
  brilhoMax: number
  temperaturaMax: number
  codificar: (cor: HSV) => string
  decodificar: (texto: string) => HSV
}

const ESQUEMA_B: Esquema = {
  ligada: '20',
  modo: '21',
  brilho: '22',
  temperatura: '23',
  cor: '24',
  brilhoMin: 10,
  brilhoMax: 1000,
  temperaturaMax: 1000,
  codificar: hsvParaTuyaB,
  decodificar: tuyaBParaHsv,
}

const ESQUEMA_A: Esquema = {
  ligada: '1',
  modo: '2',
  brilho: '3',
  temperatura: '4',
  cor: '5',
  brilhoMin: 25,
  brilhoMax: 255,
  temperaturaMax: 255,
  codificar: hsvParaTuyaA,
  decodificar: tuyaAParaHsv,
}

type Dps = Record<string, unknown>

/** Depois de quanto tempo sem uso soltamos a conexão. Muitas Tuya só
 *  aceitam um cliente local por vez; segurar a conexão pra sempre
 *  trava outros apps (Home Assistant, por exemplo). */
const OCIOSIDADE_MS = 60_000

export type OpcoesLocal = {
  id: string
  key: string
  ip?: string
  /** Protocolo: 3.1, 3.3, 3.4 ou 3.5. Ignorado quando `ip` está vazio
   *  (o `find()` descobre sozinho). */
  versao?: string
}

/** Fala direto com a lâmpada pela rede local, sem passar pela nuvem. */
export class LampadaLocal implements Lampada {
  #aparelho: TuyaDevice
  #precisaAchar: boolean
  #conectando: Promise<void> | null = null
  #dps: Dps = {}
  #esquema: Esquema | null = null
  #temporizador: NodeJS.Timeout | undefined

  constructor(opcoes: OpcoesLocal) {
    this.#precisaAchar = !opcoes.ip
    this.#aparelho = new TuyaDevice({
      id: opcoes.id,
      key: opcoes.key,
      ip: opcoes.ip || undefined,
      version: opcoes.versao || '3.3',
      issueGetOnConnect: false,
    })
    this.#aparelho.on('data', (dados) => this.#absorver(dados?.dps))
    this.#aparelho.on('dp-refresh', (dados) => this.#absorver(dados?.dps))
    this.#aparelho.on('error', (erro) => console.error('[lâmpada] erro:', erro.message))
    this.#aparelho.on('disconnected', () => {
      this.#conectando = null
    })
  }

  async estado() {
    await this.#conectar()
    const resposta = await this.#aparelho.get({ schema: true })
    if (typeof resposta === 'object' && resposta !== null && 'dps' in resposta) {
      this.#absorver(resposta.dps as Dps)
    }
    return this.#lerEstado()
  }

  async ligar(ligada: boolean) {
    const esq = await this.#esquema_()
    return this.#enviar({ [esq.ligada]: ligada })
  }

  async brilho(porcento: number) {
    const esq = await this.#esquema_()
    const atual = this.#lerEstado()
    if (atual.modo === 'cor') {
      const { h, s } = hexParaHsv(atual.cor)
      return this.#enviar({
        [esq.ligada]: true,
        [esq.cor]: esq.codificar({ h, s, v: Math.max(porcento, 1) / 100 }),
      })
    }
    return this.#enviar({
      [esq.ligada]: true,
      [esq.brilho]: paraAparelho(porcento, esq.brilhoMin, esq.brilhoMax),
    })
  }

  async temperatura(porcento: number) {
    const esq = await this.#esquema_()
    return this.#enviar({
      [esq.ligada]: true,
      [esq.modo]: 'white',
      [esq.temperatura]: paraAparelho(porcento, 0, esq.temperaturaMax),
    })
  }

  async cor(hex: string) {
    const esq = await this.#esquema_()
    const { h, s } = hexParaHsv(hex)
    const v = Math.max(this.#lerEstado().brilho, 1) / 100
    return this.#enviar({
      [esq.ligada]: true,
      [esq.modo]: 'colour',
      [esq.cor]: esq.codificar({ h, s, v }),
    })
  }

  fechar() {
    clearTimeout(this.#temporizador)
    if (this.#aparelho.isConnected()) this.#aparelho.disconnect()
  }

  /* ---- internos ------------------------------------------------- */

  async #conectar() {
    if (this.#aparelho.isConnected()) {
      this.#agendarDesconexao()
      return
    }
    this.#conectando ??= (async () => {
      try {
        if (this.#precisaAchar) await this.#aparelho.find({ timeout: 10 })
        await this.#aparelho.connect()
      } catch (erro) {
        this.#conectando = null
        throw new Error(explicar(erro, this.#precisaAchar))
      }
    })()
    await this.#conectando
    this.#agendarDesconexao()
  }

  /** Garante que já lemos a lâmpada pelo menos uma vez (pra saber o esquema). */
  async #esquema_() {
    if (!this.#esquema) await this.estado()
    return this.#esquema ?? ESQUEMA_B
  }

  async #enviar(dados: Dps) {
    await this.#conectar()
    await this.#aparelho.set({ multiple: true, data: dados as never, shouldWaitForResponse: true })
    this.#absorver(dados)
    return this.#lerEstado()
  }

  #absorver(dps: unknown) {
    if (typeof dps !== 'object' || dps === null) return
    Object.assign(this.#dps, dps as Dps)
    this.#esquema ??= '20' in this.#dps ? ESQUEMA_B : '1' in this.#dps ? ESQUEMA_A : null
  }

  #agendarDesconexao() {
    clearTimeout(this.#temporizador)
    this.#temporizador = setTimeout(() => {
      if (this.#aparelho.isConnected()) this.#aparelho.disconnect()
    }, OCIOSIDADE_MS)
    this.#temporizador.unref()
  }

  #lerEstado(): Estado {
    const esq = this.#esquema ?? ESQUEMA_B
    const dps = this.#dps
    const modoTuya = String(dps[esq.modo] ?? 'white')
    const modo: Modo = modoTuya === 'white' ? 'branco' : modoTuya === 'colour' ? 'cor' : 'outro'
    const hsv =
      typeof dps[esq.cor] === 'string' ? esq.decodificar(dps[esq.cor] as string) : { h: 0, s: 0, v: 1 }
    const brilho =
      modo === 'cor'
        ? Math.round(hsv.v * 100)
        : paraPorcento(Number(dps[esq.brilho] ?? esq.brilhoMax), esq.brilhoMin, esq.brilhoMax)
    return {
      ligada: Boolean(dps[esq.ligada]),
      modo,
      brilho,
      temperatura: paraPorcento(Number(dps[esq.temperatura] ?? 0), 0, esq.temperaturaMax),
      cor: hsvParaHex({ h: hsv.h, s: hsv.s, v: 1 }),
      fonte: 'local',
    }
  }
}

function explicar(erro: unknown, procurou: boolean): string {
  const texto = erro instanceof Error ? erro.message : String(erro)
  if (/find\(\)|timed out|ETIMEDOUT|EHOSTUNREACH/i.test(texto)) {
    return procurou
      ? `não achei a lâmpada na rede (${texto}). Confira se este computador está no mesmo Wi-Fi que ela, ou preencha TUYA_IP no .env.`
      : `a lâmpada não respondeu em TUYA_IP (${texto}). Confira o IP e TUYA_VERSAO (3.3, 3.4 ou 3.5).`
  }
  if (/ECONNREFUSED|ECONNRESET/i.test(texto)) {
    return `a lâmpada recusou a conexão (${texto}). Ela pode aceitar só um cliente local por vez — feche outros apps que falem com ela e tente de novo.`
  }
  if (/decrypt|json/i.test(texto)) {
    return `não consegui decifrar a resposta (${texto}). A chave TUYA_KEY mudou? Ela troca sempre que a lâmpada é removida e pareada de novo no app.`
  }
  return texto
}
