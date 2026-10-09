import React from 'react'

// Texto de teste com as correspondências destacadas em <mark>. Recebe o array
// devolvido por findMatches (cada item tem { text, index }) e devolve o texto
// original quando não há matches.
export default function RegexHighlightedMatches({ text, matches }) {
  if (!text || !matches || !matches.length) return text
  const nodes = []
  let lastIndex = 0
  matches.forEach((m, i) => {
    if (m.index > lastIndex) {
      nodes.push(<span key={`t-${i}`}>{text.slice(lastIndex, m.index)}</span>)
    }
    nodes.push(
      <mark key={`m-${i}`} style={{ background: '#ffe58f', padding: '0 1px', borderRadius: 2 }}>
        {m.text}
      </mark>
    )
    lastIndex = m.index + m.text.length
  })
  if (lastIndex < text.length) nodes.push(<span key="tail">{text.slice(lastIndex)}</span>)
  return nodes
}
