import { createHash, createHmac, randomUUID } from 'node:crypto'
import type { Estado, Lampada, Modo } from './tipos.ts'
import { hexParaHsv, hsvParaHex, paraAparelho, paraPorcento } from './cor.ts'

/** Fala com a lâmpada pela nuvem da Tuya (OpenAPI). Mais lento que o
 *  modo local e depende de internet, mas não precisa da chave local nem
 *  de estar no mesmo Wi-Fi. */

export const REGIOES = {
  us: 'https://openapi.tuyaus.com',
  'us-e': 'https://openapi-ueaz.tuyaus.com',
  eu: 'https://openapi.tuyaeu.com',
  'eu-w': 'https://openapi-weaz.tuyaeu.com',
  cn: 'https://openapi.tuyacn.com',
  in: 'https://openapi.tuyain.com',
} as const

export type Regiao = keyof typeof REGIOES

export type OpcoesNuvem = {
  accessId: string
  accessSecret: string
  deviceId: string
  regiao: Regiao
}

type Codigos = {
  brilho: string
  temperatura: string
  cor: string
  brilhoMin: number
  brilhoMax: number
  temperaturaMax: number
  corMax: number
}

const CODIGOS_V2: Codigos = {
  brilho: 'bright_value_v2',
  temperatura: 'temp_value_v2',
  cor: 'colour_data_v2',
  brilhoMin: 10,
  brilhoMax: 1000,
  temperaturaMax: 1000,
  corMax: 1000,
}

const CODIGOS_V1: Codigos = {
  brilho: 'bright_value',
  temperatura: 'temp_value',
  cor: 'colour_data',
  brilhoMin: 25,
  brilhoMax: 255,
  temperaturaMax: 255,
  corMax: 255,
}

type Status = Record<string, unknown>
type RespostaTuya<T> = { success: boolean; code?: number; msg?: string; result: T }

export class LampadaNuvem implements Lampada {
  #opcoes: OpcoesNuvem
  #host: string
  #token: { valor: string; expiraEm: number } | null = null
  #status: Status = {}
  #codigos: Codigos | null = null

  constructor(opcoes: OpcoesNuvem) {
    this.#opcoes = opcoes
    this.#host = REGIOES[opcoes.regiao]
  }

