// This is the main home page that displays the civic engagement feed
// Improved desktop/tablet/mobile breakpoints and spacing

import Navbar from '@/components/layout/navbar'
import Sidebar from '@/components/layout/sidebar'
import Feed from '@/components/feed/feed'
import RightSidebar from '@/components/layout/right-sidebar'
import MobileBottomNav from '@/components/layout/mobile-bottom-nav'

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      <div className="hidden md:flex w-60 border-r border-gray-200 flex-col bg-white">
        <Sidebar />
      </div>

      {/* Main content area - takes up available space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation bar - consistent across all screens */}
        <Navbar />

        {/* Main feed area with horizontal scroll for large screens */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto border-r border-gray-200">
            <Feed />
          </div>

          <div className="hidden lg:flex w-80 border-l border-gray-200 flex-col bg-white overflow-y-auto">
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation - only visible on small screens */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200">
        <MobileBottomNav />
      </div>
    </div>
  )
}
