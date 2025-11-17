// Bottom navigation for mobile devices
// Shows the main sections in a compact bottom bar (like Twitter mobile app)

'use client'

import { Home, Users, Plus, Briefcase, User, Newspaper } from 'lucide-react'
import { useState } from 'react'

export default function MobileBottomNav() {
  // Track the currently active tab
  const [activeTab, setActiveTab] = useState('home')
  const [showReportModal, setShowReportModal] = useState(false)

  // Define bottom nav items
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'news', icon: Newspaper, label: 'News' },
    { id: 'schemes', icon: Briefcase, label: 'Schemes' },
    { id: 'profile', icon: User, label: 'Profile' },
  ]

  return (
    <>
      <nav className="bg-white border-t border-gray-200 flex justify-around items-center py-2 pb-4 px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded transition ${
                isActive ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              <IconComponent size={24} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <button
        onClick={() => setShowReportModal(!showReportModal)}
        className="fixed bottom-24 right-4 md:hidden w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition z-50"
        title="Report an issue"
      >
        <Plus size={28} />
      </button>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setShowReportModal(false)} />
      )}
    </>
  )
}
