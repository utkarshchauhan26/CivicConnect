'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { User, MapPin, Calendar, Users, UserPlus, Loader2 } from 'lucide-react'
import IssueCard from '@/components/feed/issue-card'

export default function ProfilePage() {
  const params = useParams()
  const userId = params?.id as string

  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts')

  useEffect(() => {
    if (userId) {
      fetchProfile()
    }
  }, [userId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile
      const userRes = await fetch(`/api/users/${userId}`)
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
        setIsFollowing(userData.isFollowing || false)
      }

      // Fetch user posts
      const postsRes = await fetch(`/api/posts?author=${userId}`)
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData.posts || [])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      setFollowLoading(true)
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing)
        // Update follower count
        if (user) {
          setUser({
            ...user,
            followersCount: data.followersCount,
          })
        }
      }
    } catch (err) {
      console.error('Follow error:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">This user does not exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-48" />
      
      <div className="bg-white border-b">
        <div className="px-6 pb-4">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-4xl">
              {user.avatar || user.name?.charAt(0).toUpperCase()}
            </div>
            
            {/* Follow button */}
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-6 py-2 font-semibold rounded-full transition flex items-center gap-2 ${
                isFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  {isFollowing ? 'Following' : 'Follow'}
                </>
              )}
            </button>
          </div>

          {/* User Info */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">@{user.name?.replace(/\s/g, '').toLowerCase()}</p>
            
            {user.email && (
              <p className="text-gray-600 mt-2">{user.email}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            {user.location && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin size={16} />
                {user.location}
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar size={16} />
              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Follower/Following counts */}
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => setActiveTab('following')}
              className="hover:underline"
            >
              <span className="font-bold text-gray-900">{user.followingCount || 0}</span>
              <span className="text-gray-600 ml-1">Following</span>
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className="hover:underline"
            >
              <span className="font-bold text-gray-900">{user.followersCount || 0}</span>
              <span className="text-gray-600 ml-1">Followers</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 font-semibold transition ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-4 font-semibold transition ${
              activeTab === 'followers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-4 font-semibold transition ${
              activeTab === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white">
        {activeTab === 'posts' && (
          <div>
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                No posts yet
              </div>
            ) : (
              posts.map((post: any) => (
                <IssueCard
                  key={post._id}
                  issue={{
                    id: post._id,
                    author: post.author.name,
                    authorId: post.author._id,
                    avatar: post.author.avatar || post.author.name.charAt(0).toUpperCase(),
                    timestamp: new Date(post.createdAt).toLocaleDateString(),
                    category: post.category,
                    categoryColor: 'bg-blue-100 text-blue-800',
                    categoryIcon: '📍',
                    title: post.title,
                    description: post.description,
                    upvotes: post.upvoteCount || 0,
                    comments: post.commentCount || 0,
                    views: post.views || 0,
                    reposts: post.repostCount || 0,
                    image: post.image,
                    userUpvoted: false,
                    isFollowing: post.isFollowing,
                    status: post.status,
                  }}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="p-6 text-center text-gray-600">
            Followers list coming soon
          </div>
        )}

        {activeTab === 'following' && (
          <div className="p-6 text-center text-gray-600">
            Following list coming soon
          </div>
        )}
      </div>
    </div>
  )
}
