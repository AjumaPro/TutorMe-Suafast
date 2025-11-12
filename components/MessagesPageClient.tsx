'use client'

import { useState, useEffect } from 'react'
import { Search, Phone, Video, MoreVertical } from 'lucide-react'
import MessagesList from './MessagesList'
import Image from 'next/image'

interface Conversation {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  userId: string
}

interface MessagesPageClientProps {
  conversations: Conversation[]
  currentUserId: string
}

export default function MessagesPageClient({
  conversations,
  currentUserId,
}: MessagesPageClientProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    conversations[0] || null
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState<Record<string, number>>({})

  // Fetch unread counts for conversations
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const counts: Record<string, number> = {}
      for (const conv of conversations) {
        try {
          const response = await fetch(`/api/messages/unread?recipientId=${conv.userId}`)
          if (response.ok) {
            const data = await response.json()
            counts[conv.userId] = data.count || 0
          }
        } catch (err) {
          console.error('Failed to fetch unread count:', err)
        }
      }
      setConversationUnreadCounts(counts)
    }

    if (conversations.length > 0) {
      fetchUnreadCounts()
      // Refresh unread counts every 10 seconds
      const interval = setInterval(fetchUnreadCounts, 10000)
      return () => clearInterval(interval)
    }
  }, [conversations])

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLastMessageTime = (userId: string) => {
    // This would be fetched from the API, for now return placeholder
    return 'Recently'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Conversations List */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-md flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No conversations found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm ? 'Try a different search term' : 'Start a conversation after booking a lesson'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => {
                const isSelected = selectedConversation?.userId === conversation.userId
                const unreadCount = conversationUnreadCounts[conversation.userId] || 0

                return (
                  <div
                    key={conversation.userId}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-pink-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {conversation.image ? (
                          <Image
                            src={conversation.image}
                            alt={conversation.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {conversation.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {conversation.name}
                          </h3>
                          <span className="text-xs text-gray-500">{getLastMessageTime(conversation.userId)}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conversation.role}</p>
                        {unreadCount > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-md flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConversation.image ? (
                  <Image
                    src={selectedConversation.image}
                    alt={selectedConversation.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {selectedConversation.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedConversation.name}</h3>
                  <p className="text-sm text-gray-500">{selectedConversation.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Call"
                >
                  <Phone className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Video Call"
                >
                  <Video className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="More options"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <MessagesList
              recipientId={selectedConversation.userId}
              recipientName={selectedConversation.name}
              recipientImage={selectedConversation.image}
              currentUserId={currentUserId}
            />
          </>
        )}
      </div>
    </div>
  )
}

