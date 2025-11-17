// API route to get user profile information

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get current user ID from token
    let currentUserId = null
    const token = request.cookies.get('token')?.value
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET)
        currentUserId = decoded.userId
      } catch (err) {
        // Token invalid
      }
    }

    await dbConnect()

    // Fetch user profile
    const user = await User.findById(id)
      .select('name email avatar location createdAt followers following')
      .lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if current user is following this user
    let isFollowing = false
    if (currentUserId && currentUserId !== id) {
      const currentUser = await User.findById(currentUserId).select('following').lean()
      isFollowing = (currentUser as any)?.following?.some(
        (followId: any) => followId.toString() === id
      ) || false
    }

    return NextResponse.json(
      {
        user: {
          ...user,
          followersCount: (user as any).followers?.length || 0,
          followingCount: (user as any).following?.length || 0,
        },
        isFollowing,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get user profile error:', error)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
