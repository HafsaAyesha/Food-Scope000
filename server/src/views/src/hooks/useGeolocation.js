import { useState, useCallback, useEffect, useRef } from 'react'

const GEO_CACHE_KEY = 'foodscope_geo_position'
const CACHE_TTL_MS = 10 * 60 * 1000
const LOW_ACCURACY_OPTIONS = { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
const HIGH_ACCURACY_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }

const loadCachedPosition = () => {
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.timestamp !== 'number' || Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(GEO_CACHE_KEY)
      return null
    }
    const { lat, lng } = parsed.position || {}
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      sessionStorage.removeItem(GEO_CACHE_KEY)
      return null
    }
    return parsed.position
  } catch {
    return null
  }
}

const storeCachedPosition = (position) => {
  try {
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ position, timestamp: Date.now() }))
  } catch {
    // Ignore write failures in private browsing modes
  }
}

const formatError = (error) => {
  if (!error) return { code: 'UNKNOWN', message: 'Unable to retrieve your location.' }
  switch (error.code) {
    case 1:
      return { code: 'GEO_PERMISSION_DENIED', message: 'Location access was denied. Please enable location permissions or use manual search.' }
    case 2:
      return { code: 'GEO_UNAVAILABLE', message: 'Location services are unavailable on this device.' }
    case 3:
      return { code: 'GEO_TIMEOUT', message: 'Location request timed out. Try again or use a manual fallback.' }
    default:
      return { code: 'GEO_UNKNOWN_ERROR', message: error.message || 'Could not determine your location.' }
  }
}

const isValidCoordinate = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

export function useGeolocation() {
  const [status, setStatus] = useState('idle')
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [isRetryable, setIsRetryable] = useState(false)
  const [source, setSource] = useState('browser')
  const [attempts, setAttempts] = useState(0)
  const mounted = useRef(true)
  const retryTimer = useRef(null)

  useEffect(() => {
    mounted.current = true
    const cached = loadCachedPosition()
    if (cached) {
      setPosition(cached)
      setStatus('success')
      setSource('cache')
    }
    return () => {
      mounted.current = false
      if (retryTimer.current) {
        clearTimeout(retryTimer.current)
      }
    }
  }, [])

  const setStateSafe = useCallback((payload) => {
    if (!mounted.current) return
    if (payload.status !== undefined) setStatus(payload.status)
    if (payload.position !== undefined) setPosition(payload.position)
    if (payload.error !== undefined) setError(payload.error)
    if (payload.message !== undefined) setMessage(payload.message)
    if (payload.isRetryable !== undefined) setIsRetryable(payload.isRetryable)
    if (payload.source !== undefined) setSource(payload.source)
    if (payload.attempts !== undefined) setAttempts(payload.attempts)
  }, [])

  const completeSuccess = useCallback((pos, usedSource = 'browser') => {
    const coords = pos.coords || pos
    const position = { lat: coords.latitude, lng: coords.longitude }
    storeCachedPosition(position)
    setStateSafe({ status: 'success', position, error: null, message: '', isRetryable: false, source: usedSource })
  }, [setStateSafe])

  const handlePositionError = useCallback((errorEvent, attemptCount) => {
    const geoError = formatError(errorEvent)
    const retryable = errorEvent.code !== 1
    setStateSafe({
      status: errorEvent.code === 1 ? 'denied' : 'error',
      error: geoError,
      message: geoError.message,
      isRetryable: retryable,
      source: 'browser',
      attempts: attemptCount
    })
  }, [setStateSafe])

  const callGeolocation = useCallback((options, onSuccess, onError) => {
    if (!navigator.geolocation) {
      onError({ code: 3, message: 'Browser geolocation is not supported.' })
      return
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
  }, [])

  const requestLocation = useCallback(() => {
    if (status === 'loading') return

    setStateSafe({ status: 'loading', error: null, message: 'Checking your location…', isRetryable: false })
    const attempt = attempts + 1
    setAttempts(attempt)

    callGeolocation(LOW_ACCURACY_OPTIONS, (pos) => {
      if (!isValidCoordinate(pos.coords.latitude, -90, 90) || !isValidCoordinate(pos.coords.longitude, -180, 180)) {
        handlePositionError({ code: 2, message: 'Invalid coordinates returned from device.' }, attempt)
        return
      }

      const accuracy = Number(pos.coords.accuracy || 9999)
      if (accuracy > 150 && attempt === 1) {
        setStateSafe({ status: 'loading', message: 'Location is imprecise, requesting higher accuracy…', isRetryable: true })
        callGeolocation(HIGH_ACCURACY_OPTIONS, completeSuccess, (errorEvent) => handlePositionError(errorEvent, attempt))
        return
      }

      completeSuccess(pos, 'browser')
    }, (errorEvent) => handlePositionError(errorEvent, attempt))
  }, [attempts, callGeolocation, completeSuccess, handlePositionError, setStateSafe, status])

  const retry = useCallback(() => {
    const nextAttempts = attempts + 1
    const delay = Math.min(8000, 1000 * 2 ** (nextAttempts - 1))
    setStateSafe({ status: 'retrying', message: `Retrying location in ${delay / 1000}s…`, isRetryable: false, attempts: nextAttempts })
    retryTimer.current = setTimeout(() => {
      if (!mounted.current) return
      requestLocation()
    }, delay)
  }, [attempts, requestLocation, setStateSafe])

  const setManualLocation = useCallback((value) => {
    const parsedLat = Number(value.lat)
    const parsedLng = Number(value.lng)
    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      setStateSafe({ status: 'error', error: { code: 'GEO_INVALID_MANUAL_LOCATION', message: 'Manual location must use valid latitude and longitude.' }, message: 'Invalid manual location.', isRetryable: false, source: 'manual' })
      return
    }

    const position = { lat: parsedLat, lng: parsedLng }
    storeCachedPosition(position)
    setStateSafe({ status: 'fallback', position, error: null, message: value.label ? `Using manual location: ${value.label}` : 'Manual location selected.', isRetryable: false, source: 'manual' })
  }, [setStateSafe])

  const clearLocation = useCallback(() => {
    sessionStorage.removeItem(GEO_CACHE_KEY)
    setStateSafe({ status: 'idle', position: null, error: null, message: '', isRetryable: false, source: 'browser', attempts: 0 })
  }, [setStateSafe])

  return {
    status,
    position,
    error,
    message,
    isRetryable,
    source,
    attempts,
    requestLocation,
    retry,
    setManualLocation,
    clearLocation
  }
}
