import type { Estado, Lampada } from './tipos.ts'
import { hexParaHsv, hsvParaHex, limitar } from './cor.ts'

/** Uma lâmpada de mentira, só em memória. Serve para desenvolver a
 *  página /luz sem a lâmpada de verdade e para testar o servidor. */
export class LampadaSimulada implements Lampada {
  #estado: Estado = {
    ligada: false,
    modo: 'branco',
    brilho: 80,
    temperatura: 35,
    cor: '#ff9500',
    fonte: 'simulada',
  }

  async estado() {
    return { ...this.#estado }
  }

  async ligar(ligada: boolean) {
    this.#estado.ligada = ligada
    return this.estado()
  }

  async brilho(porcento: number) {
    this.#estado.brilho = Math.round(limitar(porcento, 0, 100))
    this.#estado.ligada = true
    return this.estado()
  }

  async temperatura(porcento: number) {
    this.#estado.temperatura = Math.round(limitar(porcento, 0, 100))
    this.#estado.modo = 'branco'
    this.#estado.ligada = true
    return this.estado()
  }

  async cor(hex: string) {
    const { h, s } = hexParaHsv(hex)
    this.#estado.cor = hsvParaHex({ h, s, v: 1 })
    this.#estado.modo = 'cor'
    this.#estado.ligada = true
    return this.estado()
  }

  fechar() {}
}
