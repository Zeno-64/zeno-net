/** Configuração da página /luz (o controle da lâmpada). */
export const luz = {
  /** Onde o script `npm run luz:servidor` escuta. Mude junto com
   *  LAMPADA_PORTA no .env. Só funciona no computador que roda o script. */
  servidor: 'http://127.0.0.1:3131',
  /** Atalhos de cor mostrados abaixo dos controles. */
  cores: ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#2f81f7', '#af52de'],
  /** De quanto em quanto tempo a página relê o estado da lâmpada (ms). */
  intervalo: 4000,
} as const
