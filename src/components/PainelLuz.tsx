import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { hexParaHsv, hsvParaHex } from '../../lampada/cor.ts'
import type { Estado } from '../../lampada/tipos.ts'
import { luz } from '../data/luz'

/** O painel da lâmpada: mesma janela da página inicial, mas o facho da
 *  borda assume a cor e a temperatura da luz. Fala com o script local
 *  (`npm run luz:servidor`) em 127.0.0.1 — veja o README. */

type InitComRede = RequestInit & { targetAddressSpace?: 'loopback' | 'local' | 'public' }

async function chamar(caminho: string, corpo?: object): Promise<Estado> {
  const init: InitComRede = {
    method: corpo ? 'POST' : 'GET',
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
    // O Chrome pede permissão pra uma página pública falar com 127.0.0.1
    // e, com o alvo declarado, não trata isso como conteúdo misto.
    targetAddressSpace: 'loopback',
  }
  const resposta = await fetch(`${luz.servidor}${caminho}`, init)
  const json = (await resposta.json().catch(() => null)) as (Estado & { erro?: string }) | null
  if (!resposta.ok) throw new Error(json?.erro ?? `HTTP ${resposta.status}`)
  if (!json) throw new Error('resposta vazia')
  return json
}

const mensagem = (erro: unknown) => (erro instanceof Error ? erro.message : String(erro))

/** O servidor devolve a cor sempre em valor máximo (o brilho vai à parte);
 *  pra saber qual atalho está ativo, comparamos nesse mesmo tom cheio. */
const tomCheio = (hex: string) => hsvParaHex({ ...hexParaHsv(hex), v: 1 })

/** A cor que a borda e o "bulbo" mostram. Apagada = cinza. */
function corDaLuz(estado: Estado | null) {
  if (!estado?.ligada) return 'var(--color-fraco)'
  if (estado.modo === 'cor') return estado.cor
  return `color-mix(in oklab, #ffb863 ${100 - estado.temperatura}%, #cfe3ff)`
}

