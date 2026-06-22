import { useState, useCallback } from 'react'
import { getErrorMessage } from '../utils/errors'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const request = useCallback(async (apiFn, fallbackMsg = 'Something went wrong.') => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFn()
      return res.data
    } catch (err) {
      setError(getErrorMessage(err, fallbackMsg))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, setError, request }
}
