// News page - Shows local news based on user's city + general civic news
// Displays news about schemes, scholarships, achievements, and civic issues

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Newspaper, ExternalLink, MapPin, TrendingUp, Award, Briefcase, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface NewsArticle {
  title: string
  description: string
  url: string
  image?: string
  publishedAt: string
  source: {
    name: string
    url: string
  }
  category: 'local' | 'general' | 'schemes'
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchNews = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/news')
      const data = await response.json()

      if (response.ok) {
        setArticles(data.articles || [])
        setUserCity(data.userCity)
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'local':
        return <MapPin className="w-4 h-4" />
      case 'schemes':
        return <Briefcase className="w-4 h-4" />
      default:
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'local':
        return 'bg-blue-100 text-blue-700'
      case 'schemes':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-purple-100 text-purple-700'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'local':
        return 'Local News'
      case 'schemes':
        return 'Schemes & Scholarships'
      default:
        return 'General'
    }
  }

  const filteredArticles = activeTab === 'all' 
    ? articles 
    : articles.filter(article => article.category === activeTab)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Newspaper className="w-10 h-10 text-blue-600" />
              Civic News
            </h1>
            {userCity && (
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Showing news for <span className="font-semibold">{userCity}</span>
              </p>
            )}
          </div>
          <Button
            onClick={fetchNews}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-gray-600">
          Stay updated with local news, government schemes, scholarships, and civic achievements
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All News</TabsTrigger>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="schemes">Schemes</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* News Articles */}
      {!loading && filteredArticles.length === 0 && (
        <Card className="p-12 text-center">
          <Newspaper className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No news found</h3>
          <p className="text-gray-500">Try refreshing or check back later</p>
        </Card>
      )}

      {!loading && filteredArticles.length > 0 && (
        <div className="space-y-4">
          {filteredArticles.map((article, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(article.category)}>
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(article.category)}
                          {getCategoryLabel(article.category)}
                        </span>
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer">
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </a>
                    </CardTitle>
                  </div>
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700 mb-4 line-clamp-3">
                  {article.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Newspaper className="w-4 h-4" />
                    <span>{article.source.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                    asChild
                  >
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      Read More
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && filteredArticles.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {articles.filter(a => a.category === 'local').length}
              </p>
              <p className="text-sm text-gray-600">Local News</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.category === 'schemes').length}
              </p>
              <p className="text-sm text-gray-600">Schemes & Scholarships</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {articles.filter(a => a.category === 'general').length}
              </p>
              <p className="text-sm text-gray-600">General News</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
