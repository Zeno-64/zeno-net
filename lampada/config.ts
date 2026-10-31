import type { Lampada } from './tipos.ts'
import { LampadaLocal } from './local.ts'
import { LampadaNuvem, REGIOES, type Regiao } from './nuvem.ts'
import { LampadaSimulada } from './simulada.ts'

// Lê o .env da raiz, se existir (variáveis já definidas no ambiente ganham).
try {
  process.loadEnvFile('.env')
} catch {
  /* sem .env: segue só com o ambiente */
}

const env = (nome: string) => process.env[nome]?.trim() || ''

/** Escolhe como falar com a lâmpada a partir do .env:
 *  - LAMPADA_MODO=local | nuvem | simulada força um modo;
 *  - sem isso, usa `local` se TUYA_KEY existir, `nuvem` se TUYA_ACCESS_ID
 *    existir, e `simulada` se não houver nada. */
export function criarLampada(): Lampada {
  const modo = env('LAMPADA_MODO') || (env('TUYA_KEY') ? 'local' : env('TUYA_ACCESS_ID') ? 'nuvem' : 'simulada')

  switch (modo) {
    case 'local': {
      const id = exigir('TUYA_ID')
      const key = exigir('TUYA_KEY')
      return new LampadaLocal({ id, key, ip: env('TUYA_IP'), versao: env('TUYA_VERSAO') })
    }
    case 'nuvem': {
      const regiao = env('TUYA_REGIAO') || 'us'
      if (!(regiao in REGIOES)) {
        throw new Error(`TUYA_REGIAO inválida: ${regiao}. Use ${Object.keys(REGIOES).join(', ')}.`)
      }
      return new LampadaNuvem({
        accessId: exigir('TUYA_ACCESS_ID'),
        accessSecret: exigir('TUYA_ACCESS_SECRET'),
        deviceId: exigir('TUYA_ID'),
        regiao: regiao as Regiao,
      })
    }
    case 'simulada':
      console.warn('[lâmpada] sem TUYA_KEY nem TUYA_ACCESS_ID no .env — usando uma lâmpada SIMULADA.')
      return new LampadaSimulada()
    default:
      throw new Error(`LAMPADA_MODO inválido: ${modo}. Use local, nuvem ou simulada.`)
  }
}

function exigir(nome: string) {
  const valor = env(nome)
  if (!valor) throw new Error(`falta ${nome} no .env (veja .env.exemplo).`)
  return valor
}
