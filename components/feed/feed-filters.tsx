// Filter tabs at the top of the feed
// Allows sorting by Latest, Trending, Near You, and filtering by category

'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FeedFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export default function FeedFilters({
  activeFilter,
  onFilterChange,
}: FeedFiltersProps) {
  // Track category filter dropdown visibility
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Available filter tabs
  const filters = ['latest', 'trending', 'near-you']

  // Category options for filtering
  const categories = [
    '🚮 Sanitation',
    '💧 Water',
    '🏗️ Roads',
    '⚡ Electricity',
    '🏛️ Corruption',
    '🌳 Environment',
    '🔔 Emergency',
  ]

  return (
    <div className="top-16 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Filter tabs */}
      <div className="flex gap-4">
        {filters.map((filter) => {
          const isActive = activeFilter === filter
          const label = filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')

          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`pb-2 font-semibold transition border-b-2 ${
                isActive
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-600 hover:text-blue-400'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Category dropdown filter */}
      <div className="relative">
        <button
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1 rounded transition"
        >
          <span className="text-sm font-semibold">Category</span>
          <ChevronDown size={16} />
        </button>

        {/* Dropdown menu */}
        {showCategoryDropdown && (
          <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-sm"
                onClick={() => setShowCategoryDropdown(false)}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
