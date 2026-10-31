/** O que o site e o servidor local combinam entre si. Tudo em escala
 *  humana (0–100 e #rrggbb); a tradução para o que a lâmpada entende
 *  fica dentro de cada implementação de `Lampada`. */

export type Modo = 'branco' | 'cor' | 'outro'

export type Fonte = 'local' | 'nuvem' | 'simulada'

export type Estado = {
  ligada: boolean
  modo: Modo
  /** 0–100 */
  brilho: number
  /** 0 = branco quente, 100 = branco frio */
  temperatura: number
  /** #rrggbb — matiz e saturação atuais, em valor máximo (o brilho vai à parte) */
  cor: string
  /** Por onde o servidor está falando com a lâmpada. */
  fonte: Fonte
}

export interface Lampada {
  estado(): Promise<Estado>
  ligar(ligada: boolean): Promise<Estado>
  brilho(porcento: number): Promise<Estado>
  temperatura(porcento: number): Promise<Estado>
  cor(hex: string): Promise<Estado>
  fechar(): void
}
