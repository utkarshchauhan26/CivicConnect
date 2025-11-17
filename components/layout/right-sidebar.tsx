// Right sidebar for desktop - shows trending issues and suggested schemes
// Similar to Twitter's "What's happening" section

'use client'

export default function RightSidebar() {
  // Sample trending issues data
  const trendingIssues = [
    {
      id: 1,
      title: 'Pothole Repair Campaign',
      posts: '2.5K posts',
      category: '🏗️ Roads',
      upvotes: 1240,
      progress: 65,
    },
    {
      id: 2,
      title: 'Water Supply Issues',
      posts: '1.8K posts',
      category: '💧 Water',
      upvotes: 892,
      progress: 45,
    },
    {
      id: 3,
      title: 'Garbage Collection',
      posts: '1.2K posts',
      category: '🚮 Sanitation',
      upvotes: 654,
      progress: 72,
    },
    {
      id: 4,
      title: 'Street Lighting Project',
      posts: '890 posts',
      category: '⚡ Electricity',
      upvotes: 423,
      progress: 38,
    },
  ]

  // Sample schemes data
  const suggestedSchemes = [
    {
      id: 1,
      name: 'Urban Development Grant',
      description: 'For local infrastructure projects',
    },
    {
      id: 2,
      name: 'Community Fund',
      description: 'Support community initiatives',
    },
    {
      id: 3,
      name: 'Green Initiative',
      description: 'Environmental conservation program',
    },
  ]

  return (
    <div className="px-3 py-2 space-y-2 overflow-y-auto">
      {/* Trending section - title and compact cards */}
      <div className="bg-gray-50 rounded-2xl p-3">
        <h2 className="text-lg font-bold mb-2">Trending</h2>
        <div className="space-y-2">
          {trendingIssues.map((trend) => (
            <div
              key={trend.id}
              className="p-2 hover:bg-gray-100 cursor-pointer rounded transition"
            >
              <div className="text-xs text-gray-500 mb-0.5">{trend.category}</div>
              <div className="font-bold text-sm leading-tight">{trend.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">👆 {trend.upvotes}</span>
                {/* Mini progress bar */}
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition"
                    style={{ width: `${trend.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{trend.progress}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{trend.posts}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Schemes section - compact layout */}
      <div className="bg-gray-50 rounded-2xl p-3">
        <h2 className="text-lg font-bold mb-2">Schemes</h2>
        <div className="space-y-2">
          {suggestedSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="p-2 hover:bg-gray-100 cursor-pointer rounded transition"
            >
              <div className="font-bold text-sm">{scheme.name}</div>
              <div className="text-xs text-gray-600 mb-1">{scheme.description}</div>
              <button className="text-xs text-blue-500 font-semibold hover:underline">
                Learn more
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Local news section - last section for better hierarchy */}
      <div className="bg-gray-50 rounded-2xl p-3">
        <h2 className="text-lg font-bold mb-2">Local News</h2>
        <div className="space-y-2">
          <div className="p-2 hover:bg-gray-100 cursor-pointer rounded transition border-l-4 border-blue-500">
            <div className="font-bold text-sm">Municipal Budget</div>
            <div className="text-xs text-gray-500">2 hours ago</div>
          </div>
          <div className="p-2 hover:bg-gray-100 cursor-pointer rounded transition border-l-4 border-green-500">
            <div className="font-bold text-sm">Parks Development</div>
            <div className="text-xs text-gray-500">4 hours ago</div>
          </div>
        </div>
      </div>
    </div>
  )
}
