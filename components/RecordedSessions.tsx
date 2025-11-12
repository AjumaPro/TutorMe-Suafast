'use client'

import Image from 'next/image'
import { Play } from 'lucide-react'

interface RecordedSession {
  id: string
  title: string
  size: string
  duration: string
  format: string
  thumbnail?: string
}

interface RecordedSessionsProps {
  sessions: RecordedSession[]
}

export default function RecordedSessions({ sessions }: RecordedSessionsProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recorded Sessions</h2>
        {sessions.length > 0 && (
          <span className="text-sm text-gray-500">Video recording coming soon</span>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              {session.thumbnail ? (
                <Image
                  src={session.thumbnail}
                  alt={session.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-2 p-4 opacity-50">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gray-400 rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
                <div className="bg-white/90 rounded-full p-3">
                  <Play className="h-6 w-6 text-gray-800 ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2">
                <div className="bg-white/80 rounded-full p-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-800 mb-1">{session.title}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{session.size}</span>
                <span>•</span>
                <span>{session.duration}</span>
                <span>•</span>
                <span className="uppercase">{session.format}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

