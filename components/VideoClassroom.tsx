'use client'

import { useState, useEffect, useRef } from 'react'
import { Video, VideoOff, Mic, MicOff, Maximize2, Minimize2, Users, Settings, Calendar, MapPin, PhoneOff, X, CheckCircle, UserX } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface VideoClassroomProps {
  booking: {
    id: string
    lessonType: string
    scheduledAt: Date | string
    duration: number
    subject: string
    notes?: string | null
    tutor: {
      user: {
        name: string
        email: string
      }
    }
    student: {
      name: string
      email: string
    }
    address?: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  userRole: string
  sessionToken?: string
}

export default function VideoClassroom({ booking, userRole, sessionToken }: VideoClassroomProps) {
  const { data: session } = useSession()
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [participants, setParticipants] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [participantStates, setParticipantStates] = useState<Record<string, { audioMuted: boolean; videoMuted: boolean; approved: boolean }>>({})
  
  // Expected participants based on booking
  const expectedParticipants = [
    { id: booking.tutor?.user?.email || '', name: booking.tutor?.user?.name || 'Unknown Tutor', role: 'TUTOR', email: booking.tutor?.user?.email || '' },
    { id: booking.student?.email || '', name: booking.student?.name || 'Unknown Student', role: 'PARENT', email: booking.student?.email || '' },
  ]
  
  const isTutor = userRole === 'TUTOR'

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const remoteSocketIdRef = useRef<string | null>(null)

  // Initialize video session
  useEffect(() => {
    if (booking.lessonType !== 'ONLINE' || !sessionToken) return

    const initializeVideoSession = async () => {
      try {
        setConnectionStatus('connecting')
        setError(null)

        // Get user media - always request video and audio, control via tracks
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        localStreamRef.current = stream
        
        // Set initial track states
        if (stream.getVideoTracks()[0]) {
          stream.getVideoTracks()[0].enabled = videoEnabled
        }
        if (stream.getAudioTracks()[0]) {
          stream.getAudioTracks()[0].enabled = audioEnabled
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          localVideoRef.current.play().catch(err => {
            console.error('Error playing local video:', err)
          })
        }

        // Connect to signaling server
        const socketUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : 'http://localhost:3000'
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
        })

        socketRef.current = socket

        socket.on('connect', () => {
          console.log('Connected to signaling server')
          
          // Join the video session
          socket.emit('join-session', {
            sessionToken,
            userId: session?.user?.id,
            userRole,
          })
        })


        socket.on('user-left', ({ socketId }: { socketId: string }) => {
          console.log('User left:', socketId)
          // Remove from participants list
          setParticipants((prev) => prev.filter((p) => p.socketId !== socketId))
          
          if (remoteSocketIdRef.current === socketId) {
            remoteSocketIdRef.current = null
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close()
              peerConnectionRef.current = null
            }
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null
            }
          }
        })

        socket.on('offer', async ({ offer, socketId }: { offer: RTCSessionDescriptionInit; socketId: string }) => {
          console.log('Received offer from:', socketId)
          remoteSocketIdRef.current = socketId
          
          if (!peerConnectionRef.current) {
            createPeerConnection()
          }

          await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer))
          const answer = await peerConnectionRef.current!.createAnswer()
          await peerConnectionRef.current!.setLocalDescription(answer)

          socket.emit('answer', {
            sessionToken,
            answer,
            targetSocketId: socketId,
          })
        })

        socket.on('answer', async ({ answer, socketId }: { answer: RTCSessionDescriptionInit; socketId: string }) => {
          console.log('Received answer from:', socketId)
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          }
        })

        socket.on('ice-candidate', async ({ candidate, socketId }: { candidate: RTCIceCandidateInit; socketId: string }) => {
          console.log('Received ICE candidate from:', socketId)
          if (peerConnectionRef.current && candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          }
        })

        socket.on('error', ({ message }: { message: string }) => {
          setError(message)
          setConnectionStatus('disconnected')
        })

        socket.on('disconnect', () => {
          console.log('Disconnected from signaling server')
          setConnectionStatus('disconnected')
        })

        // Create peer connection function
        const createPeerConnection = async (shouldCreateOffer = false) => {
          if (peerConnectionRef.current) return

        const configuration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        }

        const pc = new RTCPeerConnection(configuration)
        peerConnectionRef.current = pc

        // Add local stream tracks
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              pc.addTrack(track, localStreamRef.current!)
        })
          }

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote stream')
          const remoteStream = event.streams[0]
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
            setConnectionStatus('connected')
            
            // Store remote stream tracks for control
            const remoteTracks = {
              video: remoteStream.getVideoTracks()[0],
              audio: remoteStream.getAudioTracks()[0],
            }
            if (remoteSocketIdRef.current) {
              // Store tracks by socket ID for remote control
              ;(pc as any).remoteTracks = remoteTracks
            }
        }

          // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && remoteSocketIdRef.current && socket.connected) {
              socket.emit('ice-candidate', {
                sessionToken,
                candidate: event.candidate,
                targetSocketId: remoteSocketIdRef.current,
              })
          }
        }

        // Handle connection state
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState)
          if (pc.connectionState === 'connected') {
            setConnectionStatus('connected')
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setConnectionStatus('disconnected')
          }
        }

          // Create and send offer if needed
          if (shouldCreateOffer && remoteSocketIdRef.current) {
            try {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              
              socket.emit('offer', {
                sessionToken,
                offer: pc.localDescription,
                targetSocketId: remoteSocketIdRef.current,
              })
            } catch (err) {
              console.error('Error creating offer:', err)
              setError('Failed to establish connection')
            }
          }
        }

        // Store createPeerConnection in a ref so it can be accessed in callbacks
        const createPeerConnectionRef = { current: createPeerConnection }
        
        // Update socket handlers to use the ref
        socket.on('session-participants', async (participantsList: any[]) => {
          // Include current user in participants list with more details
          const currentUserParticipant = {
            userId: session?.user?.id,
            userRole,
            email: session?.user?.email,
            name: session?.user?.name,
          }
          const allParticipants = [
            ...participantsList,
            currentUserParticipant,
          ]
          // Remove duplicates based on userId
          const uniqueParticipants = allParticipants.filter(
            (p, index, self) => index === self.findIndex((t) => t.userId === p.userId)
          )
          setParticipants(uniqueParticipants)
          
          // Initialize states for new participants
          uniqueParticipants.forEach((p) => {
            if (p.userId && !participantStates[p.userId]) {
              setParticipantStates((prev) => ({
                ...prev,
                [p.userId]: {
                  audioMuted: false,
                  videoMuted: false,
                  // Only tutors are auto-approved. Students need tutor approval
                  approved: p.userRole === 'TUTOR',
                },
              }))
            }
          })
          
          // If there are other participants, establish peer connection and create offer
          if (participantsList.length > 0 && !peerConnectionRef.current) {
            await createPeerConnectionRef.current(true)
          }
        })

        socket.on('user-joined', async ({ socketId, userId, userRole: joinedUserRole }: { socketId: string; userId?: string; userRole?: string }) => {
          console.log('User joined:', socketId, userId, joinedUserRole)
          remoteSocketIdRef.current = socketId
          
          // Update participants list
          if (userId) {
            setParticipants((prev) => {
              const exists = prev.some((p) => p.userId === userId || p.socketId === socketId)
              if (!exists) {
                return [...prev, { userId, userRole: joinedUserRole, socketId }]
              }
              return prev
            })
          }
          
          // If we don't have a peer connection yet, create one and send offer
          if (!peerConnectionRef.current) {
            await createPeerConnectionRef.current(true)
          }
        })

        // Handle remote control events (for tutors to control participants)
        socket.on('mute-participant-audio', ({ targetUserId }: { targetUserId: string }) => {
          if (session?.user?.id === targetUserId && localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
              audioTrack.enabled = false
              setAudioEnabled(false)
              setParticipantStates((prev) => ({
                ...prev,
                [targetUserId]: { ...prev[targetUserId], audioMuted: true },
              }))
            }
          }
        })

        socket.on('mute-participant-video', ({ targetUserId }: { targetUserId: string }) => {
          if (session?.user?.id === targetUserId && localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
              videoTrack.enabled = false
              setVideoEnabled(false)
              setParticipantStates((prev) => ({
                ...prev,
                [targetUserId]: { ...prev[targetUserId], videoMuted: true },
              }))
            }
          }
        })

        socket.on('unmute-participant-audio', ({ targetUserId }: { targetUserId: string }) => {
          if (session?.user?.id === targetUserId && localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0]
            if (audioTrack) {
              audioTrack.enabled = true
              setAudioEnabled(true)
              setParticipantStates((prev) => ({
                ...prev,
                [targetUserId]: { ...prev[targetUserId], audioMuted: false },
              }))
            }
          }
        })

        socket.on('unmute-participant-video', ({ targetUserId }: { targetUserId: string }) => {
          if (session?.user?.id === targetUserId && localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0]
            if (videoTrack) {
              videoTrack.enabled = true
              setVideoEnabled(true)
              setParticipantStates((prev) => ({
                ...prev,
                [targetUserId]: { ...prev[targetUserId], videoMuted: false },
              }))
            }
          }
        })

        socket.on('remove-participant', ({ targetUserId }: { targetUserId: string }) => {
          if (session?.user?.id === targetUserId) {
            // End session for this user
            setError('You have been removed from the session')
            setConnectionStatus('disconnected')
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((track) => track.stop())
            }
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close()
            }
            if (socketRef.current) {
              socketRef.current.emit('leave-session', { sessionToken })
              socketRef.current.disconnect()
            }
          }
        })

        socket.on('approve-participant', ({ targetUserId }: { targetUserId: string }) => {
          if (session?.user?.id === targetUserId) {
            setParticipantStates((prev) => ({
              ...prev,
              [targetUserId]: { ...prev[targetUserId], approved: true },
            }))
          }
        })

        socket.on('session-ended', () => {
          // Session was ended by tutor
          setError('Session has been ended by the instructor')
          setConnectionStatus('disconnected')
          
          // Cleanup
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop())
          }
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
          }
          if (socketRef.current) {
            socketRef.current.disconnect()
          }
          
          // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/dashboard'
          }, 3000)
        })

      } catch (error: any) {
        console.error('Error initializing video session:', error)
        setError(error.message || 'Failed to initialize video session')
        setConnectionStatus('disconnected')
      }
    }

    initializeVideoSession()

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (socketRef.current) {
        socketRef.current.emit('leave-session', { sessionToken })
        socketRef.current.disconnect()
      }
    }
  }, [booking.lessonType, sessionToken, session?.user?.id, userRole, audioEnabled, videoEnabled])

  // Toggle video
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled
        setVideoEnabled(!videoEnabled)
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: audioEnabled,
        })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setVideoEnabled(true)
        
        // Add video track to peer connection
        if (peerConnectionRef.current) {
          stream.getVideoTracks().forEach((track) => {
            peerConnectionRef.current!.addTrack(track, stream)
          })
        }
      } catch (error) {
        console.error('Error enabling video:', error)
        setError('Failed to enable video')
      }
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled
        setAudioEnabled(!audioEnabled)
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: true,
        })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setAudioEnabled(true)
        
        // Add audio track to peer connection
        if (peerConnectionRef.current) {
          stream.getAudioTracks().forEach((track) => {
            peerConnectionRef.current!.addTrack(track, stream)
          })
        }
      } catch (error) {
        console.error('Error enabling audio:', error)
        setError('Failed to enable audio')
      }
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // End session (tutor only)
  const endSession = async () => {
    if (!isTutor) return
    
    if (!confirm('Are you sure you want to end this session? All participants will be disconnected.')) {
      return
    }

    try {
      // Notify all participants that session is ending
      if (socketRef.current && sessionToken) {
        socketRef.current.emit('end-session', { sessionToken })
      }

      // Try ending via session token first (for live sessions), then fallback to booking ID
      const endpoint = sessionToken 
        ? `/api/video/live/${sessionToken}/end`
        : `/api/video/session/${booking.id}/end`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        // Cleanup
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop())
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close()
        }
        if (socketRef.current) {
          socketRef.current.emit('leave-session', { sessionToken })
          socketRef.current.disconnect()
        }
        setConnectionStatus('disconnected')
        setError('Session ended successfully')
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to end session')
      }
    } catch (error) {
      console.error('Error ending session:', error)
      setError('Failed to end session')
    }
  }

  // For in-person lessons
  if (booking.lessonType === 'IN_PERSON') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">In-Person Lesson</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-pink-600 mt-1" />
            <div>
              <p className="font-medium">Date & Time</p>
              <p className="text-gray-600">
                {new Date(booking.scheduledAt).toLocaleString()}
              </p>
            </div>
          </div>
          {booking.address && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-pink-600 mt-1" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-gray-600">
                  {booking.address.street}, {booking.address.city},{' '}
                  {booking.address.state} {booking.address.zipCode}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-pink-600 mt-1" />
            <div>
              <p className="font-medium">
                {userRole === 'PARENT' ? 'Tutor' : 'Student'}
              </p>
              <p className="text-gray-600">
                {userRole === 'PARENT'
                  ? booking.tutor?.user?.name || 'Unknown Tutor'
                  : booking.student?.name || 'Unknown Student'}
              </p>
            </div>
          </div>
          {booking.notes && (
            <div>
              <p className="font-medium mb-1">Notes</p>
              <p className="text-gray-600">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Online lesson video classroom
  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Connection Status and Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Connection Status */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
              <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Participants Panel */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants
          </h3>
          <div className="space-y-2">
            {expectedParticipants.map((expected) => {
              const participant = participants.find(
                (p) => 
                  (p.email === expected.email) ||
                  (expected.role === 'TUTOR' && p.userRole === 'TUTOR') ||
                  (expected.role === 'PARENT' && p.userRole === 'PARENT')
              )
              const isJoined = !!participant
              const participantId = participant?.userId || expected.id
              const state = participantStates[participantId] || { audioMuted: false, videoMuted: false, approved: isJoined }
              
              return (
                <div
                  key={expected.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isJoined ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-sm text-gray-700 font-medium">{expected.name}</span>
                    <span className="text-xs text-gray-500">
                      ({expected.role === 'TUTOR' ? 'Tutor' : 'Student'})
                    </span>
                    {isJoined && (
                      <div className="flex items-center gap-1 ml-2">
                        {state.audioMuted && <MicOff className="h-3 w-3 text-red-500" />}
                        {state.videoMuted && <VideoOff className="h-3 w-3 text-red-500" />}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isJoined ? (
                      <>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            state.approved
                              ? 'text-green-700 bg-green-50' 
                              : 'text-yellow-700 bg-yellow-50'
                          }`}
                        >
                          {state.approved ? '✓ Joined' : '⏳ Pending'}
                        </span>
                        {isTutor && expected.role === 'PARENT' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (participant?.userId) {
                                  const isMuted = state.audioMuted
                                  socketRef.current?.emit(isMuted ? 'unmute-participant-audio' : 'mute-participant-audio', {
                                    sessionToken,
                                    targetUserId: participant.userId,
                                  })
                                  setParticipantStates((prev) => ({
                                    ...prev,
                                    [participant.userId]: { 
                                      ...prev[participant.userId] || { audioMuted: false, videoMuted: false, approved: true },
                                      audioMuted: !isMuted,
                                    },
                                  }))
                                }
                              }}
                              className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
                                state.audioMuted ? 'bg-red-50' : ''
                              }`}
                              title={state.audioMuted ? 'Unmute Audio' : 'Mute Audio'}
                            >
                              <MicOff className={`h-3.5 w-3.5 ${state.audioMuted ? 'text-red-600' : 'text-gray-600'}`} />
                            </button>
                            <button
                              onClick={() => {
                                if (participant?.userId) {
                                  const isMuted = state.videoMuted
                                  socketRef.current?.emit(isMuted ? 'unmute-participant-video' : 'mute-participant-video', {
                                    sessionToken,
                                    targetUserId: participant.userId,
                                  })
                                  setParticipantStates((prev) => ({
                                    ...prev,
                                    [participant.userId]: { 
                                      ...prev[participant.userId] || { audioMuted: false, videoMuted: false, approved: true },
                                      videoMuted: !isMuted,
                                    },
                                  }))
                                }
                              }}
                              className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${
                                state.videoMuted ? 'bg-red-50' : ''
                              }`}
                              title={state.videoMuted ? 'Unmute Video' : 'Mute Video'}
                            >
                              <VideoOff className={`h-3.5 w-3.5 ${state.videoMuted ? 'text-red-600' : 'text-gray-600'}`} />
                            </button>
                            {!state.approved && isTutor && (
                              <button
                                onClick={() => {
                                  if (participant?.userId) {
                                    socketRef.current?.emit('approve-participant', {
                                      sessionToken,
                                      targetUserId: participant.userId,
                                    })
                                    setParticipantStates((prev) => ({
                                      ...prev,
                                      [participant.userId]: { ...prev[participant.userId], approved: true },
                                    }))
                                  }
                                }}
                                className="p-1 hover:bg-green-100 rounded transition-colors"
                                title="Approve Student"
                              >
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (participant?.userId && confirm(`Remove ${expected.name} from the session?`)) {
                                  socketRef.current?.emit('remove-participant', {
                                    sessionToken,
                                    targetUserId: participant.userId,
                                  })
                                  setParticipants((prev) => prev.filter((p) => p.userId !== participant.userId))
                                }
                              }}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="Remove"
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 rounded text-gray-500 bg-gray-100">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div ref={containerRef} className="bg-white rounded-xl shadow-md p-6">
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={() => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.play().catch(err => {
                  console.error('Error playing remote video:', err)
                })
              }
            }}
          />

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-gray-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                if (localVideoRef.current) {
                  localVideoRef.current.play().catch(err => {
                    console.error('Error playing local video:', err)
                  })
                }
              }}
            />
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* No Remote Video Placeholder */}
          {connectionStatus !== 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">
                  {connectionStatus === 'connecting' 
                    ? 'Connecting...' 
                    : 'Waiting for participant...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              audioEnabled
                ? 'bg-pink-600 text-white hover:bg-pink-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              videoEnabled
                ? 'bg-pink-600 text-white hover:bg-pink-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>

          <button
            className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          {isTutor && (
            <button
              onClick={endSession}
              className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="End session (Tutor only)"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {userRole === 'PARENT' ? 'Tutor' : 'Student'}:{' '}
            {userRole === 'PARENT'
              ? booking.tutor?.user?.name || 'Unknown Tutor'
              : booking.student?.name || 'Unknown Student'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Subject: {booking.subject} • Duration: {booking.duration} minutes
          </p>
        </div>
      </div>

      {/* Lesson Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold mb-4">Lesson Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Date & Time</p>
            <p className="font-medium text-gray-800">
              {new Date(booking.scheduledAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Duration</p>
            <p className="font-medium text-gray-800">{booking.duration} minutes</p>
          </div>
          {booking.notes && (
            <div className="md:col-span-2">
              <p className="text-gray-500 mb-1">Notes</p>
              <p className="text-gray-800">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
