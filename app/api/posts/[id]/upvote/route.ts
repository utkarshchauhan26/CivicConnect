// API route to upvote/downvote a post

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Post from '@/models/Post'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded: any = jwt.verify(token, JWT_SECRET)

    await dbConnect()

    const { id: postId } = await params

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    const post = await Post.findById(postId)

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const userId = new mongoose.Types.ObjectId(decoded.userId)

    // Check if user already upvoted
    const hasUpvoted = post.upvotes.some((id: any) => id.equals(userId))

    if (hasUpvoted) {
      // Remove upvote
      post.upvotes = post.upvotes.filter((id: any) => !id.equals(userId))
    } else {
      // Add upvote
      post.upvotes.push(userId)
    }

    await post.save()

    return NextResponse.json(
      {
        message: hasUpvoted ? 'Upvote removed' : 'Post upvoted',
        upvoted: !hasUpvoted,
        upvoteCount: post.upvotes.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Upvote error:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
