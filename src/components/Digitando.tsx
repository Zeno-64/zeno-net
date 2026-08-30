import { useEffect, useState } from 'react'

const VELOCIDADE_ESCRITA = 55
const VELOCIDADE_APAGADA = 28
const PAUSA_NO_FIM = 2200

/** Efeito de digitação em loop pelas `linhas`.
 *  Com "reduzir movimento" ligado, mostra a primeira linha e para. */
export default function Digitando({ linhas }: { linhas: readonly string[] }) {
  const [reduzido] = useState(
    () =>
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [indice, setIndice] = useState(0)
  const [tamanho, setTamanho] = useState(0)
  const [apagando, setApagando] = useState(false)

  const linha = linhas[indice % linhas.length]

  useEffect(() => {
    if (reduzido) return

    if (!apagando && tamanho === linha.length) {
      const t = setTimeout(() => setApagando(true), PAUSA_NO_FIM)
      return () => clearTimeout(t)
    }
    if (apagando && tamanho === 0) {
      setApagando(false)
      setIndice((i) => (i + 1) % linhas.length)
      return
    }

    const t = setTimeout(
      () => setTamanho((n) => n + (apagando ? -1 : 1)),
      apagando ? VELOCIDADE_APAGADA : VELOCIDADE_ESCRITA,
    )
    return () => clearTimeout(t)
  }, [reduzido, apagando, tamanho, linha, linhas.length])

  return (
    <p className="font-mono text-[0.8rem] text-suave">
      <span className="text-azul-claro">$</span>{' '}
      <span>{reduzido ? linha : linha.slice(0, tamanho)}</span>
      <span className="cursor-piscando ml-0.5 inline-block w-[0.55ch] bg-ciano align-middle text-transparent">
        .
      </span>
    </p>
  )
}
