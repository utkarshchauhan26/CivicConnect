// Seed script to import CSV data into MongoDB
// Run with: npx tsx scripts/seed-data.ts

import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Define schemas (copied from models)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  location: String,
  role: { type: String, enum: ['citizen', 'admin', 'moderator'], default: 'citizen' },
  createdAt: { type: Date, default: Date.now },
})

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  categoryIcon: String,
  image: String,
  location: String,
  status: {
    type: String,
    enum: ['pending', 'under-review', 'in-progress', 'resolved', 'closed'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema)

// Map CSV issue types to our categories
const categoryMap: { [key: string]: { name: string; icon: string } } = {
  'Healthcare': { name: '🏥 Healthcare', icon: '🏥' },
  'Corruption': { name: '⚖️ Corruption', icon: '⚖️' },
  'Education Admin': { name: '🎓 Education', icon: '🎓' },
  'Water & Drainage': { name: '💧 Water', icon: '💧' },
  'Garbage & Sanitation': { name: '🚮 Sanitation', icon: '🚮' },
  'Animal-related': { name: '🐕 Animals', icon: '🐕' },
  'Electricity': { name: '⚡ Electricity', icon: '⚡' },
  'Roads & Transport': { name: '🏗️ Roads', icon: '🏗️' },
  'Public Safety': { name: '👮 Safety', icon: '👮' },
  'Environment & Pollution': { name: '🌳 Environment', icon: '🌳' },
  'Banking & Finance': { name: '💰 Banking', icon: '💰' },
  'Property & Land': { name: '🏠 Property', icon: '🏠' },
  'Documentation': { name: '📄 Documentation', icon: '📄' },
}

// Map CSV status to our status
const statusMap: { [key: string]: string } = {
  'Pending': 'pending',
  'Escalated': 'under-review',
  'Resolved': 'resolved',
  'In Progress': 'in-progress',
  'Closed': 'closed',
}

// Map severity to priority
const priorityMap: { [key: string]: string } = {
  'Low': 'low',
  'Medium': 'medium',
  'High': 'high',
  'Critical': 'critical',
}

async function parseCsv(filePath: string): Promise<any[]> {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const lines = fileContent.split('\n')
  const headers = lines[0].split(',')
  
  const data = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    
    const values = lines[i].split(',')
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ''
    })
    
    data.push(row)
  }
  
  return data
}

async function seedData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables')
    }

    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Create or find a default user
    console.log('👤 Creating default users...')
    const defaultUsers = [
      { name: 'Rahul Kumar', email: 'rahul@example.com', location: 'Delhi' },
      { name: 'Priya Sharma', email: 'priya@example.com', location: 'Mumbai' },
      { name: 'Amit Patel', email: 'amit@example.com', location: 'Ahmedabad' },
      { name: 'Sneha Gupta', email: 'sneha@example.com', location: 'Bangalore' },
      { name: 'Vijay Singh', email: 'vijay@example.com', location: 'Lucknow' },
    ]

    const users = []
    for (const userData of defaultUsers) {
      let user = await User.findOne({ email: userData.email })
      if (!user) {
        user = await User.create({
          ...userData,
          password: 'demo123', // Not used, just placeholder
          role: 'citizen',
        })
      }
      users.push(user)
    }
    console.log(`✅ Created/found ${users.length} users`)

    // Parse CSV
    const csvPath = path.join(process.cwd(), 'backend', 'civicconnect_dataset.csv')
    console.log('📄 Reading CSV file...')
    const csvData = await parseCsv(csvPath)
    console.log(`✅ Found ${csvData.length} rows in CSV`)

    // Import first 50 posts (or all if less)
    const postsToImport = csvData.slice(0, 50)
    console.log(`📝 Importing ${postsToImport.length} posts...`)

    let imported = 0
    for (const row of postsToImport) {
      try {
        // Get random user
        const randomUser = users[Math.floor(Math.random() * users.length)]

        // Map category
        const issueType = row.issue_type || 'Other'
        const category = categoryMap[issueType] || { name: '🏗️ Roads', icon: '🏗️' }

        // Extract title from first sentence
        const complaintText = row.complaint_text || 'Issue reported'
        const firstSentence = complaintText.split('.')[0]
        const title = firstSentence.length > 100 
          ? firstSentence.slice(0, 97) + '...'
          : firstSentence

        // Create post
        await Post.create({
          author: randomUser._id,
          title,
          description: complaintText,
          category: category.name,
          categoryIcon: category.icon,
          location: row.citizen_location || 'India',
          status: statusMap[row.status] || 'pending',
          priority: priorityMap[row.severity_level] || 'medium',
          upvotes: [],
          createdAt: row.date_reported ? new Date(row.date_reported) : new Date(),
        })

        imported++
        if (imported % 10 === 0) {
          console.log(`  ⏳ Imported ${imported}/${postsToImport.length}...`)
        }
      } catch (err) {
        console.error('Error importing row:', err)
      }
    }

    console.log(`✅ Successfully imported ${imported} posts!`)
    console.log('🎉 Seeding complete!')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Run the seed function
seedData()
