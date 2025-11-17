// Comment thread section for individual issues
// Displays comments and allows users to reply

'use client'

import { ArrowUp, Reply } from 'lucide-react'

interface Comment {
  id: number
  author: string
  avatar: string
  timestamp: string
  text: string
  upvotes: number
}

interface CommentSectionProps {
  comments: Comment[]
}

export default function CommentSection({ comments }: CommentSectionProps) {
  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="font-bold text-lg mb-4">Comments</h3>

      {/* List of comments */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            {/* Commenter avatar */}
            <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />

            {/* Comment content */}
            <div className="flex-1">
              {/* Author info */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{comment.author}</span>
                <span className="text-gray-500 text-xs">{comment.timestamp}</span>
              </div>

              {/* Comment text */}
              <p className="text-gray-700 text-sm mt-1">{comment.text}</p>

              {/* Comment actions */}
              <div className="flex gap-4 mt-2 text-gray-500">
                <button className="flex items-center gap-1 text-xs hover:text-blue-500">
                  <Reply size={14} />
                  Reply
                </button>
                <button className="flex items-center gap-1 text-xs hover:text-green-500">
                  <ArrowUp size={14} />
                  {comment.upvotes}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input box */}
      <div className="mt-4 flex gap-3 border-t border-gray-200 pt-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex-shrink-0" />
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 outline-none text-sm bg-gray-50 px-3 py-2 rounded-full"
        />
      </div>
    </div>
  )
}