  async estado() {
    const lista = await this.#chamar<{ code: string; value: unknown }[]>(
      'GET',
      `/v1.0/iot-03/devices/${this.#opcoes.deviceId}/status`,
    )
    this.#status = Object.fromEntries(lista.map((item) => [item.code, item.value]))
    this.#codigos = 'bright_value_v2' in this.#status ? CODIGOS_V2 : CODIGOS_V1
    return this.#lerEstado()
  }

  async ligar(ligada: boolean) {
    await this.#codigos_()
    return this.#comandar({ switch_led: ligada })
  }

  async brilho(porcento: number) {
    const cod = await this.#codigos_()
    const atual = this.#lerEstado()
    if (atual.modo === 'cor') {
      const { h, s } = hexParaHsv(atual.cor)
      return this.#comandar({
        switch_led: true,
        [cod.cor]: this.#corJson(h, s, Math.max(porcento, 1) / 100),
      })
    }
    return this.#comandar({
      switch_led: true,
      [cod.brilho]: paraAparelho(porcento, cod.brilhoMin, cod.brilhoMax),
    })
  }

  async temperatura(porcento: number) {
    const cod = await this.#codigos_()
    return this.#comandar({
      switch_led: true,
      work_mode: 'white',
      [cod.temperatura]: paraAparelho(porcento, 0, cod.temperaturaMax),
    })
  }

  async cor(hex: string) {
    const cod = await this.#codigos_()
    const { h, s } = hexParaHsv(hex)
    const v = Math.max(this.#lerEstado().brilho, 1) / 100
    return this.#comandar({
      switch_led: true,
      work_mode: 'colour',
      [cod.cor]: this.#corJson(h, s, v),
    })
  }

  fechar() {}

  /* ---- internos ------------------------------------------------- */

  async #codigos_() {
    if (!this.#codigos) await this.estado()
    return this.#codigos ?? CODIGOS_V2
  }

  #corJson(h: number, s: number, v: number) {
    const max = (this.#codigos ?? CODIGOS_V2).corMax
    return JSON.stringify({ h: Math.round(h), s: Math.round(s * max), v: Math.round(v * max) })
  }

  async #comandar(valores: Record<string, unknown>) {
    await this.#chamar('POST', `/v1.0/iot-03/devices/${this.#opcoes.deviceId}/commands`, {
      commands: Object.entries(valores).map(([code, value]) => ({ code, value })),
    })
    Object.assign(this.#status, valores)
    return this.#lerEstado()
  }

  #lerEstado(): Estado {
    const cod = this.#codigos ?? CODIGOS_V2
    const st = this.#status
    const modoTuya = String(st.work_mode ?? 'white')
    const modo: Modo = modoTuya === 'white' ? 'branco' : modoTuya === 'colour' ? 'cor' : 'outro'
    const hsv = lerCorJson(st[cod.cor], cod.corMax)
    const brilho =
      modo === 'cor'
        ? Math.round(hsv.v * 100)
        : paraPorcento(Number(st[cod.brilho] ?? cod.brilhoMax), cod.brilhoMin, cod.brilhoMax)
    return {
      ligada: Boolean(st.switch_led),
      modo,
      brilho,
      temperatura: paraPorcento(Number(st[cod.temperatura] ?? 0), 0, cod.temperaturaMax),
      cor: hsvParaHex({ h: hsv.h, s: hsv.s, v: 1 }),
      fonte: 'nuvem',
    }
  }

  async #obterToken() {
    if (this.#token && this.#token.expiraEm > Date.now()) return this.#token.valor
    const r = await this.#chamar<{ access_token: string; expire_time: number }>(
      'GET',
      '/v1.0/token?grant_type=1',
      undefined,
      false,
    )
    this.#token = { valor: r.access_token, expiraEm: Date.now() + (r.expire_time - 60) * 1000 }
    return r.access_token
  }

  /** Assinatura HMAC-SHA256 no formato exigido pela OpenAPI da Tuya. */
  async #chamar<T>(metodo: 'GET' | 'POST', caminho: string, corpo?: unknown, comToken = true): Promise<T> {
    const token = comToken ? await this.#obterToken() : ''
    const t = Date.now().toString()
    const nonce = randomUUID()
    const corpoTexto = corpo === undefined ? '' : JSON.stringify(corpo)
    const hashCorpo = createHash('sha256').update(corpoTexto).digest('hex')
    const stringToSign = [metodo, hashCorpo, '', caminho].join('\n')
    const sign = createHmac('sha256', this.#opcoes.accessSecret)
      .update(this.#opcoes.accessId + token + t + nonce + stringToSign)
      .digest('hex')
      .toUpperCase()

    let resposta: Response
    try {
      resposta = await fetch(this.#host + caminho, {
        method: metodo,
        headers: {
          client_id: this.#opcoes.accessId,
          sign,
          t,
          nonce,
          sign_method: 'HMAC-SHA256',
          'Content-Type': 'application/json',
          ...(token ? { access_token: token } : {}),
        },
        body: corpoTexto || undefined,
      })
    } catch (erro) {
      const causa = erro instanceof Error && erro.cause instanceof Error ? erro.cause.message : ''
      throw new Error(`não consegui falar com a nuvem da Tuya em ${this.#host}${causa ? ` (${causa})` : ''}. Está sem internet?`)
    }
    const json = (await resposta.json()) as RespostaTuya<T>
    if (!json.success) {
      if (json.code === 1010) this.#token = null // token vencido: a próxima chamada renova
      throw new Error(`Tuya respondeu ${json.code}: ${json.msg ?? 'erro desconhecido'}`)
    }
    return json.result
  }
}

function lerCorJson(valor: unknown, max: number) {
  try {
    const obj = typeof valor === 'string' ? JSON.parse(valor) : valor
    if (obj && typeof obj === 'object' && 'h' in obj) {
      const { h, s, v } = obj as { h: number; s: number; v: number }
      return { h: Number(h) || 0, s: (Number(s) || 0) / max, v: (Number(v) || max) / max }
    }
  } catch {
    /* valor estranho: cai no padrão abaixo */
  }
  return { h: 0, s: 0, v: 1 }
}
