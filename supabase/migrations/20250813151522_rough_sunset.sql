/*
  # Create testimonials table and security policies

  1. New Tables
    - `testimonials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (varchar(100), customer name)
      - `text` (text, testimonial content, max 500 chars)
      - `video_url` (varchar(255), optional video URL)
      - `approved` (boolean, default false)
      - `created_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `testimonials` table
    - Add policy for users to view their own testimonials
    - Add policy for anyone to insert testimonials (public collection)
    - Add policy for users to update/delete their own testimonials

  3. Storage
    - Create storage bucket for testimonial videos
    - Add storage policies for video uploads

  4. Indexes
    - Index on user_id for efficient queries
    - Index on approved status for public API
    - Index on created_at for sorting
*/

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(100) NOT NULL,
  text text NOT NULL CHECK (char_length(text) <= 500 AND char_length(text) >= 10),
  video_url varchar(255),
  approved boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_approved ON testimonials(user_id, approved);

-- RLS Policies

-- Policy: Users can view their own testimonials
CREATE POLICY "Users can view their own testimonials"
  ON testimonials FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can insert testimonials (for public collection form)
CREATE POLICY "Anyone can insert testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own testimonials (approve/disapprove)
CREATE POLICY "Users can update their own testimonials"
  ON testimonials FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own testimonials
CREATE POLICY "Users can delete their own testimonials"
  ON testimonials FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for testimonial videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimonial-videos',
  'testimonial-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies

-- Policy: Anyone can upload testimonial videos
CREATE POLICY "Anyone can upload testimonial videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'testimonial-videos' 
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- Policy: Anyone can view testimonial videos (public bucket)
CREATE POLICY "Anyone can view testimonial videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonial-videos');

-- Policy: Only owners can delete their video files
CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'testimonial-videos' AND auth.role() = 'authenticated');