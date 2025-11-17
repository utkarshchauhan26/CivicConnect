// User model for authentication and profile management

import mongoose, { Schema, model, models, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: string
  name: string
  email: string
  password: string
  avatar?: string
  location?: string
  bio?: string
  role: 'citizen' | 'official' | 'admin'
  verified: boolean
  // Social features
  followers: mongoose.Types.ObjectId[]
  following: mongoose.Types.ObjectId[]
  // Scheme eligibility fields
  age?: number
  gender?: 'male' | 'female' | 'other'
  category?: 'General' | 'General(EWS)' | 'OBC' | 'SC' | 'ST'
  state?: string
  localityType?: 'Urban' | 'Semi-Urban' | 'Rural'
  annualIncome?: number
  isBPL?: boolean
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [200, 'Bio cannot exceed 200 characters'],
    },
    role: {
      type: String,
      enum: ['citizen', 'official', 'admin'],
      default: 'citizen',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    // Social features
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Scheme eligibility fields
    age: {
      type: Number,
      min: [1, 'Age must be positive'],
      max: [120, 'Please provide a valid age'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    category: {
      type: String,
      enum: ['General', 'General(EWS)', 'OBC', 'SC', 'ST'],
    },
    state: {
      type: String,
    },
    localityType: {
      type: String,
      enum: ['Urban', 'Semi-Urban', 'Rural'],
    },
    annualIncome: {
      type: Number,
      min: [0, 'Income cannot be negative'],
    },
    isBPL: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    return false
  }
}

export default models.User || model<IUser>('User', UserSchema)
