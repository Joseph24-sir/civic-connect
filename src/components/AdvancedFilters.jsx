import { useState } from 'react'
import { formatDate } from 'date-fns'

export default function AdvancedFilters({ reports, categories, municipalities, onFilterChange }) {
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    district: 'all',
    urgency: 'all',
    startDate: '',
    endDate: '',
    searchText: ''
  })

  function handleFilterChange(key, value) {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  function applyFilters(filterSet) {
    let filtered = [...reports]

    if (filterSet.status !== 'all') {
      filtered = filtered.filter(r => r.status === filterSet.status)
    }

    if (filterSet.category !== 'all') {
      filtered = filtered.filter(r => r.mainCategory === filterSet.category)
    }

    if (filterSet.district !== 'all') {
      filtered = filtered.filter(r => r.district === filterSet.district)
    }

    if (filterSet.urgency !== 'all') {
      filtered = filtered.filter(r => r.urgency === filterSet.urgency)
    }

    if (filterSet.startDate) {
      filtered = filtered.filter(r => new Date(r.created_at) >= new Date(filterSet.startDate))
    }

    if (filterSet.endDate) {
      filtered = filtered.filter(r => new Date(r.created_at) <= new Date(filterSet.endDate))
    }

    if (filterSet.searchText) {
      const search = filterSet.searchText.toLowerCase()
      filtered = filtered.filter(r =>
        r.subCategory?.toLowerCase().includes(search) ||
        r.description?.toLowerCase().includes(search) ||
        r.town?.toLowerCase().includes(search)
      )
    }

    onFilterChange(filtered)
  }

  function resetFilters() {
    const resetState = {
      status: 'all',
      category: 'all',
      district: 'all',
      urgency: 'all',
      startDate: '',
      endDate: '',
      searchText: ''
    }
    setFilters(resetState)
    applyFilters(resetState)
  }

  return (
    <div style={{ background: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>🔍 ADVANCED FILTERS</h3>
        <button
          onClick={resetFilters}
          style={{
            padding: '6px 12px',
            background: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ↺ Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 15 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5 }}>STATUS</label>
          <select
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="fixed">Resolved</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5 }}>CATEGORY</label>
          <select
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
          >
            <option value="all">All Categories</option>
            {Object.keys(categories || {}).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5 }}>DISTRICT</label>
          <select
            value={filters.district}
            onChange={e => handleFilterChange('district', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
          >
            <option value="all">All Districts</option>
            {Object.keys(municipalities || {}).map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5 }}>URGENCY</label>
          <select
            value={filters.urgency}
            onChange={e => handleFilterChange('urgency', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
          >
            <option value="all">All Urgencies</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5 }}>FROM DATE</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={e => handleFilterChange('startDate', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5 }}>TO DATE</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={e => handleFilterChange('endDate', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666', display: 'block', marginBottom: 5 }}>SEARCH</label>
        <input
          type="text"
          value={filters.searchText}
          onChange={e => handleFilterChange('searchText', e.target.value)}
          placeholder="Search by category, description, or location..."
          style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
        />
      </div>
    </div>
  )
}
