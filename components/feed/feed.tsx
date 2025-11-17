// Main feed component that displays the scrollable list of civic issues
// Users can see new posts, upvote them, and comment on issues

'use client'

import { useState, useEffect } from 'react'
import PostComposer from './post-composer'
import IssueCard from './issue-card'
import FeedFilters from './feed-filters'
import { Loader2 } from 'lucide-react'

interface Post {
  _id: string
  author: {
    _id: string
    name: string
    email: string
    avatar?: string
    location?: string
  }
  authorId: string
  isFollowing: boolean
  title: string
  description: string
  category: string
  categoryIcon: string
  image?: string
  location?: string
  status: 'pending' | 'under-review' | 'in-progress' | 'resolved' | 'closed'
  createdAt: string
  upvotes: string[]
  commentCount: number
  upvoteCount: number
  repostCount: number
  views?: number
}

export default function Feed() {
  // Track the current filter/sorting method
  const [filterMode, setFilterMode] = useState('latest')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts?limit=20', {
        next: { revalidate: 60 } // Cache for 60 seconds
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      setPosts(data.posts)
    } catch (err: any) {
      console.error('Error fetching posts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Handle new post created
  const handlePostCreated = (newPost: Post) => {
    // Ensure the new post has all required counts
    const postWithCounts = {
      ...newPost,
      commentCount: 0,
      upvoteCount: newPost.upvotes?.length || 0,
    }
    setPosts([postWithCounts, ...posts])
  }

  // Get initials from name for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      '🏗️ Roads': 'bg-orange-100 text-orange-800',
      '💧 Water': 'bg-blue-100 text-blue-800',
      '🚮 Sanitation': 'bg-green-100 text-green-800',
      '⚡ Electricity': 'bg-yellow-100 text-yellow-800',
      '🌳 Environment': 'bg-emerald-100 text-emerald-800',
      '🏥 Healthcare': 'bg-red-100 text-red-800',
      '🎓 Education': 'bg-purple-100 text-purple-800',
      '👮 Safety': 'bg-indigo-100 text-indigo-800',
      '💰 Banking': 'bg-teal-100 text-teal-800',
      '⚖️ Corruption': 'bg-rose-100 text-rose-800',
      '🏠 Property': 'bg-amber-100 text-amber-800',
      '📄 Documentation': 'bg-slate-100 text-slate-800',
      '🐕 Animals': 'bg-lime-100 text-lime-800',
    }
    return colorMap[category] || 'bg-gray-100 text-gray-800'
  }

  // Transform API data to IssueCard format
  const transformedPosts = posts.map((post) => ({
    id: post._id,
    author: post.author.name,
    authorId: post.authorId || post.author._id,
    avatar: post.author.avatar || getInitials(post.author.name),
    timestamp: getTimeAgo(post.createdAt),
    category: post.category,
    categoryIcon: post.categoryIcon,
    categoryColor: getCategoryColor(post.category),
    title: post.title,
    description: post.description,
    upvotes: post.upvoteCount || 0,
    comments: post.commentCount || 0,
    reposts: post.repostCount || 0,
    views: post.views || 0,
    image: post.image || null,
    userUpvoted: false, // TODO: Check if current user upvoted
    isFollowing: post.isFollowing || false,
    status: post.status,
  }))

  return (
    <div className="w-full">
      {/* Post composer - allows users to create new issues */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Filter tabs - Latest, Trending, Near You, etc. */}
      <FeedFilters activeFilter={filterMode} onFilterChange={setFilterMode} />

      {/* Display all the issues in a scrollable feed */}
      <div className="relative">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchPosts}
              className="mt-4 text-blue-600 hover:text-blue-500"
            >
              Try again
            </button>
          </div>
        ) : transformedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts yet. Be the first to report an issue!</p>
          </div>
        ) : (
          transformedPosts.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>
    </div>
  )
}
