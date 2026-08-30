import { perfil } from '../data/site'

/** Foto de perfil com o mesmo facho da janela, só que vermelho (a cor sai
 *  do modificador `.luz-vermelha`, em index.css).
 *
 *  O anel escuro entre a foto e a moldura é proposital: a foto já é toda
 *  vermelha, e sem esse respiro a luz se dissolve dentro dela.
 *  Para deixar redondo, trocar os `rounded-*` daqui por `rounded-full`. */
export default function Avatar() {
  return (
    <div className="moldura-luz luz-vermelha giro-rapido shrink-0 rounded-[17px]">
      <div className="rounded-[15px] bg-fundo p-[3px]">
        <img
          src={perfil.imagem}
          alt={perfil.alt}
          width={68}
          height={68}
          className="block size-[68px] rounded-[12px] object-cover"
        />
      </div>
    </div>
  )
}
