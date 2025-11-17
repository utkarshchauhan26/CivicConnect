// API route to add comments to a post

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Comment from '@/models/Comment'
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

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

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

    // Create comment
    const comment = await Comment.create({
      post: postId,
      author: decoded.userId,
      content: content.trim(),
      likes: [],
    })

    // Populate author
    const populatedComment = await Comment.findById(comment._id).populate({
      path: 'author',
      select: 'name avatar',
    })

    return NextResponse.json(
      {
        message: 'Comment added successfully',
        comment: populatedComment,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Add comment error:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const { id: postId } = await params

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    const comments = await Comment.find({ post: postId })
      .populate({
        path: 'author',
        select: 'name avatar',
      })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(
      {
        comments,
        total: comments.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Fetch comments error:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
