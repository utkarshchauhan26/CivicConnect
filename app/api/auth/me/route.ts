// API route to get current authenticated user

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function GET(request: NextRequest) {
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

    // Get user
    const user = await User.findById(decoded.userId)
      .select('name email avatar location followers following')
      .lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        user: {
          ...user,
          _id: (user as any)._id.toString(),
          followersCount: (user as any).followers?.length || 0,
          followingCount: (user as any).following?.length || 0,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get current user error:', error)

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
