'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import { Upload, CheckCircle } from 'lucide-react'

const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  text: z.string().min(10, 'Testimonial must be at least 10 characters').max(500, 'Testimonial must be less than 500 characters'),
  video: z.instanceof(File).optional().nullable(),
})

type TestimonialForm = z.infer<typeof testimonialSchema>

interface CollectionFormProps {
  userId?: string
}

export function CollectionForm({ userId }: CollectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TestimonialForm>({
    resolver: zodResolver(testimonialSchema),
  })

  const textValue = watch('text', '')

  const onSubmit = async (data: TestimonialForm) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Invalid collection link. Please contact the business owner.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      let videoUrl = null

      // Upload video if provided
      if (data.video) {
        const fileExt = data.video.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('testimonial-videos')
          .upload(fileName, data.video)

        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('testimonial-videos')
          .getPublicUrl(uploadData.path)
          
        videoUrl = publicUrl
      }

      // Create testimonial
      const { error } = await supabase
        .from('testimonials')
        .insert({
          user_id: userId,
          name: data.name,
          text: data.text,
          video_url: videoUrl,
          approved: false,
        })

      if (error) throw error

      setIsSuccess(true)
      toast({
        title: "Thank you!",
        description: "Your testimonial has been submitted and is awaiting approval.",
      })
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      toast({
        title: "Error",
        description: "Failed to submit testimonial. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600">
            Your testimonial has been submitted successfully. It will be reviewed and published once approved.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <CardDescription>
          Your testimonial helps others understand the value of this service. All testimonials are reviewed before being published.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter your full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="text">Your Testimonial *</Label>
            <Textarea
              id="text"
              {...register('text')}
              placeholder="Share your experience and how this service helped you..."
              rows={4}
              className={errors.text ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.text && (
                <p className="text-sm text-red-500">{errors.text.message}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {textValue.length}/500 characters
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="video">Video Testimonial (Optional)</Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="video-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a video</span>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setValue('video', file || null)
                      }}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  MP4, WebM up to 50MB, max 30 seconds
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}