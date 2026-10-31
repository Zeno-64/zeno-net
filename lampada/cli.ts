import { criarLampada } from './config.ts'
import type { Estado, Lampada } from './tipos.ts'

/** Controle pela linha de comando, sem o site:
 *    npm run luz -- estado
 *    npm run luz -- ligar | desligar
 *    npm run luz -- brilho 60
 *    npm run luz -- temperatura 20     (0 = quente, 100 = frio)
 *    npm run luz -- cor ff8800 */

const [comando, argumento] = process.argv.slice(2)

const AJUDA = `uso: npm run luz -- <comando> [valor]

  estado                 mostra como a lâmpada está
  ligar | desligar
  brilho <0–100>
  temperatura <0–100>    0 = branco quente, 100 = branco frio
  cor <rrggbb>           ex.: cor ff8800`

function numero(texto: string | undefined) {
  const n = Number(texto)
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    console.error('valor precisa ser um número de 0 a 100')
    process.exit(2)
  }
  return n
}

function mostrar(e: Estado) {
  const linhas = [
    `lâmpada     ${e.ligada ? 'ligada' : 'desligada'}  (via ${e.fonte})`,
    `modo        ${e.modo}`,
    `brilho      ${e.brilho}%`,
    `temperatura ${e.temperatura}%  (0 quente · 100 frio)`,
    `cor         ${e.cor}`,
  ]
  console.log(linhas.join('\n'))
}

let lampada: Lampada
try {
  lampada = criarLampada()
} catch (erro) {
  console.error('erro:', erro instanceof Error ? erro.message : erro)
  process.exit(1)
}

try {
  let estado: Estado
  switch (comando) {
    case 'estado':
      estado = await lampada.estado()
      break
    case 'ligar':
      estado = await lampada.ligar(true)
      break
    case 'desligar':
      estado = await lampada.ligar(false)
      break
    case 'brilho':
      estado = await lampada.brilho(numero(argumento))
      break
    case 'temperatura':
      estado = await lampada.temperatura(numero(argumento))
      break
    case 'cor':
      if (!argumento) {
        console.error('faltou a cor, ex.: cor ff8800')
        process.exit(2)
      }
      estado = await lampada.cor(argumento)
      break
    default:
      console.log(AJUDA)
      process.exit(comando ? 2 : 0)
  }
  mostrar(estado)
} catch (erro) {
  console.error('erro:', erro instanceof Error ? erro.message : erro)
  process.exitCode = 1
} finally {
  lampada.fechar()
}
