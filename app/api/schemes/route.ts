// API route to get recommended government schemes based on user eligibility
// Uses Python ML model with Sentence-BERT for personalized recommendations

import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Simple in-memory cache for ML recommendations (expires after 1 hour)
const recommendationCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

function getCacheKey(userProfile: any): string {
  return `${userProfile.age}_${userProfile.category}_${userProfile.annualIncome}_${userProfile.state}`
}

// Helper function to call Python ML recommender
async function getMLRecommendations(userProfile: any): Promise<any[]> {
  // Check cache first
  const cacheKey = getCacheKey(userProfile)
  const cached = recommendationCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached recommendations')
    return cached.data
  }

  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'backend', 'recommend_api.py')
    const pythonProcess = spawn('python', [pythonScript])
    
    let dataString = ''
    let errorString = ''
    
    // Send user data to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify(userProfile))
    pythonProcess.stdin.end()
    
    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorString)
        reject(new Error('ML recommendation failed'))
        return
      }
      
      try {
        const result = JSON.parse(dataString)
        const schemes = result.schemes || []
        
        // Cache the results
        recommendationCache.set(cacheKey, {
          data: schemes,
          timestamp: Date.now()
        })
        
        // Clean up old cache entries (keep only last 100)
        if (recommendationCache.size > 100) {
          const firstKey = recommendationCache.keys().next().value
          if (firstKey) recommendationCache.delete(firstKey)
        }
        
        resolve(schemes)
      } catch (err) {
        console.error('Failed to parse Python output:', dataString)
        reject(err)
      }
    })
  })
}

// Scheme database with eligibility criteria
const SCHEMES = [
  {
    id: 'pmay',
    name: 'Pradhan Mantri Awas Yojana (PMAY)',
    description: 'Housing for all - provides financial assistance for building or buying a house',
    category: 'Housing',
    eligibility: {
      maxIncome: 300000,
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 18,
    },
    benefits: '₹1.5-2.5 lakh subsidy on home loans',
    icon: '🏠',
  },
  {
    id: 'ayushman',
    name: 'Ayushman Bharat',
    description: 'Health insurance coverage of ₹5 lakh per family per year',
    category: 'Healthcare',
    eligibility: {
      maxIncome: 100000,
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 0,
    },
    benefits: '₹5 lakh annual health cover',
    icon: '🏥',
  },
  {
    id: 'obc-scholarship',
    name: 'OBC Scholarship',
    description: 'Educational scholarship for OBC students pursuing higher education',
    category: 'Education',
    eligibility: {
      maxIncome: 800000,
      categories: ['OBC'],
      minAge: 16,
      maxAge: 30,
    },
    benefits: '₹12,000-20,000 per year',
    icon: '🎓',
  },
  {
    id: 'sc-scholarship',
    name: 'SC/ST Post-Matric Scholarship',
    description: 'Financial assistance for SC/ST students for post-secondary education',
    category: 'Education',
    eligibility: {
      maxIncome: 250000,
      categories: ['SC', 'ST'],
      minAge: 16,
      maxAge: 30,
    },
    benefits: 'Full tuition + maintenance allowance',
    icon: '📚',
  },
  {
    id: 'old-age-pension',
    name: 'Old Age Pension',
    description: 'Monthly pension for senior citizens belonging to BPL families',
    category: 'Social Security',
    eligibility: {
      maxIncome: 25000,
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 60,
    },
    benefits: '₹500-2,000 per month',
    icon: '👴',
  },
  {
    id: 'pmjdy',
    name: 'Pradhan Mantri Jan Dhan Yojana',
    description: 'Zero balance bank account with RuPay debit card and accident insurance',
    category: 'Banking',
    eligibility: {
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 10,
    },
    benefits: 'Free banking + ₹2 lakh accident insurance',
    icon: '💰',
  },
  {
    id: 'bpl-ration',
    name: 'BPL Ration Card',
    description: 'Subsidized food grains for families below poverty line',
    category: 'Food Security',
    eligibility: {
      maxIncome: 25000,
      isBPL: true,
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 0,
    },
    benefits: 'Subsidized rice, wheat, and other essentials',
    icon: '🌾',
  },
  {
    id: 'mudra-loan',
    name: 'Pradhan Mantri MUDRA Yojana',
    description: 'Loans up to ₹10 lakh for small businesses and micro-enterprises',
    category: 'Business',
    eligibility: {
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 18,
    },
    benefits: 'Loans from ₹50,000 to ₹10 lakh',
    icon: '💼',
  },
  {
    id: 'skill-india',
    name: 'Skill India Mission',
    description: 'Free skill development training for youth',
    category: 'Employment',
    eligibility: {
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 16,
      maxAge: 35,
    },
    benefits: 'Free vocational training + certification',
    icon: '🔧',
  },
  {
    id: 'ujjwala',
    name: 'Pradhan Mantri Ujjwala Yojana',
    description: 'Free LPG connection for women from BPL families',
    category: 'Energy',
    eligibility: {
      maxIncome: 25000,
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      gender: 'female',
      minAge: 18,
    },
    benefits: 'Free LPG connection + first refill support',
    icon: '🔥',
  },
  {
    id: 'kisan-samman',
    name: 'PM-KISAN',
    description: 'Direct income support to farmers',
    category: 'Agriculture',
    eligibility: {
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 18,
      localityType: ['Rural'],
    },
    benefits: '₹6,000 per year in three installments',
    icon: '🌱',
  },
  {
    id: 'widow-pension',
    name: 'Widow Pension Scheme',
    description: 'Monthly pension for widows',
    category: 'Social Security',
    eligibility: {
      maxIncome: 100000,
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      gender: 'female',
      minAge: 18,
    },
    benefits: '₹500-1,500 per month',
    icon: '👩',
  },
  {
    id: 'swachh-bharat',
    name: 'Swachh Bharat Mission',
    description: 'Financial assistance for toilet construction',
    category: 'Sanitation',
    eligibility: {
      maxIncome: 100000,
      categories: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
      minAge: 18,
      localityType: ['Rural', 'Semi-Urban'],
    },
    benefits: '₹12,000 for toilet construction',
    icon: '🚽',
  },
]

