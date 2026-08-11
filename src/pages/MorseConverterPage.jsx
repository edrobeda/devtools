import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Tabs, Input, Alert, Button, Slider, Collapse, Tag, message } from 'antd'
import { CopyOutlined, SoundOutlined, StopOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { MORSE, textToMorse, morseToText, buildPlaybackTimeline, timelineDurationMs, unitMs } from '../utils/morse'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { useMessage } = message

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const DIGITS = '0123456789'.split('')
const PUNCT = ['.', ',', '?', "'", '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', '$', '@', 'ñ', 'ç']

const ENCODE_EXAMPLES = ['SOS', 'HELLO WORLD', 'MAYDAY MAYDAY', 'Open port 8080 now', 'What? 404! (test)']
const DECODE_EXAMPLES = [
  '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
  '... --- ...',
  '- .... . / --.- ..- .. -.-. -.- / -... .-. --- .-- -. / ..-. --- -..-',
  '.-- .... .- - ... / ..- .--. / - .... . / ...- --- .-.. ..- -- .',
  '.- / ...- .-.. ..- ... -- ---',
]

const translations = {
  pt: {
    title: 'Conversor de Código Morse',
    intro: (
      <>
        Codifica e decodifica código Morse — o alfabeto de pontos e traços em
        que cada caractere é uma sequência de sinais <Text code>.</Text>
        (<Text strong>dit</Text>) e <Text code>-</Text> (<Text strong>dah</Text>).
        Letras são separadas por espaços, palavras por <Text code>/</Text>.
        Além de converter nos dois sentidos, a página <Text strong>toca</Text>{' '}
        o morse via Web Audio (com a lâmpada sincronizando) e dá o tempo
        estimado de transmissão pela velocidade padrão.
      </>
    ),
    alertTitle: 'Morse é timing, não escrita',
    alertBody: (
      <>
        Na transmissão real não existem <Text code>.</Text> nem{' '}
        <Text code>-</Text> — existe <Text strong>som ligado</Text> de 1 unidade
        (dit) ou 3 (dah), e <Text strong>silêncio</Text> de 1 unidade entre
        sinais do mesmo caractere, 3 entre letras e 7 entre palavras ({' '}
        <Text code>1200 / WPM</Text> ms por unidade no padrão PARIS). Aqui os
        símbolos são só a notação por escrito. Ao converter <Text strong>de</Text>{' '}
        texto, caracteres fora da tabela (ex.: acentuação, pois{' '}
        <Text code>í = I</Text> e <Text code>ú = U</Text> no morse) são
        descartados e contados. Ao converter <Text strong>para</Text> texto,
        sequências inválidas viram <Text code>?</Text>. Sempre ouça o resultado
        antes de confiar em decodificações à mão — espaço entre letras é fácil
        de errar.
      </>
    ),
    tabEncode: 'Codificar (texto → morse)',
    tabDecode: 'Decodificar (morse → texto)',
    textInput: 'Texto original',
    textPlaceholder: 'Digite (ou cole) o texto a codificar…',
    morsesInput: 'Entrada em morse',
    morsesPlaceholder: 'Ponto, traço e espaço:  . .-  /  -- --- .-. ... .   (aceita "·" e "/" ou "|" pra separar palavras)',
    examples: 'Exemplos',
    outputMorse: 'Morse gerado',
    outputText: 'Texto decodificado',
    emptyPlaceholder: 'A saída aparece aqui…',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    ignored: (n) => `${n} caractere(s) fora da tabela ignorado(s)`,
    unknown: (n) => `${n} sequência(s) desconhecida(s) → "?"`,
    statChars: 'caracteres',
    statSymbols: 'sinais',
    statWords: 'palavras',
    statTokens: 'sequências (letras)',
    statLetters: 'letras',
    statDuration: 'duração estimada',
    playback: 'Reproduzir morse',
    playbackHint: 'Ouvir o código (Web Audio) e ver a lâmpada acompanhar. A duração usa a velocidade abaixo.',
    wpm: 'Velocidade',
    wpmHint: (w) => `WPM (${w} ms por unidade)`,
    play: 'Ouvir',
    stop: 'Parar',
    playing: 'Tocando…',
    durationMs: (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`),
    refTitle: 'Tabela de referência (código internacional)',
    refLetters: 'Letras',
    refDigits: 'Números',
    refPunct: 'Pontuação e símbolos',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/morse.js. textToMorse normaliza pra maiúsculas, quebra em palavras, troca cada caractere pelo código e junta com espaços entre letras e " / " entre palavras, contando os descartados. morseToText é tolerante: aceita "·" no lugar de ".", vários espaços/quebras e "/" ou "|" como separador de palavra, mapeando por tabela reversa e marcando desconhecidos com "?". buildPlaybackTimeline monta a linha do tempo da reprodução a partir da regra PARIS — unidade = 1200/WPM ms, dit 1 unidade, dah 3, silêncio de 1 entre sinais, 3 entre letras e 7 entre palavras — e timelineDurationMs soma os eventos pra estimar a duração.',
  },
  en: {
    title: 'Morse Code Converter',
    intro: (
      <>
        Encodes and decodes Morse code — the dots-and-dashes alphabet where
        each character is a sequence of <Text code>.</Text> ({' '}
        <Text strong>dit</Text>) and <Text code>-</Text> ({' '}
        <Text strong>dah</Text>) signals. Letters are separated by spaces,
        words by <Text code>/</Text>. Beyond converting both ways, the page{' '}
        <Text strong>plays</Text> the Morse over Web Audio (with a lamp
        blinking in sync) and estimates the transmission time at the chosen
        speed.
      </>
    ),
    alertTitle: 'Morse is timing, not writing',
    alertBody: (
      <>
        Real transmissions have no <Text code>.</Text> or{' '}
        <Text code>-</Text> — there is <Text strong>sound on</Text> for 1 unit
        (dit) or 3 (dah), and <Text strong>silence</Text> of 1 unit between
        signals of the same character, 3 between letters and 7 between words
        ({' '}
        <Text code>1200 / WPM</Text> ms per unit in the PARIS standard). Here
        the symbols are just the written notation. When converting{' '}
        <Text strong>from</Text> text, characters outside the table (e.g.
        accented letters, since <Text code>í = I</Text> and{' '}
        <Text code>ú = U</Text> in Morse) are dropped and counted. When
        converting <Text strong>to</Text> text, invalid sequences become{' '}
        <Text code>?</Text>. Always listen to the result before trusting
        hand-decoded Morse — letter spacing is easy to get wrong.
      </>
    ),
    tabEncode: 'Encode (text → Morse)',
    tabDecode: 'Decode (Morse → text)',
    textInput: 'Original text',
    textPlaceholder: 'Type (or paste) the text to encode…',
    morsesInput: 'Morse input',
    morsesPlaceholder: 'Dot, dash and space:  . .-  /  -- --- .-. ... .   (accepts "·" and "/" or "|" as word separator)',
    examples: 'Examples',
    outputMorse: 'Generated Morse',
    outputText: 'Decoded text',
    emptyPlaceholder: 'Output appears here…',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    ignored: (n) => `${n} character(s) outside the table ignored`,
    unknown: (n) => `${n} unknown sequence(s) → "?"`,
    statChars: 'characters',
    statSymbols: 'signals',
    statWords: 'words',
    statTokens: 'sequences (letters)',
    statLetters: 'letters',
    statDuration: 'estimated duration',
    playback: 'Play Morse',
    playbackHint: 'Hear the code (Web Audio) and watch the lamp follow. Duration uses the speed below.',
    wpm: 'Speed',
    wpmHint: (w) => `WPM (${w} ms per unit)`,
    play: 'Play',
    stop: 'Stop',
    playing: 'Playing…',
    durationMs: (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`),
    refTitle: 'Reference table (international code)',
    refLetters: 'Letters',
    refDigits: 'Numbers',
    refPunct: 'Punctuation and symbols',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/morse.js. textToMorse uppercases, splits into words, swaps each character for its code and joins letters with spaces and words with " / ", counting the dropped ones. morseToText is tolerant: it accepts "·" in place of ".", extra spaces/newlines and "/" or "|" as word separator, mapping through a reverse table and marking unknowns with "?". buildPlaybackTimeline builds the playback timeline from the PARIS rule — unit = 1200/WPM ms, dit 1 unit, dah 3, silence of 1 between signals, 3 between letters and 7 between words — and timelineDurationMs sums the events to estimate the duration.',
  },
}

const fmtMs = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`)

function RefGrid({ title, chars }) {
  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>{title}</Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chars.map((ch) => (
          <div
            key={ch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              background: '#fafafa',
            }}
          >
            <Text strong>{ch}</Text>
            <Text code style={{ fontSize: 12 }}>{MORSE[ch]}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MorseConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [tab, setTab] = useState('encode')
  const [text, setText] = useState('')
  const [morseInput, setMorseInput] = useState('')
  const [wpm, setWpm] = useState(15)

  const [playing, setPlaying] = useState(false)
  const [lamp, setLamp] = useState(false)
  const playingRef = useRef(false)
  const stepTimer = useRef(null)
  const audioRef = useRef(null)

  const encodeResult = useMemo(() => textToMorse(text), [text])
  const decodeResult = useMemo(() => morseToText(morseInput), [morseInput])

  const playbackMorse = tab === 'encode' ? encodeResult.morse : morseInput
  const timeline = useMemo(
    () => buildPlaybackTimeline(playbackMorse, wpm),
    [playbackMorse, wpm]
  )
  const durationMs = useMemo(() => timelineDurationMs(timeline), [timeline])
  const unit = unitMs(wpm)

  const countWords = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0)
  const countSymbols = (m) => m.replace(/[^.-]/g, '').length

  const stopPlayback = useRef(() => {})
  stopPlayback.current = () => {
    playingRef.current = false
    if (stepTimer.current) {
      clearTimeout(stepTimer.current)
      stepTimer.current = null
    }
    if (audioRef.current) {
      try {
        audioRef.current.osc.stop()
        audioRef.current.gain.disconnect()
        audioRef.current.osc.disconnect()
        audioRef.current.ctx.close()
      } catch {
        // AudioContext já fechado ou não iniciado — nada a fazer
      }
      audioRef.current = null
    }
    setLamp(false)
    setPlaying(false)
  }

  useEffect(() => () => stopPlayback.current(), [])

  const step = () => {
    const a = audioRef.current
    if (!a || !playingRef.current) return
    if (a.i >= a.timeline.length) {
      stopPlayback.current()
      return
    }
    const ev = a.timeline[a.i]
    a.gain.gain.setValueAtTime(ev.on ? 0.16 : 0, a.ctx.currentTime)
    setLamp(ev.on)
    a.i += 1
    stepTimer.current = setTimeout(step, ev.ms)
  }

  const startPlayback = () => {
    if (!playbackMorse || playingRef.current) return
    stopPlayback.current()
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 660
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    if (ctx.state === 'suspended') ctx.resume()
    audioRef.current = { ctx, osc, gain, i: 0, timeline }
    playingRef.current = true
    setPlaying(true)
    step()
  }

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SoundOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'encode',
            label: t.tabEncode,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card title={t.textInput}>
                  <TextArea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t.textPlaceholder}
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    showCount
                  />
                  <Space wrap style={{ marginTop: 12 }}>
                    {t.examples}:&nbsp;
                    {ENCODE_EXAMPLES.map((ex) => (
                      <Tag
                        key={ex}
                        color="processing"
                        style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                        onClick={() => setText(ex)}
                      >
                        <Text code style={{ color: 'inherit' }}>{ex}</Text>
                      </Tag>
                    ))}
                  </Space>
                </Card>

                <Card
                  title={t.outputMorse}
                  extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(encodeResult.morse)} disabled={!encodeResult.morse}>{t.copy}</Button>}
                >
                  {encodeResult.morse ? (
                    <pre style={{ margin: 0, overflowX: 'auto' }}>
                      <code>{encodeResult.morse}</code>
                    </pre>
                  ) : (
                    <Text type="secondary">{t.emptyPlaceholder}</Text>
                  )}
                  <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
                    <Tag>{countWords(text)} {t.statWords}</Tag>
                    <Tag>{text.length} {t.statChars}</Tag>
                    <Tag color="blue">{countSymbols(encodeResult.morse)} {t.statSymbols}</Tag>
                    {encodeResult.ignored > 0 && <Tag color="orange">{t.ignored(encodeResult.ignored)}</Tag>}
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: 'decode',
            label: t.tabDecode,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card title={t.morsesInput}>
                  <TextArea
                    value={morseInput}
                    onChange={(e) => setMorseInput(e.target.value)}
                    placeholder={t.morsesPlaceholder}
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    showCount
                  />
                  <Space wrap style={{ marginTop: 12 }}>
                    {t.examples}:&nbsp;
                    {DECODE_EXAMPLES.map((ex) => (
                      <Tag
                        key={ex}
                        color="processing"
                        style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                        onClick={() => setMorseInput(ex)}
                      >
                        <Text code style={{ color: 'inherit' }}>{ex}</Text>
                      </Tag>
                    ))}
                  </Space>
                </Card>

                <Card
                  title={t.outputText}
                  extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(decodeResult.text)} disabled={!morseInput.trim()}>{t.copy}</Button>}
                >
                  {morseInput.trim() ? (
                    <Paragraph strong style={{ fontSize: 18, marginBottom: 0 }}>
                      {decodeResult.text}
                    </Paragraph>
                  ) : (
                    <Text type="secondary">{t.emptyPlaceholder}</Text>
                  )}
                  <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
                    <Tag color="blue">{countSymbols(morseInput)} {t.statSymbols}</Tag>
                    <Tag>{decodeResult.text.length} {t.statLetters}</Tag>
                    {decodeResult.unknown > 0 && <Tag color="orange">{t.unknown(decodeResult.unknown)}</Tag>}
                  </Space>
                </Card>
              </Space>
            ),
          },
        ]}
      />

      <Card title={t.playback}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" wrap>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: lamp ? '#52c41a' : '#d9d9d9',
                boxShadow: lamp ? '0 0 14px 4px rgba(82, 196, 26, 0.55)' : 'none',
                transition: 'background 0.05s ease',
                flexShrink: 0,
              }}
            />
            <Button
              type="primary"
              icon={playing ? <StopOutlined /> : <SoundOutlined />}
              onClick={playing ? stopPlayback.current : startPlayback}
              disabled={!playbackMorse}
            >
              {playing ? t.stop : t.play}
            </Button>
            <Text type="secondary">
              {playing ? `● ${t.playing}` : (
                playbackMorse
                  ? `${t.statDuration}: ${fmtMs(durationMs)} · ${unit} ms`
                  : t.playbackHint
              )}
            </Text>
          </Space>
          <Space direction="vertical" style={{ width: '100%', maxWidth: 420 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>{t.wpm} (PARIS)</Text>
              <Text code>{wpm} WPM · {unit} ms</Text>
            </Space>
            <Slider min={5} max={40} value={wpm} onChange={setWpm} />
          </Space>
        </Space>
      </Card>

      <Card title={t.refTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <RefGrid title={t.refLetters} chars={ALPHA} />
          <RefGrid title={t.refDigits} chars={DIGITS} />
          <RefGrid title={t.refPunct} chars={PUNCT} />
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — textToMorse / morseToText / buildPlaybackTimeline`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{textToMorse.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}