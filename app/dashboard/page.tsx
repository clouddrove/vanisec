'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  totalCreated: number
  totalViewed: number
  hourlyCreated: Array<{ hour: string; count: number }>
  hourlyViewed: Array<{ hour: string; count: number }>
  dailyCreated: Array<{ date: string; count: number }>
  dailyViewed: Array<{ date: string; count: number }>
  activeSecrets: number
}

export default function Dashboard() {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [storedToken, setStoredToken] = useState<string | null>(null)
  const [authError, setAuthError] = useState('')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(7)

  // Check for token in URL or localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    const localToken = localStorage.getItem('dashboard_token')
    
    if (urlToken) {
      // Store token from URL and remove from URL
      localStorage.setItem('dashboard_token', urlToken)
      setStoredToken(urlToken)
      // Clean up URL
      router.replace('/dashboard')
    } else if (localToken) {
      setStoredToken(localToken)
    }
  }, [router])

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setAuthError('Please enter a token')
      return
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_token', token)
    }
    setStoredToken(token)
    setAuthError('')
    setToken('')
  }

  const fetchAnalytics = async () => {
    if (!storedToken) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/analytics?days=${days}&token=${encodeURIComponent(storedToken)}`)
      if (response.status === 401) {
        // Token invalid, clear it
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dashboard_token')
        }
        setStoredToken(null)
        setAuthError('Invalid token. Please enter a valid token.')
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (storedToken) {
      fetchAnalytics()
      // Refresh every 30 seconds
      const interval = setInterval(fetchAnalytics, 30000)
      return () => clearInterval(interval)
    }
  }, [days, storedToken])

  // Show authentication form if no token
  if (!storedToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-clouddrove-light/10 via-white to-clouddrove-dark/10 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border-2 border-clouddrove-light/30">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-clouddrove-dark to-clouddrove-light flex items-center justify-center shadow-lg mx-auto mb-4">
              <span className="text-white text-3xl font-bold">V</span>
            </div>
            <h1 className="text-2xl font-bold text-clouddrove-dark mb-2">Dashboard Access</h1>
            <p className="text-clouddrove-light">Enter your token to view analytics</p>
          </div>
          
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-semibold text-clouddrove-dark mb-2">
                Access Token
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  setAuthError('')
                }}
                className="w-full px-4 py-3 border-2 border-clouddrove-light/30 rounded-lg focus:outline-none focus:border-clouddrove-dark focus:ring-2 focus:ring-clouddrove-dark/20 transition-all"
                placeholder="Enter dashboard token"
                autoFocus
              />
              {authError && (
                <p className="mt-2 text-sm text-red-500">{authError}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-clouddrove-dark to-clouddrove-light text-white py-3 px-6 rounded-lg font-semibold hover:from-clouddrove-light hover:to-clouddrove-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-clouddrove-light/10 via-white to-clouddrove-dark/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clouddrove-dark mx-auto mb-4"></div>
          <p className="text-clouddrove-light">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-clouddrove-light/10 via-white to-clouddrove-dark/10">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-clouddrove-dark text-white px-6 py-2 rounded-lg hover:bg-clouddrove-light transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const maxHourlyCreated = Math.max(...analytics.hourlyCreated.map((h) => h.count), 1)
  const maxHourlyViewed = Math.max(...analytics.hourlyViewed.map((h) => h.count), 1)
  const maxDailyCreated = Math.max(...analytics.dailyCreated.map((d) => d.count), 1)
  const maxDailyViewed = Math.max(...analytics.dailyViewed.map((d) => d.count), 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-clouddrove-light/10 via-white to-clouddrove-dark/10 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-clouddrove-dark mb-2">Usage Dashboard</h1>
            <p className="text-clouddrove-light">Monitor how people are using Vanisec</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="px-4 py-2 border-2 border-clouddrove-light/30 rounded-lg focus:outline-none focus:border-clouddrove-dark bg-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-clouddrove-dark text-white rounded-lg hover:bg-clouddrove-light transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <p className="text-sm text-clouddrove-light mb-2">Total Created</p>
            <p className="text-3xl font-bold text-clouddrove-dark">{analytics.totalCreated.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <p className="text-sm text-clouddrove-light mb-2">Total Viewed</p>
            <p className="text-3xl font-bold text-clouddrove-dark">{analytics.totalViewed.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <p className="text-sm text-clouddrove-light mb-2">Active Secrets</p>
            <p className="text-3xl font-bold text-clouddrove-dark">{analytics.activeSecrets.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <p className="text-sm text-clouddrove-light mb-2">View Rate</p>
            <p className="text-3xl font-bold text-clouddrove-dark">
              {analytics.totalCreated > 0
                ? `${((analytics.totalViewed / analytics.totalCreated) * 100).toFixed(1)}%`
                : '0%'}
            </p>
          </div>
        </div>

        {/* Hourly Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <h2 className="text-xl font-bold text-clouddrove-dark mb-4">Secrets Created (Last 24 Hours)</h2>
            <div className="space-y-2">
              {analytics.hourlyCreated.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-clouddrove-light w-12">{item.hour}</span>
                  <div className="flex-1 bg-clouddrove-light/10 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-clouddrove-dark to-clouddrove-light h-full rounded-full transition-all"
                      style={{ width: `${(item.count / maxHourlyCreated) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-clouddrove-dark">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <h2 className="text-xl font-bold text-clouddrove-dark mb-4">Secrets Viewed (Last 24 Hours)</h2>
            <div className="space-y-2">
              {analytics.hourlyViewed.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-clouddrove-light w-12">{item.hour}</span>
                  <div className="flex-1 bg-clouddrove-light/10 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-clouddrove-light to-clouddrove-dark h-full rounded-full transition-all"
                      style={{ width: `${(item.count / maxHourlyViewed) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-clouddrove-dark">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <h2 className="text-xl font-bold text-clouddrove-dark mb-4">Secrets Created (Daily)</h2>
            <div className="space-y-3">
              {analytics.dailyCreated.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-sm text-clouddrove-light w-24">{item.date}</span>
                  <div className="flex-1 bg-clouddrove-light/10 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-clouddrove-dark to-clouddrove-light h-full rounded-full transition-all"
                      style={{ width: `${(item.count / maxDailyCreated) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-clouddrove-dark">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-clouddrove-light/30">
            <h2 className="text-xl font-bold text-clouddrove-dark mb-4">Secrets Viewed (Daily)</h2>
            <div className="space-y-3">
              {analytics.dailyViewed.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-sm text-clouddrove-light w-24">{item.date}</span>
                  <div className="flex-1 bg-clouddrove-light/10 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-clouddrove-light to-clouddrove-dark h-full rounded-full transition-all"
                      style={{ width: `${(item.count / maxDailyViewed) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-clouddrove-dark">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

