// API route to follow/unfollow a user

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
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

    const { id: targetUserId } = await params

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const currentUserId = new mongoose.Types.ObjectId(decoded.userId)
    const targetId = new mongoose.Types.ObjectId(targetUserId)

    // Cannot follow yourself
    if (currentUserId.equals(targetId)) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    const currentUser = await User.findById(currentUserId)
    const targetUser = await User.findById(targetId)

    if (!currentUser || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const isFollowing = currentUser.following.some((id: any) => id.equals(targetId))

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter((id: any) => !id.equals(targetId))
      targetUser.followers = targetUser.followers.filter((id: any) => !id.equals(currentUserId))
    } else {
      // Follow
      currentUser.following.push(targetId)
      targetUser.followers.push(currentUserId)
    }

    await currentUser.save()
    await targetUser.save()

    return NextResponse.json(
      {
        message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
        isFollowing: !isFollowing,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Follow/unfollow error:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
