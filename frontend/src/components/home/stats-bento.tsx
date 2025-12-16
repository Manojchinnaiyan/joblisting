'use client'

import { Briefcase, Building2, Users, TrendingUp, ArrowUpRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const features = [
  'AI-Powered Job Matching',
  'Instant Applications',
  'Company Reviews',
  'Salary Insights',
]

export function StatsBento() {
  return (
    <section className="bg-[#0f0f1a] text-white py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {/* Main CTA Card */}
          <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Ready to Find Your
                <br />
                <span className="text-lime-400">Perfect Role?</span>
              </h2>
              <p className="mt-4 text-purple-200 max-w-md">
                Join thousands of professionals who found their dream jobs through JobsWorld.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-lime-400 text-gray-900 rounded-full font-semibold hover:bg-lime-300 transition-colors"
                >
                  Get Started Free
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-50" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-lime-400 rounded-full blur-2xl opacity-20" />
          </div>

          {/* Stats Cards */}
          <div className="bg-lime-400 text-gray-900 rounded-3xl p-6 flex flex-col justify-between">
            <Briefcase className="h-8 w-8" />
            <div className="mt-4">
              <p className="text-4xl font-bold">10K+</p>
              <p className="text-gray-700 mt-1">Active Jobs</p>
            </div>
          </div>

          <div className="bg-white text-gray-900 rounded-3xl p-6 flex flex-col justify-between">
            <Building2 className="h-8 w-8" />
            <div className="mt-4">
              <p className="text-4xl font-bold">5K+</p>
              <p className="text-gray-500 mt-1">Companies</p>
            </div>
          </div>

          <div className="bg-orange-400 text-white rounded-3xl p-6 flex flex-col justify-between">
            <Users className="h-8 w-8" />
            <div className="mt-4">
              <p className="text-4xl font-bold">50K+</p>
              <p className="text-orange-100 mt-1">Job Seekers</p>
            </div>
          </div>

          <div className="bg-gray-800 text-white rounded-3xl p-6 flex flex-col justify-between">
            <TrendingUp className="h-8 w-8 text-lime-400" />
            <div className="mt-4">
              <p className="text-4xl font-bold">95%</p>
              <p className="text-gray-400 mt-1">Success Rate</p>
            </div>
          </div>

          {/* Features Card */}
          <div className="md:col-span-2 bg-gray-800 rounded-3xl p-6 md:p-8">
            <h3 className="text-xl font-bold mb-4">Why Choose Us?</h3>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-lime-400 shrink-0" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
