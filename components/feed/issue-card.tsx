// Individual issue/problem card in the feed
// Shows user info, issue details, upvote count, comments, and actions

'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { MessageCircle, Share2, MoreHorizontal, ArrowUp, Eye, Repeat2, X, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Issue {
  id: number | string
  author: string
  authorId?: string
  avatar: string
  timestamp: string
  category: string
  categoryColor: string
  categoryIcon: string
  title: string
  description: string
  upvotes: number
  comments: number
  views?: number
  reposts?: number
  image?: string | null
  userUpvoted: boolean
  isFollowing?: boolean
  status?: 'pending' | 'under-review' | 'in-progress' | 'resolved' | 'closed'
}

interface IssueCardProps {
  issue: Issue
}

function IssueCard({ issue }: IssueCardProps) {
  const router = useRouter()
  
  // Track if the user has upvoted this issue
  const [isUpvoted, setIsUpvoted] = useState(issue.userUpvoted)
  const [upvoteCount, setUpvoteCount] = useState(issue.upvotes)
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [commentCount, setCommentCount] = useState(issue.comments)
  const [loadingComments, setLoadingComments] = useState(false)
  const [views, setViews] = useState(issue.views || 0)
  const [repostCount, setRepostCount] = useState(issue.reposts || 0)
  const [isFollowing, setIsFollowing] = useState(issue.isFollowing || false)
  const [followLoading, setFollowLoading] = useState(false)

  // Auto-increment view count when component mounts (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setViews(prev => prev + 1)
      // TODO: Send view tracking to API in batch
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Handle follow/unfollow
  const handleFollow = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!issue.authorId) return

    try {
      setFollowLoading(true)
      const response = await fetch(`/api/users/${issue.authorId}/follow`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing)
      }
    } catch (err) {
      console.error('Follow error:', err)
    } finally {
      setFollowLoading(false)
    }
  }, [issue.authorId])

  // Handle upvote button click
  const handleUpvote = useCallback(async () => {
    try {
      setLoading(true)
      
      // Optimistic UI update
      const newUpvoted = !isUpvoted
      setIsUpvoted(newUpvoted)
      setUpvoteCount(newUpvoted ? upvoteCount + 1 : upvoteCount - 1)

      const response = await fetch(`/api/posts/${issue.id}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Revert on error
        setIsUpvoted(!newUpvoted)
        setUpvoteCount(newUpvoted ? upvoteCount : upvoteCount + 1)
        throw new Error('Failed to upvote')
      }

      const data = await response.json()
      // Update with actual count from server
      setUpvoteCount(data.upvoteCount)
    } catch (err) {
      console.error('Error upvoting:', err)
    } finally {
      setLoading(false)
    }
  }, [isUpvoted, upvoteCount, issue.id])

  // Fetch comments when dialog opens
  const handleOpenComments = useCallback(async () => {
    setShowComments(true)
    if (comments.length === 0) {
      try {
        setLoadingComments(true)
        const response = await fetch(`/api/posts/${issue.id}/comments`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments)
        }
      } catch (err) {
        console.error('Error fetching comments:', err)
      } finally {
        setLoadingComments(false)
      }
    }
  }, [comments.length, issue.id])

  // Post a comment
  const handlePostComment = useCallback(async () => {
    if (!commentText.trim()) return

    try {
      const response = await fetch(`/api/posts/${issue.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setCommentCount(commentCount + 1)
        setCommentText('')
      }
    } catch (err) {
      console.error('Error posting comment:', err)
    }
  }, [commentText, issue.id, comments, commentCount])

  // Handle repost
  const handleRepost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${issue.id}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        setRepostCount(data.repostCount)
      }
    } catch (err) {
      console.error('Error reposting:', err)
    }
  }, [issue.id])

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      'pending': { badge: '🟡 Pending', color: 'bg-yellow-100 text-yellow-800' },
      'under-review': { badge: '🔵 Under Review', color: 'bg-blue-100 text-blue-800' },
      'in-progress': { badge: '🟠 In Progress', color: 'bg-orange-100 text-orange-800' },
      'resolved': { badge: '🟢 Resolved', color: 'bg-green-100 text-green-800' },
      'closed': { badge: '⚫ Closed', color: 'bg-gray-100 text-gray-800' },
    }
    return statusConfig[status as keyof typeof statusConfig]
  }

  const statusBadge = issue.status ? getStatusBadge(issue.status) : null

  return (
    <div className="p-4 hover:bg-gray-50 transition cursor-pointer border-b border-gray-200 last:border-b-0">
      {/* Header: User info and time */}
      <div className="flex gap-3">
        {/* User avatar */}
        <div 
          className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          onClick={(e) => {
            e.stopPropagation();
            if (issue.authorId) router.push(`/profile/${issue.authorId}`);
          }}
        >
          {issue.avatar}
        </div>

        {/* User info and content */}
        <div className="flex-1">
          {/* Author name, handle, and timestamp */}
          <div className="flex items-center gap-2">
            <span 
              className="font-semibold text-gray-900 cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                if (issue.authorId) router.push(`/profile/${issue.authorId}`);
              }}
            >
              {issue.author}
            </span>
            <span className="text-gray-600 text-sm">@{issue.author.replace(/\s/g, '').toLowerCase()}</span>
            {issue.authorId && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm">{issue.timestamp}</span>
            {/* More options button */}
            <button className="ml-auto text-gray-500 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Category and status badges */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${issue.categoryColor}`}>
              <span>{issue.categoryIcon}</span>
              {issue.category.replace(/^[^ ]+ /, '')}
            </span>
            {statusBadge && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusBadge.color}`}>
                {statusBadge.badge}
              </span>
            )}
          </div>

          {/* Issue title */}
          <h3 className="font-medium text-base mt-2 text-gray-900">{issue.title}</h3>

          {/* Issue description */}
          <p className="text-gray-700 text-base mt-2 leading-normal">
            {issue.description}
          </p>

          {/* Image if available */}
          {issue.image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200">
              <img
                src={issue.image || "/placeholder.svg"}
                alt={issue.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="mt-3 flex justify-between text-gray-500 max-w-md text-xs font-medium">
            {/* Views counter */}
            <button 
              className="flex items-center gap-2 group text-gray-500 transition p-2 -ml-2 cursor-default"
            >
              <Eye size={16} />
              <span>{views}</span>
            </button>

            {/* Comment button */}
            <button 
              onClick={handleOpenComments}
              className="flex items-center gap-2 group hover:text-blue-500 transition p-2"
            >
              <MessageCircle size={16} />
              <span>{commentCount || 0}</span>
            </button>

            {/* Upvote button - shows count and changes color when upvoted */}
            <button
              onClick={handleUpvote}
              disabled={loading}
              className={`flex items-center gap-2 group transition p-2 disabled:opacity-50 ${
                isUpvoted ? 'text-green-500' : 'hover:text-green-500'
              }`}
            >
              <ArrowUp size={16} fill={isUpvoted ? 'currentColor' : 'none'} />
              <span>{upvoteCount || 0}</span>
            </button>

            {/* Repost button */}
            <button 
              onClick={handleRepost}
              className="flex items-center gap-2 group hover:text-blue-500 transition p-2"
            >
              <Repeat2 size={16} />
              <span>{repostCount}</span>
            </button>

            {/* Share button */}
            <button className="flex items-center gap-2 group hover:text-blue-500 transition p-2">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Comment Dialog */}
      {showComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Comments</h2>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Post Preview */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {issue.avatar}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{issue.author}</div>
                  <p className="text-sm text-gray-600 mt-1">{issue.title}</p>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingComments ? (
                <div className="text-center py-8 text-gray-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No comments yet. Be the first!</div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{comment.author?.name}</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t">
              <div className="flex gap-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!commentText.trim()}
                  className="px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(IssueCard)
