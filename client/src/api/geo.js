import client from './client'

export const getNearby = (params) => client.get('/geo/nearby', { params })
export const getIpLocation = () => client.get('/geo/location/ip')
export const resolveLocation = (query) => client.get('/geo/resolve', { params: { query } })
export const reverseGeocode = (lat, lng) => client.get('/geo/reverse', { params: { lat, lng } })