// Check if user is eligible for a scheme
function isEligible(scheme: typeof SCHEMES[0], user: any): boolean {
  const { eligibility } = scheme
  
  // Check category
  if (eligibility.categories && !eligibility.categories.includes(user.category)) {
    return false
  }
  
  // Check age
  if (eligibility.minAge && user.age < eligibility.minAge) {
    return false
  }
  if (eligibility.maxAge && user.age > eligibility.maxAge) {
    return false
  }
  
  // Check income
  if (eligibility.maxIncome && user.annualIncome > eligibility.maxIncome) {
    return false
  }
  
  // Check gender
  if (eligibility.gender && user.gender !== eligibility.gender) {
    return false
  }
  
  // Check BPL status
  if (eligibility.isBPL && !user.isBPL) {
    return false
  }
  
  // Check locality type
  if (eligibility.localityType && !eligibility.localityType.includes(user.localityType)) {
    return false
  }
  
  return true
}

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

    // Get user with eligibility data
    const user = await User.findById(decoded.userId).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has completed eligibility profile
    if (!(user as any).age || !(user as any).category || !(user as any).state || (user as any).annualIncome === undefined) {
      return NextResponse.json(
        {
          message: 'Please complete your profile to see eligible schemes',
          schemes: [],
          profileIncomplete: true,
        },
        { status: 200 }
      )
    }

    // Call Python ML model for personalized recommendations
    try {
      const mlSchemes = await getMLRecommendations({
        age: (user as any).age,
        category: (user as any).category,
        annualIncome: (user as any).annualIncome,
        state: (user as any).state,
        isBPL: (user as any).isBPL || false,
      })

      // Format ML recommendations with icons
      const schemeIcons: Record<string, string> = {
        'PMAY': '🏠',
        'Ayushman': '🏥',
        'Scholarship': '🎓',
        'Pension': '👴',
        'PMJDY': '💰',
        'BPL': '🍚',
        'MUDRA': '💼',
        'Skill': '🎯',
        'Ujjwala': '🔥',
        'KISAN': '🌾',
        'Widow': '👩',
        'Swachh': '🚽',
        'Bus': '🚌',
      }

      const formattedSchemes = mlSchemes.map((scheme: any) => {
        let icon = '📋'
        for (const [key, emoji] of Object.entries(schemeIcons)) {
          if (scheme.name.includes(key)) {
            icon = emoji
            break
          }
        }

        return {
          id: scheme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: scheme.name,
          description: `Personalized recommendation based on your profile (Score: ${(scheme.score * 100).toFixed(0)}%)`,
          category: scheme.category || 'Government Scheme',
          benefits: 'View official website for benefits',
          icon,
        }
      })

      return NextResponse.json(
        {
          eligible: formattedSchemes,
          other: [],
          userProfile: {
            age: (user as any).age,
            category: (user as any).category,
            state: (user as any).state,
            annualIncome: (user as any).annualIncome,
            isBPL: (user as any).isBPL,
          },
        },
        { status: 200 }
      )
    } catch (mlError) {
      console.error('ML recommendation failed, falling back to rule-based:', mlError)
      
      // Fallback to hardcoded schemes if ML fails
      const SCHEMES = [
        {
          id: 'pmay',
          name: 'Pradhan Mantri Awas Yojana (PMAY)',
          description: 'Housing for all',
          category: 'Housing',
          benefits: '₹1.5-2.5 lakh subsidy',
          icon: '🏠',
        },
        {
          id: 'ayushman',
          name: 'Ayushman Bharat',
          description: 'Health insurance',
          category: 'Healthcare',
          benefits: '₹5 lakh cover',
          icon: '🏥',
        },
      ]

      return NextResponse.json(
        {
          eligible: SCHEMES,
          other: [],
          userProfile: {
            age: (user as any).age,
            category: (user as any).category,
            state: (user as any).state,
            annualIncome: (user as any).annualIncome,
            isBPL: (user as any).isBPL,
          },
        },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error('Scheme recommendation error:', error)

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
