// API route for user registration

import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { 
      name, 
      email, 
      password,
      age,
      gender,
      category,
      state,
      localityType,
      annualIncome,
      isBPL,
      location
    } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate eligibility fields
    if (!age || !gender || !category || !state || !localityType) {
      return NextResponse.json(
        { error: 'Please provide all eligibility information' },
        { status: 400 }
      )
    }

    if (age < 1 || age > 120) {
      return NextResponse.json(
        { error: 'Please provide a valid age' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'citizen',
      verified: false,
      age,
      gender,
      category,
      state,
      localityType,
      annualIncome: annualIncome || 0,
      isBPL: isBPL || false,
      location: location || state,
    })

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userResponse,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
