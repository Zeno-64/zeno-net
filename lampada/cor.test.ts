import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  hexParaHsv,
  hsvParaHex,
  hsvParaTuyaA,
  hsvParaTuyaB,
  paraAparelho,
  paraPorcento,
  tuyaAParaHsv,
  tuyaBParaHsv,
} from './cor.ts'

test('hex ↔ hsv nas cores primárias', () => {
  assert.deepEqual(hexParaHsv('#ff0000'), { h: 0, s: 1, v: 1 })
  assert.deepEqual(hexParaHsv('#00ff00'), { h: 120, s: 1, v: 1 })
  assert.deepEqual(hexParaHsv('#0000ff'), { h: 240, s: 1, v: 1 })
  assert.deepEqual(hexParaHsv('#ffffff'), { h: 0, s: 0, v: 1 })
  assert.equal(hsvParaHex({ h: 0, s: 1, v: 1 }), '#ff0000')
  assert.equal(hsvParaHex({ h: 240, s: 1, v: 1 }), '#0000ff')
  assert.equal(hsvParaHex({ h: 360, s: 1, v: 1 }), '#ff0000')
})

test('ida e volta por hex preserva a cor', () => {
  for (const cor of ['#2f81f7', '#ff9500', '#7df0ff', '#123456', '#e11d3a']) {
    assert.equal(hsvParaHex(hexParaHsv(cor)), cor)
  }
})

test('hex inválido é rejeitado', () => {
  assert.throws(() => hexParaHsv('vermelho'))
  assert.throws(() => hexParaHsv('#fff'))
})

test('codificação tipo B (hhhhssssvvvv)', () => {
  assert.equal(hsvParaTuyaB({ h: 0, s: 1, v: 1 }), '000003e803e8')
  assert.equal(hsvParaTuyaB({ h: 240, s: 1, v: 0.5 }), '00f003e801f4')
  assert.deepEqual(tuyaBParaHsv('00f003e801f4'), { h: 240, s: 1, v: 0.5 })
  assert.deepEqual(tuyaBParaHsv('lixo'), { h: 0, s: 0, v: 1 })
})

test('codificação tipo A (rrggbb hhhh ss vv)', () => {
  assert.equal(hsvParaTuyaA({ h: 0, s: 1, v: 1 }), 'ff00000000ffff')
  const volta = tuyaAParaHsv('ff00000000ffff')
  assert.deepEqual(volta, { h: 0, s: 1, v: 1 })
  assert.deepEqual(tuyaAParaHsv('curto'), { h: 0, s: 0, v: 1 })
})

test('escalas 0–100 ↔ aparelho', () => {
  assert.equal(paraAparelho(0, 10, 1000), 10)
  assert.equal(paraAparelho(100, 10, 1000), 1000)
  assert.equal(paraAparelho(50, 0, 1000), 500)
  assert.equal(paraAparelho(150, 0, 1000), 1000)
  assert.equal(paraPorcento(1000, 10, 1000), 100)
  assert.equal(paraPorcento(10, 10, 1000), 0)
  assert.equal(paraPorcento(505, 10, 1000), 50)
})
