"use client";

import { useState, useRef } from "react";
import { Image, MapPin, Loader2, X } from 'lucide-react';

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory] = useState("🏗️ Roads");

  const handlePost = async () => {
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      setError("");

      // Extract title from first line, rest is description
      const lines = text.trim().split('\n');
      const title = lines[0].slice(0, 100); // Max 100 chars for title
      const description = lines.length > 1 ? lines.slice(1).join('\n') : lines[0];

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category: selectedCategory,
          location: '', // TODO: Add location selection
          image: imageFile || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to create post');
      }

      const data = await response.json();
      
      // Clear form
      setText("");
      setRows(3);
      setImagePreview(null);
      setImageFile(null);

      // Notify parent component
      if (onPostCreated) {
        onPostCreated(data.post);
      }
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const newRows = Math.min(Math.max(3, e.target.value.split("\n").length), 8);
    setRows(newRows);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB for better performance)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Create preview with compression
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to 70% quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressedBase64);
          setImageFile(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="top-14 z-30 
        bg-white border-b border-gray-200 
        px-4 py-3 
      "
    >
      {/* Inner layout */}
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full" />

        {/* Input & actions */}
        <div className="flex-1">
          {/* Text input */}
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Describe the civic issue..."
            disabled={loading}
            className="
              w-full text-[16px] leading-6 
              placeholder-gray-500 
              outline-none resize-none 
              bg-transparent
              disabled:opacity-50
            "
            rows={rows}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-3 relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-48 rounded-lg border"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Category + actions */}
          <div className="mt-3 flex items-center justify-between">
            {/* Category badge */}
            <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-semibold">
              {selectedCategory}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {/* Image */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="text-gray-600 p-2 hover:bg-blue-50 rounded-full transition disabled:opacity-50"
              >
                <Image size={20} />
              </button>

              {/* Location */}
              <button 
                className="text-gray-600 p-2 hover:bg-blue-50 rounded-full transition"
                disabled={loading}
              >
                <MapPin size={20} />
              </button>

              {/* Post */}
              <button
                onClick={handlePost}
                disabled={!text.trim() || loading}
                className="
                  bg-blue-500 text-white font-semibold 
                  px-5 py-2 rounded-full 
                  hover:bg-blue-600 
                  disabled:bg-gray-300 disabled:cursor-not-allowed
                  transition
                  flex items-center gap-2
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
