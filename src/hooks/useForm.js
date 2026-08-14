import { useCallback, useMemo, useState } from 'react'

export default function useForm(options = {}) {
  const { initialValues = {}, validate, onSubmit } = options

  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errors = useMemo(() => {
    if (typeof validate !== 'function') return {}
    return validate(values) || {}
  }, [values, validate])

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors])

  const setValue = useCallback((name, next) => {
    setValues((prev) => ({ ...prev, [name]: next }))
  }, [])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setValue(name, type === 'checkbox' ? checked : value)
  }, [setValue])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  const setTouchedField = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const handleSubmit = useCallback(
    async (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault()
      }

      // Marca todos os campos como tocados para exibir erros pendentes.
      setTouched(
        Object.keys(values).reduce((acc, key) => {
          acc[key] = true
          return acc
        }, {})
      )

      if (!isValid) return

      setIsSubmitting(true)
      try {
        await onSubmit?.(values)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, isValid, onSubmit]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    handleChange,
    handleBlur,
    setTouchedField,
    reset,
    handleSubmit,
  }
}
