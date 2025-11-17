// API route to create a new post with ML classification

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Post from '@/models/Post'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Category mapping from ML model to app categories
const CATEGORY_MAP: { [key: string]: { display: string; icon: string } } = {
  'Roads & Transport': { display: '🏗️ Roads', icon: '🏗️' },
  'Water & Drainage': { display: '💧 Water', icon: '💧' },
  'Garbage & Sanitation': { display: '🚮 Sanitation', icon: '🚮' },
  'Electricity': { display: '⚡ Electricity', icon: '⚡' },
  'Environmental Issue': { display: '🌳 Environment', icon: '🌳' },
  'Healthcare': { display: '🏥 Healthcare', icon: '🏥' },
  'Education Admin': { display: '🎓 Education', icon: '🎓' },
  'Law & Order': { display: '👮 Safety', icon: '👮' },
  'Banking & Finance': { display: '💰 Banking', icon: '💰' },
  'Corruption': { display: '⚖️ Corruption', icon: '⚖️' },
  'Tax & Property': { display: '🏠 Property', icon: '🏠' },
  'Public Office / Documentation': { display: '📄 Documentation', icon: '📄' },
  'Animal-related': { display: '🐕 Animals', icon: '🐕' },
}

// Default category
const DEFAULT_CATEGORY = { display: '📱 Other', icon: '📱' }

function mapCategory(mlCategory: string): { display: string; icon: string } {
  return CATEGORY_MAP[mlCategory] || DEFAULT_CATEGORY
}

// Classify text using ML model (placeholder - will be enhanced)
async function classifyComplaint(text: string): Promise<string> {
  // For now, use simple keyword matching
  // In production, this would call your Python ML model via API
  
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('road') || lowerText.includes('pothole') || lowerText.includes('transport') || lowerText.includes('bus')) {
    return 'Roads & Transport'
  } else if (lowerText.includes('water') || lowerText.includes('drainage') || lowerText.includes('waterlog')) {
    return 'Water & Drainage'
  } else if (lowerText.includes('garbage') || lowerText.includes('waste') || lowerText.includes('sanitation')) {
    return 'Garbage & Sanitation'
  } else if (lowerText.includes('electric') || lowerText.includes('power') || lowerText.includes('voltage')) {
    return 'Electricity'
  } else if (lowerText.includes('pollution') || lowerText.includes('environment') || lowerText.includes('noise')) {
    return 'Environmental Issue'
  } else if (lowerText.includes('hospital') || lowerText.includes('health') || lowerText.includes('doctor')) {
    return 'Healthcare'
  } else if (lowerText.includes('school') || lowerText.includes('college') || lowerText.includes('education') || lowerText.includes('admission')) {
    return 'Education Admin'
  } else if (lowerText.includes('police') || lowerText.includes('safety') || lowerText.includes('harassment') || lowerText.includes('theft')) {
    return 'Law & Order'
  } else if (lowerText.includes('bribe') || lowerText.includes('corrupt') || lowerText.includes('fraud')) {
    return 'Corruption'
  } else if (lowerText.includes('cattle') || lowerText.includes('dog') || lowerText.includes('animal') || lowerText.includes('stray')) {
    return 'Animal-related'
  }
  
  return 'Other'
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, location, image } = body

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await User.findById(decoded.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Classify the complaint using ML
    const mlCategory = await classifyComplaint(title + ' ' + description)
    const categoryInfo = mapCategory(mlCategory)

    // Create post
    const post = await Post.create({
      author: user._id,
      title: title.trim(),
      description: description.trim(),
      category: categoryInfo.display,
      categoryIcon: categoryInfo.icon,
      image: image || '',
      location: location || user.location || '',
      upvotes: [],
      status: 'pending',
      priority: 'medium',
    })

    // Populate author data
    const populatedPost = await Post.findById(post._id).populate({
      path: 'author',
      select: 'name email avatar location',
    })

    return NextResponse.json(
      {
        message: 'Post created successfully',
        post: populatedPost,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create post error:', error)

    // Check for JWT errors
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
