export const createGridClusters = (points, resolutionMeters = 800) => {
  if (!Array.isArray(points) || points.length === 0) return []

  const metersPerDegreeLat = 111000
  const latStep = resolutionMeters / metersPerDegreeLat

  const clusters = points.reduce((acc, point) => {
    const lat = Number(point.lat)
    const lng = Number(point.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return acc

    const latBucket = Math.floor(lat / latStep)
    const lngBucket = Math.floor(lng / (resolutionMeters / (Math.cos((lat * Math.PI) / 180) * metersPerDegreeLat || metersPerDegreeLat)))
    const key = `${latBucket}:${lngBucket}`

    if (!acc[key]) {
      acc[key] = {
        count: 0,
        center: { lat: 0, lng: 0 },
        points: []
      }
    }

    acc[key].count += 1
    acc[key].center.lat += lat
    acc[key].center.lng += lng
    acc[key].points.push(point)
    return acc
  }, {})

  return Object.values(clusters).map((cluster) => ({
    count: cluster.count,
    center: {
      lat: cluster.center.lat / cluster.count,
      lng: cluster.center.lng / cluster.count
    },
    points: cluster.points
  }))
}

export const mapProviderConfig = (provider = 'mapbox') => {
  const providers = {
    mapbox: {
      name: 'Mapbox',
      tileUrl: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}@2x?access_token={accessToken}',
      attribution: '© Mapbox © OpenStreetMap',
      requiresKey: true
    },
    google: {
      name: 'Google Maps',
      scriptUrl: 'https://maps.googleapis.com/maps/api/js?key={apiKey}&libraries=places',
      requiresKey: true
    },
    osm: {
      name: 'OpenStreetMap',
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      requiresKey: false
    }
  }
  return providers[provider] || providers.osm
}
