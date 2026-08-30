import Digitando from './Digitando'
import LinhaDominio from './LinhaDominio'
import { dominios, redes, site } from '../data/site'

/** A janelinha central, com o facho de luz azul correndo na borda
 *  (a animação está em `.moldura-luz`, no index.css). */
export default function Janela() {
  return (
    <div className="moldura-luz w-full max-w-[26rem]">
      <div className="overflow-hidden rounded-[17px] bg-vidro/95 backdrop-blur-xl">
        {/* barra de título */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <i className="size-2.5 rounded-full bg-fraco/70" />
            <i className="size-2.5 rounded-full bg-fraco/70" />
            <i className="size-2.5 rounded-full bg-azul/80" />
          </span>
          <span className="ml-1 font-mono text-[0.72rem] text-fraco">
            {site.nick}@web
          </span>
        </div>

        <div className="px-6 pb-6 pt-7">
          <h1 className="font-marca text-[2.1rem] font-bold italic leading-none tracking-[-0.02em] text-titulo">
            {site.titulo}
          </h1>
          <p className="mt-1 text-[0.82rem] text-texto">{site.papel}</p>

          <div className="mt-4">
            <Digitando linhas={site.linhas} />
          </div>

          <div className="my-5 h-px bg-gradient-to-r from-transparent via-azul/25 to-transparent" />

          <nav aria-label="Meus domínios" className="-mx-1 flex flex-col gap-1">
            {dominios.map((dominio) => (
              <LinhaDominio key={dominio.host} dominio={dominio} />
            ))}
          </nav>

          {redes.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] pt-4">
              {redes.map((rede) => (
                <a
                  key={rede.nome}
                  href={rede.url}
                  className="font-mono text-[0.75rem] text-suave transition-colors hover:text-azul-claro"
                >
                  {rede.nome}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
