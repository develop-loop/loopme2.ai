'use client'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo</h1>
          <p className="text-gray-600">Interactive product demonstration</p>
        </header>

        <main>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Product Demo</h2>
            <p className="text-gray-600">Demo content coming soon...</p>
          </div>
        </main>
      </div>
    </div>
  )
}