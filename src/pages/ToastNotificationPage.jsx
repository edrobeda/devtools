import React, { useCallback, useRef, useState } from 'react'
import { Typography, Card, Space, Button } from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const VARIANTS = {
  success: { color: '#52c41a', icon: <CheckCircleOutlined /> },
  error: { color: '#ff4d4f', icon: <CloseCircleOutlined /> },
  info: { color: '#1677ff', icon: <InfoCircleOutlined /> },
  warning: { color: '#faad14', icon: <WarningOutlined /> },
}

const DURATION_MS = 4000

const styleTag = `
@keyframes devtools-toast-slide-in {
  from { transform: translateX(110%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes devtools-toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
.devtools-toast-viewport {
  position: relative;
  min-height: 220px;
  border-radius: 8px;
  overflow: hidden;
  padding: 16px;
}
.devtools-toast-stack {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 300px;
}
.devtools-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: devtools-toast-slide-in 280ms cubic-bezier(0.22, 1, 0.36, 1);
}
.devtools-toast .icon {
  font-size: 18px;
  margin-top: 1px;
}
.devtools-toast .message {
  flex: 1;
  font-size: 13px;
  color: #1f1f1f;
}
.devtools-toast .close {
  cursor: pointer;
  color: #999;
  font-size: 12px;
  margin-top: 2px;
}
.devtools-toast .close:hover {
  color: #333;
}
.devtools-toast .progress-track {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: rgba(0, 0, 0, 0.08);
}
.devtools-toast .progress-bar {
  height: 100%;
  animation-name: devtools-toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
`

const sourceCode = `/* CSS */
@keyframes toast-slide-in {
  from { transform: translateX(110%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
.toast {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(0,0,0,.15);
  overflow: hidden;
  animation: toast-slide-in 280ms cubic-bezier(.22,1,.36,1);
}
.toast .progress-track { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; background: rgba(0,0,0,.08); }
.toast .progress-bar {
  height: 100%;
  animation: toast-progress var(--duration) linear forwards;
}

// React
function Toast({ toast, onClose }) {
  return (
    <div className="toast">
      <span style={{ color: toast.color }}>{toast.icon}</span>
      <span className="message">{toast.message}</span>
      <span className="close" onClick={() => onClose(toast.id)}>✕</span>
      <div className="progress-track">
        <div
          className="progress-bar"
          style={{ background: toast.color, '--duration': \`\${toast.durationMs}ms\` }}
        />
      </div>
    </div>
  )
}

// Cada toast tem seu próprio setTimeout pra se auto-remover do array de
// estado depois de durationMs — a barra de progresso é só CSS acompanhando
// o mesmo tempo, sem precisar de rAF/interval no JS.
function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = (toast) => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, ...toast }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, toast.durationMs)
  }
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id))
  return { toasts, push, dismiss }
}`

const translations = {
  pt: {
    title: 'Componente: Toast com Barra de Auto-Dismiss',
    intro: (
      <>
        Notificação estilo "toast" que entra deslizando e some sozinha após
        um tempo, com uma barra de progresso na base indicando visualmente
        quanto falta pra fechar. A barra é pura <Text code>@keyframes</Text>{' '}
        de largura sincronizada por <Text code>animation-duration</Text> — o
        JS só cuida de empilhar/remover o toast do array de estado no mesmo
        intervalo, via <Text code>setTimeout</Text> individual por item.
        Diferente do <Text code>Skeleton Shimmer</Text> e do{' '}
        <Text code>Dark Mode Toggle</Text> já existentes, aqui o foco é
        composição de vários itens empilhados com saída temporizada.
      </>
    ),
    demoTitle: 'Demonstração',
    demoDesc: 'Dispare toasts de tipos diferentes — cada um fecha sozinho em 4 segundos, ou clique no ✕ pra fechar na hora:',
    sourceTitle: 'Código-fonte',
    fireSuccess: 'Sucesso',
    fireError: 'Erro',
    fireInfo: 'Info',
    fireWarning: 'Aviso',
    messages: {
      success: 'Alterações salvas com sucesso.',
      error: 'Falha ao salvar. Tente novamente.',
      info: 'Nova versão disponível.',
      warning: 'Sua sessão expira em 5 minutos.',
    },
  },
  en: {
    title: 'Component: Toast with Auto-Dismiss Progress Bar',
    intro: (
      <>
        A "toast" notification that slides in and disappears on its own
        after a while, with a progress bar at the bottom visually showing
        how much time is left before it closes. The bar is pure{' '}
        <Text code>@keyframes</Text> width sync'd via{' '}
        <Text code>animation-duration</Text> — the JS only pushes/removes
        the toast from the state array on the same interval, via a
        per-item <Text code>setTimeout</Text>. Unlike the existing{' '}
        <Text code>Skeleton Shimmer</Text> and <Text code>Dark Mode Toggle</Text>,
        the focus here is composing several stacked items with timed exit.
      </>
    ),
    demoTitle: 'Demo',
    demoDesc: 'Fire toasts of different types — each closes on its own after 4 seconds, or click ✕ to close it immediately:',
    sourceTitle: 'Source code',
    fireSuccess: 'Success',
    fireError: 'Error',
    fireInfo: 'Info',
    fireWarning: 'Warning',
    messages: {
      success: 'Changes saved successfully.',
      error: 'Failed to save. Please try again.',
      info: 'A new version is available.',
      warning: 'Your session expires in 5 minutes.',
    },
  },
}

function useToasts() {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const push = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((t) => [...t, { id, type, message }])
    timers.current[id] = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
      delete timers.current[id]
    }, DURATION_MS)
  }, [])

  return { toasts, push, dismiss }
}

export default function ToastNotificationPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const { toasts, push, dismiss } = useToasts()

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <style>{styleTag}</style>
      <Title level={2}><BellOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Text type="secondary">{t.demoDesc}</Text>
        <div style={{ marginTop: 12 }}>
          <Space wrap>
            <Button onClick={() => push('success', t.messages.success)} style={{ color: VARIANTS.success.color, borderColor: VARIANTS.success.color }}>
              {t.fireSuccess}
            </Button>
            <Button onClick={() => push('error', t.messages.error)} style={{ color: VARIANTS.error.color, borderColor: VARIANTS.error.color }}>
              {t.fireError}
            </Button>
            <Button onClick={() => push('info', t.messages.info)} style={{ color: VARIANTS.info.color, borderColor: VARIANTS.info.color }}>
              {t.fireInfo}
            </Button>
            <Button onClick={() => push('warning', t.messages.warning)} style={{ color: VARIANTS.warning.color, borderColor: VARIANTS.warning.color }}>
              {t.fireWarning}
            </Button>
          </Space>
        </div>

        <div className="devtools-toast-viewport" style={{ background: 'repeating-linear-gradient(45deg, #fafafa, #fafafa 10px, #f0f0f0 10px, #f0f0f0 20px)' }}>
          <div className="devtools-toast-stack">
            {toasts.map((toast) => {
              const variant = VARIANTS[toast.type]
              return (
                <div key={toast.id} className="devtools-toast">
                  <span className="icon" style={{ color: variant.color }}>{variant.icon}</span>
                  <span className="message">{toast.message}</span>
                  <CloseOutlined className="close" onClick={() => dismiss(toast.id)} />
                  <div className="progress-track">
                    <div
                      className="progress-bar"
                      style={{
                        background: variant.color,
                        animationDuration: `${DURATION_MS}ms`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
