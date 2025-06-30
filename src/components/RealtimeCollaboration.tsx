'use client';

import React, { useEffect, useState } from 'react';
import { config } from '@/lib/config';
import { 
  RoomProvider, 
  useOthers, 
  useUpdateMyPresence, 
  useSelf,
  isLiveblocksEnabled,
  generateUserColor,
  generateUserName 
} from '@/lib/liveblocks';

// Live cursors component
function LiveCursors() {
  const others = useOthers();
  
  if (!isLiveblocksEnabled()) return null;

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence.cursor) return null;
        
        return (
          <div
            key={connectionId}
            className="absolute pointer-events-none z-50"
            style={{
              left: presence.cursor.x,
              top: presence.cursor.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Cursor dot */}
            <div 
              className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: presence.user?.color || '#666' }}
            />
            
            {/* User name */}
            {presence.user?.name && (
              <div 
                className="absolute top-4 left-0 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
                style={{ backgroundColor: presence.user.color || '#666' }}
              >
                {presence.user.name}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// User presence indicator
function UserPresence() {
  const others = useOthers();
  const self = useSelf();
  
  if (!isLiveblocksEnabled()) return null;
  
  const allUsers = [
    ...(self ? [{ ...self, connectionId: 'self' }] : []),
    ...others
  ];

  return (
    <div className="absolute top-4 left-4 z-50 bg-black/70 text-white px-3 py-2 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="flex -space-x-2">
          {allUsers.slice(0, 4).map(({ connectionId, presence }) => (
            <div
              key={connectionId}
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: presence.user?.color || '#666' }}
              title={presence.user?.name || 'Anonymous'}
            >
              {presence.user?.name?.charAt(0) || '?'}
            </div>
          ))}
          {allUsers.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center text-xs text-white">
              +{allUsers.length - 4}
            </div>
          )}
        </div>
        <span className="text-sm">
          {allUsers.length} online
        </span>
      </div>
    </div>
  );
}

// Mouse tracking component
function MouseTracker({ children }: { children: React.ReactNode }) {
  const updateMyPresence = useUpdateMyPresence();
  const [user, setUser] = useState({
    name: '',
    color: ''
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser({
      name: generateUserName(),
      color: generateUserColor(),
    });
  }, []);

  useEffect(() => {
    if (isLiveblocksEnabled() && mounted && user.name) {
      updateMyPresence({ user });
    }
  }, [updateMyPresence, user, mounted]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLiveblocksEnabled() && mounted) {
      updateMyPresence({
        cursor: { x: e.clientX, y: e.clientY },
      });
    }
  };

  const handleMouseLeave = () => {
    if (isLiveblocksEnabled() && mounted) {
      updateMyPresence({ cursor: null });
    }
  };

  // Don't render interactive elements until mounted
  if (!mounted) {
    return <div className="relative w-full h-full">{children}</div>;
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full"
    >
      {children}
      <LiveCursors />
      <UserPresence />
    </div>
  );
}

// Main wrapper component
interface RealtimeCollaborationProps {
  children: React.ReactNode;
  roomId?: string;
}

export function RealtimeCollaboration({ 
  children, 
  roomId = 'demo-room' 
}: RealtimeCollaborationProps) {
  // Easy disable check
  if (!isLiveblocksEnabled()) {
    return <>{children}</>;
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        user: null,
      }}
    >
      <MouseTracker>
        {children}
      </MouseTracker>
    </RoomProvider>
  );
}

export default RealtimeCollaboration;