export default function PainelLuz() {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const pendente = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mexendo = useRef(false)

  const ler = useCallback(async () => {
    try {
      setEstado(await chamar('/estado'))
      setErro(null)
    } catch (e) {
      setErro(mensagem(e))
    }
  }, [])

  useEffect(() => {
    void ler()
  }, [ler])

  useEffect(() => {
    if (erro) return
    const id = setInterval(() => {
      if (!mexendo.current) void ler()
    }, luz.intervalo)
    return () => clearInterval(id)
  }, [erro, ler])

  /** Aplica a mudança na tela já, manda pro script e corrige com a resposta. */
  const enviar = useCallback(async (caminho: string, corpo: object, otimista: Partial<Estado>) => {
    setEstado((atual) => (atual ? { ...atual, ...otimista } : atual))
    try {
      setEstado(await chamar(caminho, corpo))
      setAviso(null)
    } catch (e) {
      setAviso(mensagem(e))
    }
  }, [])

  /** Para os controles deslizantes: espera a mão parar antes de mandar. */
  const deslizar = (caminho: string, valor: number, otimista: Partial<Estado>) => {
    mexendo.current = true
    setEstado((atual) => (atual ? { ...atual, ...otimista } : atual))
    clearTimeout(pendente.current)
    pendente.current = setTimeout(() => {
      mexendo.current = false
      void enviar(caminho, { valor }, otimista)
    }, 180)
  }

  const cor = corDaLuz(estado)
  const estilo = { '--cor-lampada': cor } as CSSProperties

  const linha = erro
    ? 'script não encontrado'
    : !estado
      ? 'conectando…'
      : !estado.ligada
        ? 'lâmpada desligada'
        : estado.modo === 'cor'
          ? `ligada · ${estado.cor} · ${estado.brilho}%`
          : `ligada · branco ${estado.temperatura < 50 ? 'quente' : 'frio'} · ${estado.brilho}%`

  return (
    <div className="moldura-luz luz-lampada w-full max-w-[26rem]" style={estilo}>
      <div className="overflow-hidden rounded-[17px] bg-vidro/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <i className="size-2.5 rounded-full bg-fraco/70" />
            <i className="size-2.5 rounded-full bg-fraco/70" />
            <i className="size-2.5 rounded-full" style={{ background: cor }} />
          </span>
          <span className="ml-1 font-mono text-[0.72rem] text-fraco">zeno@casa</span>
          <a href="/" className="ml-auto font-mono text-[0.72rem] text-fraco transition-colors hover:text-titulo">
            ← início
          </a>
        </div>

        <div className="px-6 pb-6 pt-6">
          <div className="flex items-center gap-4">
            <Bulbo cor={cor} ligada={Boolean(estado?.ligada) && !erro} />
            <div className="min-w-0">
              <h1 className="font-marca text-[2.1rem] font-bold italic leading-none tracking-[-0.02em] text-titulo">
                Luz
              </h1>
              <p className="mt-1 truncate font-mono text-[0.8rem] text-suave" aria-live="polite">
                <span className="text-azul-claro">$</span> {linha}
              </p>
            </div>
          </div>

          <div className="my-5 h-px bg-gradient-to-r from-transparent via-azul/25 to-transparent" />

          {erro ? (
            <SemServidor erro={erro} tentar={ler} />
          ) : (
            estado && (
              <Controles estado={estado} cor={cor} enviar={enviar} deslizar={deslizar} aviso={aviso} />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function Bulbo({ cor, ligada }: { cor: string; ligada: boolean }) {
  return (
    <span
      aria-hidden
      className="relative grid size-14 shrink-0 place-items-center rounded-full transition-all duration-500 ease-suave"
      style={{
        background: `radial-gradient(circle at 50% 40%, ${ligada ? '#fff' : 'transparent'} 0%, ${cor} 55%, color-mix(in oklab, ${cor} 40%, transparent) 100%)`,
        boxShadow: ligada ? `0 0 28px 6px color-mix(in oklab, ${cor} 55%, transparent)` : 'none',
        opacity: ligada ? 1 : 0.45,
      }}
    />
  )
}

type PropsControles = {
  estado: Estado
  cor: string
  aviso: string | null
  enviar: (caminho: string, corpo: object, otimista: Partial<Estado>) => Promise<void>
  deslizar: (caminho: string, valor: number, otimista: Partial<Estado>) => void
}

function Controles({ estado, cor, aviso, enviar, deslizar }: PropsControles) {
  const acento = { accentColor: estado.ligada ? cor : 'var(--color-suave)' } as CSSProperties

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        aria-pressed={estado.ligada}
        onClick={() => void enviar('/ligar', { ligada: !estado.ligada }, { ligada: !estado.ligada })}
        className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left transition duration-300 ease-suave hover:bg-white/[0.06]"
      >
        <span className="font-mono text-[0.9rem] text-titulo">{estado.ligada ? 'desligar' : 'ligar'}</span>
        <span
          aria-hidden
          className="rounded-full border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide"
          style={{
            color: estado.ligada ? cor : 'var(--color-suave)',
            borderColor: `color-mix(in oklab, ${estado.ligada ? cor : 'var(--color-suave)'} 40%, transparent)`,
            background: `color-mix(in oklab, ${estado.ligada ? cor : 'var(--color-suave)'} 12%, transparent)`,
          }}
        >
          {estado.ligada ? 'ligada' : 'desligada'}
        </span>
      </button>

      <Deslizante
        id="brilho"
        rotulo="brilho"
        valor={estado.brilho}
        extremos={['escuro', 'claro']}
        estilo={acento}
        aoMudar={(v) => deslizar('/brilho', v, { brilho: v, ligada: true })}
      />

      <Deslizante
        id="temperatura"
        rotulo="branco"
        valor={estado.temperatura}
        extremos={['quente', 'frio']}
        estilo={acento}
        aoMudar={(v) => deslizar('/temperatura', v, { temperatura: v, modo: 'branco', ligada: true })}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[0.75rem] text-suave">cor</span>
          <span className="font-mono text-[0.7rem] text-fraco">{estado.modo === 'cor' ? estado.cor : '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          {luz.cores.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`cor ${c}`}
              aria-pressed={estado.modo === 'cor' && estado.cor === tomCheio(c)}
              onClick={() => void enviar('/cor', { hex: c }, { cor: c, modo: 'cor', ligada: true })}
              className="size-7 rounded-full border-2 transition duration-300 ease-suave hover:scale-110"
              style={{
                background: c,
                borderColor: estado.modo === 'cor' && estado.cor === tomCheio(c) ? '#fff' : 'transparent',
              }}
            />
          ))}
          <label className="relative ml-auto size-7 cursor-pointer overflow-hidden rounded-full border border-white/20">
            <span className="sr-only">escolher outra cor</span>
            <input
              type="color"
              value={estado.cor}
              onChange={(e) => {
                const hex = e.currentTarget.value
                void enviar('/cor', { hex }, { cor: hex, modo: 'cor', ligada: true })
              }}
              className="absolute -inset-2 size-[200%] cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </div>
      </div>

      <p className="min-h-[1.2em] font-mono text-[0.7rem] text-fraco" aria-live="polite">
        {aviso ? <span className="text-vermelho-claro">erro: {aviso}</span> : `via ${estado.fonte} · ${luz.servidor.replace(/^https?:\/\//, '')}`}
      </p>
    </div>
  )
}

function Deslizante({
  id,
  rotulo,
  valor,
  extremos,
  estilo,
  aoMudar,
}: {
  id: string
  rotulo: string
  valor: number
  extremos: [string, string]
  estilo: CSSProperties
  aoMudar: (valor: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="font-mono text-[0.75rem] text-suave">
          {rotulo}
        </label>
        <span className="font-mono text-[0.7rem] text-fraco">{valor}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={valor}
        onChange={(e) => aoMudar(Number(e.currentTarget.value))}
        className="w-full"
        style={estilo}
      />
      <div className="mt-0.5 flex justify-between font-mono text-[0.6rem] text-fraco">
        <span>{extremos[0]}</span>
        <span>{extremos[1]}</span>
      </div>
    </div>
  )
}

function SemServidor({ erro, tentar }: { erro: string; tentar: () => void }) {
  return (
    <div className="flex flex-col gap-3 text-[0.82rem] leading-relaxed text-texto">
      <p>
        Não achei o script da lâmpada em{' '}
        <code className="font-mono text-azul-claro">{luz.servidor.replace(/^https?:\/\//, '')}</code>. Ele
        precisa estar rodando <em>neste</em> computador:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-black/40 px-3 py-2 font-mono text-[0.78rem] text-titulo">
        npm run luz:servidor
      </pre>
      <p className="text-suave">
        Se o navegador perguntar se o site pode acessar a rede local, permita. Se nada mudar, veja a seção
        "A lâmpada" no README.
      </p>
      <p className="font-mono text-[0.68rem] text-fraco">detalhe: {erro}</p>
      <button
        type="button"
        onClick={tentar}
        className="self-start rounded-full border border-azul/30 bg-azul/10 px-3 py-1 font-mono text-[0.72rem] uppercase tracking-wide text-azul-claro transition-colors hover:bg-azul/20"
      >
        tentar de novo
      </button>
    </div>
  )
}
