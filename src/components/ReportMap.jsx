import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function ReportMap({ reports, selectedReport, onSelectReport }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!mapRef.current) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([-24.5554, 25.9019], 10)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)
    }

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const validReports = reports.filter(r => r.lat && r.lng)
    
    validReports.forEach(report => {
      const color = report.status === 'fixed' ? '#4caf50' : report.status === 'in_progress' ? '#2196f3' : '#ff9800'
      const iconHtml = `<div style="background:${color};width:30px;height:30px;borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'bold',cursor:'pointer',border:'2px solid white',boxShadow:'0 2px 4px rgba(0,0,0,0.3)'">${report.mainCategory === 'Water & Sanitation' ? '💧' : report.mainCategory === 'Electricity' ? '⚡' : report.mainCategory === 'Roads & Potholes' ? '🛣️' : '📍'}</div>`
      
      const marker = L.marker([report.lat, report.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [30, 30],
          popupAnchor: [0, -15]
        })
      })
        .bindPopup(`<div style="fontSize:12px"><b>${report.subCategory}</b><br/>${report.district}<br/><small>${new Date(report.created_at).toLocaleDateString()}</small></div>`)
        .addTo(mapInstanceRef.current)

      marker.on('click', () => onSelectReport(report))
      markersRef.current.push(marker)
    })

    if (selectedReport && selectedReport.lat && selectedReport.lng) {
      mapInstanceRef.current.setView([selectedReport.lat, selectedReport.lng], 13)
    } else if (validReports.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [50, 50] })
    }
  }, [reports, selectedReport, onSelectReport])

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 8 }} />
}
