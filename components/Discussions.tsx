'use client'

import { Paperclip, Send, Mail } from 'lucide-react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  sender: string
  senderRole?: string
  content: string
  timestamp: string
  avatar?: string
}

interface Participant {
  id: string
  name: string
  avatar?: string
  isActive?: boolean
}

interface DiscussionsProps {
  participants: Participant[]
  messages: Message[]
  currentUserId: string
}

export default function Discussions({
  participants,
  messages,
  currentUserId,
}: DiscussionsProps) {
  const { data: session } = useSession()
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      // TODO: Implement actual message sending
      // For now, just clear the input
      console.log('Sending message:', newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Discussions</h2>
        <span className="text-xs text-gray-500 uppercase tracking-wide">ROOM CHAT</span>
      </div>

      {/* Participants - Only show if there are participants */}
      {participants.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`relative ${
                  participant.isActive ? 'ring-2 ring-pink-500 ring-offset-2' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                {participant.isActive && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="mb-4 min-h-[200px] max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Mail className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No messages yet</p>
            <p className="text-xs text-gray-400">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{message.sender}</span>
                  {message.senderRole && (
                    <span className="text-xs text-gray-500">({message.senderRole})</span>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{message.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{message.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Write a message..."
          disabled={isSending}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="p-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
