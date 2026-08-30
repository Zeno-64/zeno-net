import { tituloTrabalhos, trabalhos } from '../data/site'

/** Duas telinhas na mesma linguagem da janela principal, com o facho
 *  branco, cada uma linkando para um site publicado. */
export default function Trabalhos() {
  return (
    <section aria-labelledby="titulo-trabalhos" className="w-full max-w-[26rem]">
      <h2
        id="titulo-trabalhos"
        lang="en"
        className="mb-3 font-neon text-xl text-titulo"
      >
        {tituloTrabalhos}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {trabalhos.map((trabalho) => (
          <a
            key={trabalho.host}
            href={trabalho.url}
            target="_blank"
            rel="noopener noreferrer"
            className="moldura-luz luz-branca giro-lento group block"
          >
            <div className="h-full overflow-hidden rounded-[17px] bg-vidro/95">
              <div className="flex items-center gap-1.5 border-b border-white/[0.07] bg-white/[0.03] px-3 py-1.5">
                <span className="flex gap-1" aria-hidden>
                  <i className="size-1.5 rounded-full bg-fraco/70" />
                  <i className="size-1.5 rounded-full bg-fraco/70" />
                  <i className="size-1.5 rounded-full bg-suave/60" />
                </span>
                <span className="ml-0.5 truncate font-mono text-[0.6rem] text-fraco">
                  {trabalho.host}
                </span>
              </div>

              <div className="px-3 py-3">
                <p className="font-marca text-[0.95rem] font-bold italic leading-tight tracking-[-0.02em] text-titulo">
                  {trabalho.nome}
                </p>
                <p className="mt-1 text-[0.72rem] leading-snug text-suave">
                  {trabalho.descricao}
                </p>
                <p className="mt-2.5 font-mono text-[0.65rem] text-fraco transition-colors group-hover:text-titulo">
                  visitar ↗
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
