'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/hooks/use-toast';

// Initialize Supabase client safely
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export default function Collect() {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      toast({
        title: "Configuration Error",
        description: "Supabase credentials are missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      let videoUrl = null;
      if (video) {
        const fileName = `videos/${Date.now()}_${video.name}`;
        const { data, error } = await supabase.storage
          .from('testimonials')
          .upload(fileName, video);
        if (error) throw error;
        videoUrl = supabase.storage.from('testimonials').getPublicUrl(fileName).data.publicUrl;
      }

      const { error } = await supabase.from('testimonials').insert({
        name: name.slice(0, 100),
        text: text.slice(0, 500),
        video_url: videoUrl,
        approved: false,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast({
        title: "Success",
        description: "Testimonial submitted successfully!",
      });
      setName('');
      setText('');
      setVideo(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error submitting testimonial.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl mb-4 text-gray-900">Submit Testimonial</h1>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-4 border rounded text-gray-900"
          required
        />
        <textarea
          placeholder="Your testimonial"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 mb-4 border rounded text-gray-900"
          required
        />
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideo(e.target.files?.[0] || null)}
          className="w-full p-2 mb-4"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600">
          Submit
        </button>
      </form>
    </div>
  );
}