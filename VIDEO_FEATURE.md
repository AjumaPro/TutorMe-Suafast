# Video Session Feature Documentation

## Overview

TutorMe now includes a fully integrated in-house video conferencing system for live sessions between students and tutors. The system uses WebRTC for peer-to-peer video communication and Socket.io for signaling.

## Features

- ✅ Real-time video and audio communication
- ✅ WebRTC peer-to-peer connection (low latency)
- ✅ Automatic session creation when booking is confirmed
- ✅ Secure session tokens for access control
- ✅ Video/audio controls (mute, camera on/off)
- ✅ Fullscreen mode
- ✅ Connection status indicators
- ✅ Session management (start/end)
- ✅ Automatic cleanup on disconnect

## Architecture

### Components

1. **Custom Server (`server.js`)**
   - Handles both Next.js HTTP requests and WebSocket connections
   - Socket.io server for WebRTC signaling
   - Manages active video sessions in memory

2. **Video Session API (`/api/video/session`)**
   - `POST /api/video/session` - Create or get video session
   - `GET /api/video/session?bookingId=xxx` - Get existing session
   - `POST /api/video/session/[id]/end` - End a video session

3. **VideoClassroom Component**
   - Main video interface component
   - Handles WebRTC peer connection
   - Manages media streams (video/audio)
   - UI controls for video/audio/fullscreen

4. **VideoClassroomWrapper Component**
   - Client-side wrapper that fetches session token if needed
   - Handles loading states and errors
   - Automatically creates session if it doesn't exist

### Database Schema

New `VideoSession` model:
```prisma
model VideoSession {
  id            String   @id @default(cuid())
  bookingId     String   @unique
  sessionToken  String   @unique
  status        String   @default("ACTIVE") // ACTIVE, ENDED
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  booking       Booking  @relation(...)
}
```

## How It Works

### Session Flow

1. **Booking Confirmation**
   - When a booking is confirmed (status = CONFIRMED), a video session is automatically created
   - A unique session token is generated and stored in the database

2. **Joining a Session**
   - User navigates to the lesson page (`/lessons/[id]`)
   - If booking is ONLINE and CONFIRMED/COMPLETED, video classroom is displayed
   - VideoClassroomWrapper fetches or creates the session token
   - VideoClassroom component connects to Socket.io server

3. **WebRTC Connection**
   - Client requests camera/microphone permissions
   - Connects to Socket.io signaling server
   - Joins session room using session token
   - Exchanges WebRTC offer/answer/ICE candidates via Socket.io
   - Establishes peer-to-peer connection
   - Video/audio streams are exchanged directly between peers

4. **Session End**
   - User clicks "End Session" button
   - Session status updated to ENDED in database
   - All media streams and connections are cleaned up

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed:
- `socket.io` - WebSocket server
- `socket.io-client` - WebSocket client

### 2. Database Migration

The schema has been updated. Run:
```bash
npx prisma generate
npx prisma db push
```

### 3. Start the Server

The custom server handles both HTTP and WebSocket connections:

```bash
npm run dev
```

This starts the server on `http://localhost:3000` with Socket.io support.

### 4. Environment Variables

No additional environment variables are required. The system uses:
- `NEXTAUTH_URL` (if set) for CORS configuration
- Defaults to `http://localhost:3000` for development

## Usage

### For Students/Tutors

1. Book an online lesson with a tutor
2. Complete payment to confirm the booking
3. Navigate to the lesson page (`/lessons/[bookingId]`)
4. Video classroom will automatically load
5. Allow camera/microphone permissions when prompted
6. Wait for the other participant to join
7. Start your lesson!

### Controls

- **Microphone Button**: Toggle audio on/off
- **Camera Button**: Toggle video on/off
- **Fullscreen Button**: Enter/exit fullscreen mode
- **Settings Button**: (Placeholder for future settings)
- **End Session Button**: End the video session

## Technical Details

### WebRTC Configuration

- **STUN Servers**: Google's public STUN servers
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`

- **ICE Candidates**: Exchanged via Socket.io signaling server

- **Media Constraints**: 
  - Video: Optional (can be toggled)
  - Audio: Enabled by default

### Signaling Protocol

Socket.io events:
- `join-session` - Join a video session room
- `user-joined` - Notify when a user joins
- `user-left` - Notify when a user leaves
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidate exchange
- `leave-session` - Leave the session

### Security

- Session tokens are cryptographically random (32 bytes)
- Only authorized users (student/tutor) can access sessions
- Session tokens are validated on the server
- WebSocket connections are authenticated via NextAuth session

## Troubleshooting

### Video/Audio Not Working

1. **Check Browser Permissions**
   - Ensure camera/microphone permissions are granted
   - Check browser settings for site permissions

2. **Check Connection Status**
   - Look for connection indicator (green = connected)
   - Check browser console for errors

3. **Firewall/NAT Issues**
   - WebRTC may require TURN servers for strict NATs
   - Consider adding TURN servers for production

### Socket.io Connection Issues

1. **Check Server is Running**
   - Ensure `npm run dev` is running
   - Check server logs for errors

2. **CORS Issues**
   - Verify `NEXTAUTH_URL` matches your app URL
   - Check browser console for CORS errors

### Session Not Found

- Video sessions are only created for ONLINE bookings
- Booking must be CONFIRMED or COMPLETED
- Check database for VideoSession record

## Future Enhancements

- [ ] Screen sharing
- [ ] Chat during video session
- [ ] Recording sessions
- [ ] TURN server for better NAT traversal
- [ ] Multiple participants (group lessons)
- [ ] Whiteboard/collaborative tools
- [ ] Session quality metrics
- [ ] Mobile app support

## Production Considerations

1. **TURN Servers**: Add TURN servers for better connectivity behind NATs
2. **Scaling**: Consider Redis for session management in multi-server setup
3. **Monitoring**: Add logging and monitoring for video sessions
4. **Rate Limiting**: Implement rate limiting for session creation
5. **Session Timeout**: Add automatic session timeout after lesson duration

## Support

For issues or questions, check:
- Browser console for errors
- Server logs for connection issues
- Database for session records
- Network tab for WebSocket connections

