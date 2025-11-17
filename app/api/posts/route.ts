// API route to fetch all posts

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Post from '@/models/Post'
import Comment from '@/models/Comment'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const author = searchParams.get('author') // Filter by author ID
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Get current user ID from token
    let currentUserId = null
    const token = request.cookies.get('token')?.value
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET)
        currentUserId = decoded.userId
      } catch (err) {
        // Token invalid, continue without user context
      }
    }

    // Build query
    const query: any = {}
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (status && status !== 'all') {
      query.status = status
    }

    // Filter by author if provided
    if (author) {
      query.author = author
    }

    // Fetch posts with author details (optimized with select)
    const posts = await Post.find(query)
      .populate({
        path: 'author',
        select: 'name email avatar location',
      })
      .select('title description category image location status createdAt upvotes reposts views author')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    // Get current user to check following status
    let currentUser = null
    if (currentUserId) {
      currentUser = await User.findById(currentUserId).select('following').lean()
    }

    // Get comment count for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id })
        
        // Check if current user is following post author
        const isFollowing = currentUser && (currentUser as any).following
          ? (currentUser as any).following.some((id: any) => id.toString() === post.author._id.toString())
          : false
        
        return {
          ...post,
          authorId: post.author._id.toString(),
          isFollowing,
          commentCount,
          upvoteCount: post.upvotes?.length || 0,
          repostCount: post.reposts?.length || 0,
        }
      })
    )

    return NextResponse.json(
      {
        posts: postsWithComments,
        total: await Post.countDocuments(query),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Fetch posts error:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
