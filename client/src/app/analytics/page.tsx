'use client'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Get a better understanding of your traffic</p>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Visits</h3>
              <p className="text-2xl font-bold text-gray-900">12,345</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Page Views</h3>
              <p className="text-2xl font-bold text-gray-900">24,678</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bounce Rate</h3>
              <p className="text-2xl font-bold text-gray-900">45.2%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg. Session</h3>
              <p className="text-2xl font-bold text-gray-900">3:24</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Traffic Overview</h2>
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        </main>
      </div>
    </div>
  )
}