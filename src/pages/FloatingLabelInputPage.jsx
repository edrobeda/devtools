import React from 'react'
import { Typography, Card, Space } from 'antd'
import { FormOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const styleTag = `
.devtools-fl-field {
  position: relative;
  margin-top: 8px;
}
.devtools-fl-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 18px 12px 6px;
  font-size: 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  outline: none;
  background: #fff;
  transition: border-color 0.15s ease;
}
.devtools-fl-field input:focus {
  border-color: #1677ff;
}
.devtools-fl-field label {
  position: absolute;
  left: 12px;
  top: 14px;
  font-size: 14px;
  color: #8c8c8c;
  pointer-events: none;
  transform-origin: left top;
  transition: transform 0.15s ease, color 0.15s ease, top 0.15s ease;
}
/* placeholder=" " (espaço) é o truque: :placeholder-shown só é true
   quando o campo está vazio E sem foco não altera isso, então
   combinamos com :focus pra cobrir os dois gatilhos */
.devtools-fl-field input:focus + label,
.devtools-fl-field input:not(:placeholder-shown) + label {
  top: 6px;
  transform: scale(0.75);
}
.devtools-fl-field input:focus + label {
  color: #1677ff;
}
`

const sourceCode = `/* CSS */
.field { position: relative; margin-top: 8px; }

.field input {
  width: 100%;
  box-sizing: border-box;
  padding: 18px 12px 6px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  outline: none;
}
.field input:focus { border-color: #1677ff; }

.field label {
  position: absolute;
  left: 12px;
  top: 14px;
  color: #8c8c8c;
  pointer-events: none;
  transform-origin: left top;
  transition: transform 0.15s ease, color 0.15s ease, top 0.15s ease;
}

/* o pulo do gato: placeholder=" " (um espaço) faz o input SEMPRE ter
   "conteúdo" pro :placeholder-shown, então ele só permanece true
   quando o value está realmente vazio */
.field input:focus + label,
.field input:not(:placeholder-shown) + label {
  top: 6px;
  transform: scale(0.75);
}
.field input:focus + label { color: #1677ff; }

<!-- HTML — a ordem importa: input vem ANTES do label pro seletor + funcionar -->
<div class="field">
  <input type="text" placeholder=" " />
  <label>Nome</label>
</div>`

const translations = {
  pt: {
    title: 'Componente: Input com Label Flutuante',
    intro: (
      <>
        Padrão clássico de "floating label" feito só com CSS, sem
        JavaScript: o label começa sobreposto ao texto do input e sobe/
        encolhe quando o campo ganha foco ou já tem conteúdo. O truque é
        usar <Text code>placeholder=" "</Text> (um espaço) — isso faz o
        seletor <Text code>:not(:placeholder-shown)</Text> disparar assim
        que o usuário digita algo, mesmo sem foco, e o combinador irmão{' '}
        <Text code>input + label</Text> só funciona se o label vier{' '}
        <Text code>depois</Text> do input no HTML.
      </>
    ),
    demoTitle: 'Demonstração (clique nos campos, digite algo)',
    sourceTitle: 'Código-fonte',
    name: 'Nome',
    email: 'E-mail',
  },
  en: {
    title: 'Component: Floating Label Input',
    intro: (
      <>
        Classic "floating label" pattern built with pure CSS, no
        JavaScript: the label starts overlapping the input's text and
        floats up/shrinks once the field gets focus or already has
        content. The trick is using <Text code>placeholder=" "</Text> (a
        single space) — that makes the{' '}
        <Text code>:not(:placeholder-shown)</Text> selector fire as soon as
        the user types something, even without focus, and the sibling
        combinator <Text code>input + label</Text> only works if the label
        comes <Text code>after</Text> the input in the HTML.
      </>
    ),
    demoTitle: 'Demo (click the fields, type something)',
    sourceTitle: 'Source code',
    name: 'Name',
    email: 'Email',
  },
}

export default function FloatingLabelInputPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><FormOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 360 }}>
          <div className="devtools-fl-field">
            <input type="text" placeholder=" " id="devtools-fl-name" />
            <label htmlFor="devtools-fl-name">{t.name}</label>
          </div>
          <div className="devtools-fl-field">
            <input type="email" placeholder=" " id="devtools-fl-email" />
            <label htmlFor="devtools-fl-email">{t.email}</label>
          </div>
        </Space>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
