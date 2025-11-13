const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

// Handle unhandled promise rejections (webpack cache errors, etc.)
process.on('unhandledRejection', (reason, promise) => {
  // Ignore webpack cache errors - they're non-critical
  if (reason && typeof reason === 'object' && 'code' in reason && reason.code === 'ENOENT') {
    const path = reason.path || ''
    if (path.includes('.next/cache/webpack')) {
      // Silently ignore webpack cache file errors
      return
    }
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Store active video sessions
const activeSessions = new Map()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      if (!res.headersSent) {
        res.statusCode = 500
        res.end('internal server error')
      }
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join a video session room
    socket.on('join-session', async ({ sessionToken, userId, userRole }) => {
      try {
        socket.join(sessionToken)
        const sessionKey = `session:${sessionToken}`
        
        if (!activeSessions.has(sessionKey)) {
          activeSessions.set(sessionKey, {
            participants: new Map(),
            createdAt: new Date(),
          })
        }

        const session = activeSessions.get(sessionKey)
        // Store user role for authorization checks
        session.participants.set(socket.id, { userId, userRole, socketId: socket.id })

        // Notify others in the room
        socket.to(sessionToken).emit('user-joined', {
          socketId: socket.id,
          userId,
          userRole,
        })

        // Send list of existing participants to all in the room
        const participants = Array.from(session.participants.values())
        io.to(sessionToken).emit('session-participants', participants)

        console.log(`User ${userId} (${userRole}) joined session ${sessionToken}`)
      } catch (error) {
        console.error('Error joining session:', error)
        socket.emit('error', { message: 'Failed to join session' })
      }
    })

    // Handle WebRTC offer
    socket.on('offer', ({ sessionToken, offer, targetSocketId }) => {
      socket.to(sessionToken).emit('offer', {
        offer,
        socketId: socket.id,
        targetSocketId,
      })
    })

    // Handle WebRTC answer
    socket.on('answer', ({ sessionToken, answer, targetSocketId }) => {
      socket.to(sessionToken).emit('answer', {
        answer,
        socketId: socket.id,
        targetSocketId,
      })
    })

    // Handle ICE candidates
    socket.on('ice-candidate', ({ sessionToken, candidate, targetSocketId }) => {
      socket.to(sessionToken).emit('ice-candidate', {
        candidate,
        socketId: socket.id,
        targetSocketId,
      })
    })

    // Handle participant control (tutor only)
    // Helper function to check if requester is tutor
    const isTutor = (sessionKey, socketId) => {
      const session = activeSessions.get(sessionKey)
      if (!session) return false
      const requester = session.participants.get(socketId)
      return requester && requester.userRole === 'TUTOR'
    }

    socket.on('mute-participant-audio', ({ sessionToken, targetUserId }) => {
      const sessionKey = `session:${sessionToken}`
      if (!isTutor(sessionKey, socket.id)) {
        socket.emit('error', { message: 'Only tutors can control participants' })
        return
      }
      const session = activeSessions.get(sessionKey)
      if (session) {
        // Find target participant's socket
        const targetParticipant = Array.from(session.participants.entries()).find(
          ([_, p]) => p.userId === targetUserId
        )
        if (targetParticipant) {
          io.to(targetParticipant[0]).emit('mute-participant-audio', { targetUserId })
        }
      }
    })

    socket.on('mute-participant-video', ({ sessionToken, targetUserId }) => {
      const sessionKey = `session:${sessionToken}`
      if (!isTutor(sessionKey, socket.id)) {
        socket.emit('error', { message: 'Only tutors can control participants' })
        return
      }
      const session = activeSessions.get(sessionKey)
      if (session) {
        const targetParticipant = Array.from(session.participants.entries()).find(
          ([_, p]) => p.userId === targetUserId
        )
        if (targetParticipant) {
          io.to(targetParticipant[0]).emit('mute-participant-video', { targetUserId })
        }
      }
    })

    socket.on('unmute-participant-audio', ({ sessionToken, targetUserId }) => {
      const sessionKey = `session:${sessionToken}`
      if (!isTutor(sessionKey, socket.id)) {
        socket.emit('error', { message: 'Only tutors can control participants' })
        return
      }
      const session = activeSessions.get(sessionKey)
      if (session) {
        const targetParticipant = Array.from(session.participants.entries()).find(
          ([_, p]) => p.userId === targetUserId
        )
        if (targetParticipant) {
          io.to(targetParticipant[0]).emit('unmute-participant-audio', { targetUserId })
        }
      }
    })

    socket.on('unmute-participant-video', ({ sessionToken, targetUserId }) => {
      const sessionKey = `session:${sessionToken}`
      if (!isTutor(sessionKey, socket.id)) {
        socket.emit('error', { message: 'Only tutors can control participants' })
        return
      }
      const session = activeSessions.get(sessionKey)
      if (session) {
        const targetParticipant = Array.from(session.participants.entries()).find(
          ([_, p]) => p.userId === targetUserId
        )
        if (targetParticipant) {
          io.to(targetParticipant[0]).emit('unmute-participant-video', { targetUserId })
        }
      }
    })

    socket.on('remove-participant', ({ sessionToken, targetUserId }) => {
      const sessionKey = `session:${sessionToken}`
      if (!isTutor(sessionKey, socket.id)) {
        socket.emit('error', { message: 'Only tutors can remove participants' })
        return
      }
      const session = activeSessions.get(sessionKey)
      if (session) {
        const targetParticipant = Array.from(session.participants.entries()).find(
          ([_, p]) => p.userId === targetUserId
        )
        if (targetParticipant) {
          const [socketId] = targetParticipant
          session.participants.delete(socketId)
          io.to(socketId).emit('remove-participant', { targetUserId })
          const remainingParticipants = Array.from(session.participants.values())
          io.to(sessionToken).emit('session-participants', remainingParticipants)
        }
      }
    })

    // Approve participant (tutor only)
    socket.on('approve-participant', ({ sessionToken, targetUserId }) => {
      const sessionKey = `session:${sessionToken}`
      const session = activeSessions.get(sessionKey)
      if (session) {
        // Check if requester is a tutor
        const requester = session.participants.get(socket.id)
        if (!requester || requester.userRole !== 'TUTOR') {
          socket.emit('error', { message: 'Only tutors can approve participants' })
          return
        }

        // Find target participant's socket
        const targetParticipant = Array.from(session.participants.entries()).find(
          ([_, p]) => p.userId === targetUserId
        )
        if (targetParticipant) {
          io.to(targetParticipant[0]).emit('approve-participant', { targetUserId })
          console.log(`Tutor ${requester.userId} approved participant ${targetUserId} in session ${sessionToken}`)
        }
      }
    })

    // Handle ending session (tutor only)
    socket.on('end-session', ({ sessionToken }) => {
      const sessionKey = `session:${sessionToken}`
      const session = activeSessions.get(sessionKey)
      
      if (session) {
        // Check if requester is a tutor
        const requester = session.participants.get(socket.id)
        if (!requester || requester.userRole !== 'TUTOR') {
          socket.emit('error', { message: 'Only tutors can end sessions' })
          return
        }

        // Notify all participants that session is ending
        io.to(sessionToken).emit('session-ended')
        
        // Clean up all participants
        session.participants.clear()
        activeSessions.delete(sessionKey)
        
        console.log(`Session ${sessionToken} ended by tutor ${requester.userId}`)
      }
    })

    // Handle leaving session
    socket.on('leave-session', ({ sessionToken }) => {
      const sessionKey = `session:${sessionToken}`
      const session = activeSessions.get(sessionKey)
      
      if (session) {
        session.participants.delete(socket.id)
        // Notify all participants about the user leaving
        const remainingParticipants = Array.from(session.participants.values())
        io.to(sessionToken).emit('user-left', { socketId: socket.id })
        io.to(sessionToken).emit('session-participants', remainingParticipants)
        
        // Clean up empty sessions
        if (session.participants.size === 0) {
          activeSessions.delete(sessionKey)
        }
      }
      
      socket.leave(sessionToken)
      console.log(`User left session ${sessionToken}`)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      
      // Clean up from all sessions
      for (const [sessionKey, session] of activeSessions.entries()) {
        if (session.participants.has(socket.id)) {
          const sessionToken = sessionKey.replace('session:', '')
          session.participants.delete(socket.id)
          socket.to(sessionToken).emit('user-left', { socketId: socket.id })
          
          if (session.participants.size === 0) {
            activeSessions.delete(sessionKey)
          }
        }
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Environment: ${dev ? 'development' : 'production'}`)
    })
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  process.exit(1)
})

