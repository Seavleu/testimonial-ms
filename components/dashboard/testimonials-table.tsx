'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { 
  CheckCircle, 
  X, 
  Search, 
  Eye, 
  Video, 
  ExternalLink,
  Copy 
} from 'lucide-react'
import { format } from 'date-fns'

interface Testimonial {
  id: string
  name: string
  text: string
  video_url: string | null
  approved: boolean
  created_at: string
}

interface TestimonialsTableProps {
  userId: string
}

export function TestimonialsTable({ userId }: TestimonialsTableProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [filteredTestimonials, setFilteredTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTestimonials()
  }, [userId])

  useEffect(() => {
    const filtered = testimonials.filter(testimonial =>
      testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTestimonials(filtered)
  }, [testimonials, searchTerm])

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setTestimonials(data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      toast({
        title: "Error",
        description: "Failed to load testimonials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ approved: true })
        .eq('id', id)

      if (error) throw error

      setTestimonials(prev =>
        prev.map(t => t.id === id ? { ...t, approved: true } : t)
      )

      toast({
        title: "Success",
        description: "Testimonial approved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve testimonial",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTestimonials(prev => prev.filter(t => t.id !== id))

      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive",
      })
    }
  }

  const copyCollectionLink = () => {
    const link = `${window.location.origin}/collect?user_id=${userId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied!",
      description: "Collection link copied to clipboard",
    })
  }

  const approvedCount = testimonials.filter(t => t.approved).length
  const pendingCount = testimonials.filter(t => !t.approved).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{testimonials.length}</div>
            <div className="text-sm text-gray-600">Total Testimonials</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Collection Link</CardTitle>
          <CardDescription>
            Share this link to collect testimonials from your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/collect?user_id=${userId}`}
              readOnly
              className="flex-1"
            />
            <Button onClick={copyCollectionLink} variant="outline" size="sm">
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => window.open(`/collect?user_id=${userId}`, '_blank')}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search testimonials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {filteredTestimonials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {testimonials.length === 0
                  ? "No testimonials yet. Share your collection link to get started!"
                  : "No testimonials match your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      {testimonial.video_url && (
                        <Video className="h-4 w-4 text-blue-600" />
                      )}
                      <Badge
                        variant={testimonial.approved ? "default" : "secondary"}
                      >
                        {testimonial.approved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2 line-clamp-3">{testimonial.text}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(testimonial.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!testimonial.approved && (
                      <Button
                        onClick={() => handleApprove(testimonial.id)}
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(testimonial.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {testimonial.video_url && (
                  <div className="mt-4">
                    <video
                      src={testimonial.video_url}
                      controls
                      className="w-full max-w-md h-auto rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}