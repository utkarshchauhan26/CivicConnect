// Comment model for post discussions

import mongoose, { Schema, model, models, Document } from 'mongoose'

export interface IComment extends Document {
  _id: string
  post: mongoose.Types.ObjectId
  author: mongoose.Types.ObjectId
  content: string
  likes: mongoose.Types.ObjectId[]
  parentComment?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide comment content'],
      trim: true,
      minlength: [1, 'Comment must be at least 1 character'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
CommentSchema.index({ post: 1, createdAt: -1 })
CommentSchema.index({ author: 1 })

export default models.Comment || model<IComment>('Comment', CommentSchema)
