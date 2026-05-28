import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:#e67e22;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const REST_ICON = (rating) => {
  const color = rating >= 4.5 ? '#27ae60' : rating >= 4 ? '#2980b9' : '#7f8c8d'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:13px;height:13px;
      background:${color};
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 1px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  })
}

export default function NearbyMap({ userPosition, restaurants, onSelectRestaurant }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const { lat, lng } = userPosition
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    L.marker([lat, lng], { icon: USER_ICON })
      .addTo(map)
      .bindTooltip('You are here', { permanent: false, direction: 'top' })

    mapRef.current = map
  }, [userPosition])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !restaurants.length) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const bounds = []
    const { lat: uLat, lng: uLng } = userPosition
    bounds.push([uLat, uLng])

    restaurants.forEach((r) => {
      const coords = r.location?.coordinates
      if (!coords) return
      const [lng, lat] = coords

      const marker = L.marker([lat, lng], { icon: REST_ICON(r.avg_rating || 0) })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:160px">
            <strong style="font-size:14px">${r.name}</strong><br/>
            <span style="color:#888;font-size:12px">${r.cuisine_type || ''}</span><br/>
            <span style="font-size:12px">⭐ ${r.avg_rating ? Number(r.avg_rating).toFixed(1) : '–'} &nbsp;·&nbsp; 📍 ${Number(r.distance_km).toFixed(1)} km</span><br/>
            <a href="/restaurants/${r.id || r._id}" style="color:#e67e22;font-size:12px;font-weight:600;text-decoration:none">View →</a>
          </div>`,
          { maxWidth: 220 }
        )
        .on('click', () => {
          if (onSelectRestaurant) onSelectRestaurant(r.id || r._id)
        })

      markersRef.current.push(marker)
      bounds.push([lat, lng])
    })

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [restaurants, userPosition, onSelectRestaurant])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', marginBottom: '24px' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '360px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(6px)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        color: '#555',
        boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27ae60', display: 'inline-block' }} />
          4.5+
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2980b9', display: 'inline-block' }} />
          4.0+
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7f8c8d', display: 'inline-block' }} />
          Below 4.0
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e67e22', display: 'inline-block' }} />
          You
        </span>
      </div>
    </div>
  )
}
