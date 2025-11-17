// Database optimization script
// Creates indexes for better query performance

import mongoose from 'mongoose'
import Post from '@/models/Post'
import User from '@/models/User'
import Comment from '@/models/Comment'
import dbConnect from '@/lib/mongodb'

async function createIndexes() {
  try {
    await dbConnect()

    console.log('Creating indexes...')

    // Post indexes
    await Post.collection.createIndex({ createdAt: -1 })
    await Post.collection.createIndex({ author: 1, createdAt: -1 })
    await Post.collection.createIndex({ category: 1, status: 1 })
    await Post.collection.createIndex({ 'upvotes': 1 })
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true })
    await User.collection.createIndex({ followers: 1 })
    await User.collection.createIndex({ following: 1 })
    
    // Comment indexes
    await Comment.collection.createIndex({ post: 1, createdAt: -1 })
    await Comment.collection.createIndex({ author: 1 })

    console.log('✓ All indexes created successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error creating indexes:', error)
    process.exit(1)
  }
}

createIndexes()
