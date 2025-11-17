'use client'

import { useState, useEffect } from 'react'
import { Briefcase, CheckCircle, XCircle, Loader2, Info, ExternalLink } from 'lucide-react'

interface Scheme {
  id: string
  name: string
  description: string
  category: string
  benefits: string
  icon: string
}

export default function SchemesPage() {
  const [eligibleSchemes, setEligibleSchemes] = useState<Scheme[]>([])
  const [otherSchemes, setOtherSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(true)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'eligible' | 'all'>('eligible')

  useEffect(() => {
    fetchSchemes()
  }, [])

  const fetchSchemes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/schemes')
      
      if (!response.ok) {
        throw new Error('Failed to fetch schemes')
      }

      const data = await response.json()
      
      if (data.profileIncomplete) {
        setProfileIncomplete(true)
      } else {
        setEligibleSchemes(data.eligible || [])
        setOtherSchemes(data.other || [])
        setUserProfile(data.userProfile)
      }
    } catch (error) {
      console.error('Error fetching schemes:', error)
    } finally {
      setLoading(false)
    }
  }

  const SchemeCard = ({ scheme, isEligible }: { scheme: Scheme; isEligible: boolean }) => (
    <div className={`bg-white rounded-lg border-2 p-6 hover:shadow-lg transition ${
      isEligible ? 'border-green-200' : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{scheme.icon}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{scheme.name}</h3>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mt-1">
                {scheme.category}
              </span>
            </div>
            {isEligible && (
              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                <CheckCircle size={16} />
                Eligible
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-3">{scheme.description}</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
            <p className="text-sm font-semibold text-yellow-800">
              💰 Benefits: {scheme.benefits}
            </p>
          </div>
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
            Learn More
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Briefcase className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Government Schemes</h1>
              <p className="text-gray-600">Personalized recommendations based on your profile</p>
            </div>
          </div>

          {/* User Profile Summary */}
          {userProfile && (
            <div className="bg-white rounded-lg border p-4 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Age:</span>{' '}
                <span className="font-semibold">{userProfile.age} years</span>
              </div>
              <div>
                <span className="text-gray-500">Category:</span>{' '}
                <span className="font-semibold">{userProfile.category}</span>
              </div>
              <div>
                <span className="text-gray-500">State:</span>{' '}
                <span className="font-semibold">{userProfile.state}</span>
              </div>
              <div>
                <span className="text-gray-500">Annual Income:</span>{' '}
                <span className="font-semibold">₹{userProfile.annualIncome?.toLocaleString()}</span>
              </div>
              {userProfile.isBPL && (
                <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                  BPL Category
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        ) : profileIncomplete ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <Info className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your profile with age, category, state, and income details to see personalized scheme recommendations.
            </p>
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition">
              Update Profile
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('eligible')}
                className={`pb-3 px-4 font-semibold transition border-b-2 ${
                  activeTab === 'eligible'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-500'
                }`}
              >
                Eligible for You ({eligibleSchemes.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-4 font-semibold transition border-b-2 ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-500'
                }`}
              >
                All Schemes ({eligibleSchemes.length + otherSchemes.length})
              </button>
            </div>

            {/* Eligible Schemes */}
            {activeTab === 'eligible' && (
              <div>
                {eligibleSchemes.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-12 text-center">
                    <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">
                      No Eligible Schemes Found
                    </h2>
                    <p className="text-gray-600">
                      Based on your current profile, you don't qualify for any schemes yet.
                      Check the "All Schemes" tab to see other available programs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eligibleSchemes.map((scheme) => (
                      <SchemeCard key={scheme.id} scheme={scheme} isEligible={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Schemes */}
            {activeTab === 'all' && (
              <div className="space-y-4">
                {[...eligibleSchemes, ...otherSchemes].map((scheme) => (
                  <SchemeCard
                    key={scheme.id}
                    scheme={scheme}
                    isEligible={eligibleSchemes.some(s => s.id === scheme.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
