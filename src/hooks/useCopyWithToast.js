import { useCallback } from 'react'
import { message } from 'antd'

// Copia um texto para o clipboard e mostra o toast de sucesso.
// Usado pelas paginas de gerador de /devops/ no botao "Copiar" da saida
// gerada (o feedback continua sendo o `message` estatico do antd).
export default function useCopyWithToast(text, successMessage) {
  return useCallback(() => {
    navigator.clipboard.writeText(text)
    message.success(successMessage)
  }, [text, successMessage])
}
