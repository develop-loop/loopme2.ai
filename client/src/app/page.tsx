'use client'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TurboMe
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Next.js 15 + NestJS + TypeScript + Tailwind CSS + Headless UI
          </p>
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Frontend</h3>
              <p className="text-gray-600">Next.js with TypeScript and Tailwind CSS</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Backend</h3>
              <p className="text-gray-600">NestJS with RESTful APIs</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Shared Types</h3>
              <p className="text-gray-600">Type-safe communication between frontend and backend</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}