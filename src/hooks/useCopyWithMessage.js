import { useCallback } from 'react'

// Copia um texto para o clipboard e mostra o toast de sucesso/erro.
// Diferente do useCopyWithToast (que usa o `message` estatico do antd e
// recebe o texto na criacao do hook), aqui o texto e dinamico por chamada e
// o feedback usa o `messageApi` criado com message.useMessage() na pagina.
export default function useCopyWithMessage(messageApi, t) {
  return useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [messageApi, t])
}
