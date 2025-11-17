// Scheme model for government schemes and programs

import mongoose, { Schema, model, models, Document } from 'mongoose'

export interface IScheme extends Document {
  _id: string
  title: string
  description: string
  category: string
  department: string
  eligibility: string[]
  benefits: string[]
  documents: string[]
  applyLink?: string
  deadline?: Date
  image?: string
  views: number
  bookmarks: mongoose.Types.ObjectId[]
  status: 'active' | 'inactive' | 'upcoming'
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SchemeSchema = new Schema<IScheme>(
  {
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
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Education',
        'Healthcare',
        'Housing',
        'Employment',
        'Agriculture',
        'Business',
        'Social Welfare',
        'Infrastructure',
        'Environment',
        'Other',
      ],
    },
    department: {
      type: String,
      required: [true, 'Please provide department name'],
      trim: true,
    },
    eligibility: [
      {
        type: String,
        required: true,
      },
    ],
    benefits: [
      {
        type: String,
        required: true,
      },
    ],
    documents: [
      {
        type: String,
      },
    ],
    applyLink: {
      type: String,
      default: '',
    },
    deadline: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
    },
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'upcoming'],
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
SchemeSchema.index({ category: 1, status: 1 })
SchemeSchema.index({ status: 1, deadline: 1 })

export default models.Scheme || model<IScheme>('Scheme', SchemeSchema)
