import type { Dominio } from '../data/site'

/** Uma linha da lista de domínios. O domínio atual não vira link. */
export default function LinhaDominio({ dominio }: { dominio: Dominio }) {
  const conteudo = (
    <>
      <span className="min-w-0">
        <span className="block truncate font-mono text-[0.9rem] text-titulo">
          {dominio.host}
        </span>
        <span className="mt-0.5 block truncate text-[0.78rem] text-suave">
          {dominio.descricao}
        </span>
      </span>
      <span className="shrink-0 rounded-full border border-azul/30 bg-azul/10 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide text-azul-claro">
        {dominio.estado}
      </span>
    </>
  )

  const base =
    'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition duration-300 ease-suave'

  if (dominio.atual) {
    return (
      <div className={`${base} bg-azul/[0.07]`} aria-current="page">
        {conteudo}
      </div>
    )
  }

  return (
    <a
      href={dominio.url}
      className={`${base} hover:bg-azul/[0.09] hover:translate-x-0.5`}
    >
      {conteudo}
    </a>
  )
}
