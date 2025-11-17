// API route to fetch news from GNews API
// Fetches local news based on user's city and general civic news

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '@/models/User'
import dbConnect from '@/lib/mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const NEWS_API_KEY = process.env.NEWS_API_KEY

export async function GET(request: NextRequest) {
  try {
    // Get current user from token to fetch their city/location
    let userCity = null
    const token = request.cookies.get('token')?.value
    
    if (token) {
      try {
        await dbConnect()
        const decoded: any = jwt.verify(token, JWT_SECRET)
        const user = await User.findById(decoded.userId).select('location').lean() as any
        if (user && user.location) {
          userCity = user.location as string
        }
      } catch (err) {
        // Continue without user context
      }
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'local'

    if (!NEWS_API_KEY) {
      return NextResponse.json(
        { error: 'NEWS_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Build fetch promises for parallel execution
    const fetchPromises = []

    // Fetch local news if user has a city
    if (category === 'local' && userCity) {
      const localQuery = `${userCity} India civic OR infrastructure OR government`
      const localUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(localQuery)}&lang=en&country=in&max=5&apikey=${NEWS_API_KEY}`
      
      fetchPromises.push(
        fetch(localUrl, { next: { revalidate: 3600 } })
          .then(res => res.json())
          .then(data => data.articles?.map((article: any) => ({ ...article, category: 'local' })) || [])
          .catch(() => [])
      )
    }

    // Fetch general civic news
    if (category === 'general' || category === 'local') {
      const generalQuery = 'India government civic OR infrastructure'
      const generalUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(generalQuery)}&lang=en&country=in&max=5&apikey=${NEWS_API_KEY}`
      
      fetchPromises.push(
        fetch(generalUrl, { next: { revalidate: 3600 } })
          .then(res => res.json())
          .then(data => data.articles?.map((article: any) => ({ ...article, category: 'general' })) || [])
          .catch(() => [])
      )
    }

    // Fetch schemes and scholarships news
    if (category === 'schemes' || category === 'local') {
      const schemesQuery = 'India government scheme OR scholarship'
      const schemesUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(schemesQuery)}&lang=en&country=in&max=5&apikey=${NEWS_API_KEY}`
      
      fetchPromises.push(
        fetch(schemesUrl, { next: { revalidate: 3600 } })
          .then(res => res.json())
          .then(data => data.articles?.map((article: any) => ({ ...article, category: 'schemes' })) || [])
          .catch(() => [])
      )
    }

    // Execute all fetches in parallel
    const results = await Promise.all(fetchPromises)
    const newsArticles = results.flat()

    // Remove duplicates based on URL
    const uniqueArticles = Array.from(
      new Map(newsArticles.map(article => [article.url, article])).values()
    )

    // Sort by published date (newest first)
    uniqueArticles.sort((a: any, b: any) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    return NextResponse.json(
      {
        articles: uniqueArticles,
        userCity: userCity,
        total: uniqueArticles.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Fetch news error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
