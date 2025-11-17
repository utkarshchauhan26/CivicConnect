// Post model for civic issues and reports

import mongoose, { Schema, model, models, Document } from 'mongoose'

export interface IPost extends Document {
  _id: string
  author: mongoose.Types.ObjectId
  title: string
  description: string
  category: string
  categoryIcon: string
  image?: string
  location?: string
  upvotes: mongoose.Types.ObjectId[]
  reposts: mongoose.Types.ObjectId[]
  status: 'pending' | 'under-review' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        '🏗️ Roads',
        '💧 Water',
        '🚮 Sanitation',
        '⚡ Electricity',
        '🌳 Environment',
        '🏥 Healthcare',
        '🎓 Education',
        '👮 Safety',
        '🚌 Transport',
        '📱 Other',
      ],
    },
    categoryIcon: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reposts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'under-review', 'in-progress', 'resolved', 'closed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
PostSchema.index({ author: 1, createdAt: -1 })
PostSchema.index({ category: 1, status: 1 })
PostSchema.index({ status: 1, priority: -1 })

export default models.Post || model<IPost>('Post', PostSchema)
