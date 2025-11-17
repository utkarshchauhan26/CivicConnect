// Left sidebar navigation for desktop
// Shows main navigation items like Home, Community, Report, Schemes, Profile

'use client'

import { Home, Users, AlertCircle, Briefcase, User, LogOut, Newspaper } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  // Track which nav item is currently active/selected
  const [activeNav, setActiveNav] = useState('home')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch current user ID
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUserId(data.user._id)
        }
      })
      .catch(err => console.error('Failed to fetch user:', err))
  }, [])

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Define all the navigation items and their icons
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'report', label: 'Report Issue', icon: AlertCircle },
    { id: 'schemes', label: 'Schemes', icon: Briefcase },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="p-4 h-full flex flex-col justify-between">
      {/* Top section with nav items */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-8 pl-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            CC
          </div>
          <span className="font-bold text-xl">CivicConnect</span>
        </div>

        {/* Navigation items */}
        {navItems.map((item) => {
          const IconComponent = item.icon
          const isActive = activeNav === item.id

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id)
                if (item.id === 'schemes') {
                  router.push('/schemes')
                } else if (item.id === 'home') {
                  router.push('/')
                } else if (item.id === 'news') {
                  router.push('/news')
                } else if (item.id === 'profile' && currentUserId) {
                  router.push(`/profile/${currentUserId}`)
                }
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <IconComponent size={20} />
              <span className="font-semibold text-lg">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Bottom section with post button and logout */}
      <div className="space-y-4">
        {/* Large button to create a new issue */}
        <button className="w-full bg-blue-500 text-white font-bold py-3 rounded-full text-lg hover:bg-blue-600 transition">
          Post Issue
        </button>

        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-full transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
