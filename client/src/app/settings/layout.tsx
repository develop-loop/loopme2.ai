'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navigation = [
  { name: 'Git', href: '/settings/git', icon: '🔗' },
  { name: 'Explore', href: '/settings/explore', icon: '🔍' },
  { name: 'User', href: '/settings/user', icon: '👤' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your application settings and preferences</p>
        </div>

        {/* Main Content - Left Right Layout */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex">
            {/* Left Sidebar - Navigation */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={classNames(
                      pathname === item.href
                        ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-l-md w-full transition-colors'
                    )}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 min-w-0">
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}