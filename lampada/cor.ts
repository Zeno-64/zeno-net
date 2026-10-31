/** Conversões entre a escala do site (0–100, #rrggbb) e a da lâmpada
 *  (HSV em inteiros, nas faixas que a Tuya usa). */

/** h em graus (0–360); s e v de 0 a 1. */
export type HSV = { h: number; s: number; v: number }

export const limitar = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

/** 0–100 → inteiro na faixa [min, max] do aparelho. */
export const paraAparelho = (porcento: number, min: number, max: number) =>
  Math.round(min + (limitar(porcento, 0, 100) / 100) * (max - min))

/** inteiro na faixa [min, max] do aparelho → 0–100. */
export const paraPorcento = (valor: number, min: number, max: number) =>
  Math.round(limitar((valor - min) / (max - min), 0, 1) * 100)

export function hexParaHsv(hex: string): HSV {
  const limpo = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(limpo)) throw new Error(`cor inválida: ${hex}`)
  const r = parseInt(limpo.slice(0, 2), 16) / 255
  const g = parseInt(limpo.slice(2, 4), 16) / 255
  const b = parseInt(limpo.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function hsvParaHex({ h, s, v }: HSV): string {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const setor = Math.floor(((h % 360) + 360) % 360 / 60)
  const [r, g, b] = (
    [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ] as const
  )[setor]!
  const canal = (n: number) =>
    Math.round(limitar(n + m, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${canal(r)}${canal(g)}${canal(b)}`
}

const hex = (n: number, digitos: number) =>
  Math.round(limitar(n, 0, 16 ** digitos - 1))
    .toString(16)
    .padStart(digitos, '0')

/* ---- Lâmpadas "tipo B" (dps 20–24, protocolo 3.3+) --------------
   Cor = hhhhssssvvvv: matiz 0–360, saturação e valor 0–1000. */

export function hsvParaTuyaB({ h, s, v }: HSV): string {
  return hex(h, 4) + hex(s * 1000, 4) + hex(v * 1000, 4)
}

export function tuyaBParaHsv(texto: string): HSV {
  if (!/^[0-9a-f]{12}$/i.test(texto)) return { h: 0, s: 0, v: 1 }
  return {
    h: parseInt(texto.slice(0, 4), 16),
    s: parseInt(texto.slice(4, 8), 16) / 1000,
    v: parseInt(texto.slice(8, 12), 16) / 1000,
  }
}

/* ---- Lâmpadas "tipo A" (dps 1–5, protocolo 3.1) -------------------
   Cor = rrggbb + hhhh + ss + vv: saturação e valor 0–255. */

export function hsvParaTuyaA(cor: HSV): string {
  return (
    hsvParaHex(cor).slice(1) + hex(cor.h, 4) + hex(cor.s * 255, 2) + hex(cor.v * 255, 2)
  )
}

export function tuyaAParaHsv(texto: string): HSV {
  if (!/^[0-9a-f]{14}$/i.test(texto)) return { h: 0, s: 0, v: 1 }
  return {
    h: parseInt(texto.slice(6, 10), 16),
    s: parseInt(texto.slice(10, 12), 16) / 255,
    v: parseInt(texto.slice(12, 14), 16) / 255,
  }
}
