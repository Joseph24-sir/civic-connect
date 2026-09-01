import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement)

export default function AnalyticsDashboard({ reports }) {
  const [stats, setStats] = useState({
    totalReports: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0,
    byCategory: {},
    byDistrict: {},
    resolutionRate: 0
  })

  useEffect(() => {
    calculateStats()
  }, [reports])

  function calculateStats() {
    const byStatus = { fixed: 0, in_progress: 0, pending: 0 }
    const byCategory = {}
    const byDistrict = {}

    reports.forEach(r => {
      byStatus[r.status || 'pending']++
      byCategory[r.mainCategory] = (byCategory[r.mainCategory] || 0) + 1
      byDistrict[r.district] = (byDistrict[r.district] || 0) + 1
    })

    const resolutionRate = reports.length > 0 ? Math.round((byStatus.fixed / reports.length) * 100) : 0

    setStats({
      totalReports: reports.length,
      resolved: byStatus.fixed,
      inProgress: byStatus.in_progress,
      pending: byStatus.pending,
      byCategory,
      byDistrict,
      resolutionRate
    })
  }

  const statusData = {
    labels: ['Resolved', 'In Progress', 'Pending'],
    datasets: [{
      data: [stats.resolved, stats.inProgress, stats.pending],
      backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
      borderColor: '#fff',
      borderWidth: 2
    }]
  }

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])
  const categoryData = {
    labels: categoryEntries.map(([name]) => name),
    datasets: [{
      label: 'Reports by Category',
      data: categoryEntries.map(([, count]) => count),
      backgroundColor: '#2196f3',
      borderColor: '#1976d2',
      borderWidth: 1
    }]
  }

  const districtEntries = Object.entries(stats.byDistrict).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 12 }}>
      <h2 style={{ marginBottom: 20 }}>📊 ANALYTICS DASHBOARD</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#2196f3' }}>{stats.totalReports}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>TOTAL REPORTS</div>
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#4caf50' }}>{stats.resolved}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>RESOLVED</div>
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff9800' }}>{stats.pending}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>PENDING</div>
        </div>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#9c27b0' }}>{stats.resolutionRate}%</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>RESOLUTION RATE</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ marginBottom: 15 }}>Status Distribution</h4>
          <Pie data={statusData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h4 style={{ marginBottom: 15 }}>Reports by Category</h4>
          <div style={{ overflowX: 'auto' }}>
            <Line data={categoryData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h4 style={{ marginBottom: 15 }}>Reports by District</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {districtEntries.map(([district, count]) => (
            <div key={district} style={{ background: '#f5f5f5', padding: 15, borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{count}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 5 }}>{district}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
