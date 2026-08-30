/** Fundo da página: brilho azul atrás da janela + malha discreta.
 *  Puramente decorativo — fica fora do fluxo e do leitor de tela. */
export default function Fundo() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--color-azul) 30%, transparent), transparent 68%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-azul-fundo) 1px, transparent 1px), linear-gradient(90deg, var(--color-azul-fundo) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage:
            'radial-gradient(ellipse 60% 55% at 50% 50%, #000 10%, transparent 75%)',
        }}
      />
    </div>
  )
}
