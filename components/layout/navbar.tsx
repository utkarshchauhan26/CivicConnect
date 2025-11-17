// Top navigation bar for the app
// Shows logo, search, and user actions on desktop
// On mobile, shows a minimal nav with logo

'use client'

import { Heart, Mail, Search, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Fetch current user from /api/auth/me
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(err => console.error('Failed to fetch user:', err))
  }, [])

  const handleProfileClick = () => {
    if (currentUser?._id) {
      router.push(`/profile/${currentUser._id}`)
    }
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between h-16">
      {/* Left side - Logo and CivicConnect title (desktop only) */}
      <div className="hidden md:flex items-center gap-2">
        
      </div>

      <div className="flex-1 max-w-md mx-2 md:mx-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-150 transition">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search issues..."
            className="bg-transparent outline-none flex-1 text-sm placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell icon */}
        <button className="text-gray-600 hover:text-blue-500 transition p-2 hover:bg-gray-100 rounded-full">
          <Bell size={20} />
        </button>
        
        {/* Saved/Bookmarks heart icon */}
        <button className="text-gray-600 hover:text-blue-500 transition p-2 hover:bg-gray-100 rounded-full">
          <Heart size={20} />
        </button>
        
        {/* Messages icon */}
        <button className="text-gray-600 hover:text-blue-500 transition p-2 hover:bg-gray-100 rounded-full">
          <Mail size={20} />
        </button>

        {/* User avatar - clickable to view profile */}
        <button
          onClick={handleProfileClick}
          className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full hover:opacity-80 transition flex items-center justify-center text-white font-bold text-sm"
          title={currentUser?.name || 'Profile'}
        >
          {currentUser?.avatar || currentUser?.name?.charAt(0).toUpperCase() || 'U'}
        </button>
      </div>
    </nav>
  )
}
