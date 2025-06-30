// Liveblocks real-time collaboration setup for Hexies
import React from "react";
import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { config } from "./config";
import { HexagonData } from "./hexagon-physics";

// Enhanced type definitions for real-time collaboration
export type Presence = {
  cursor: { x: number; y: number } | null;
  user: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  } | null;
  mode: 'select' | 'pan' | 'hexie' | null;
  selectedHexagons: string[];
  isDragging: boolean;
  draggedHexagon?: string;
};

export type LiveHexagon = {
  id: string;
  x: number;
  y: number;
  hexie_card_id: string;
  hexie_card_data: any; // Full hexie card data for offline work
  is_flipped: boolean;
  created_by: string;
  created_at: number;
  last_updated: number;
  z_index: number;
  locked_by?: string; // User ID who has locked this hexagon
  lock_expires?: number; // Timestamp when lock expires
};

export type LiveTheme = {
  id: string;
  name: string;
  type: string;
  color: string;
  hexies: string[];
  isEditing?: boolean;
  rating?: number;
  ratedBy?: string[];
  description?: string;
  createdBy?: string;
  createdAt?: number;
};

export type Storage = {
  // Real-time hexagon positions with full collaboration data
  hexagons: Record<string, LiveHexagon>;
  // Real-time themes for pattern organization
  themes: Record<string, LiveTheme>;
  workspace_settings: {
    grid_visible: boolean;
    snap_enabled: boolean;
    zoom: number;
    pan_x: number;
    pan_y: number;
    background_color?: string;
  };
  // Session metadata
  session_info: {
    created_at: number;
    last_activity: number;
    total_participants: number;
  };
};

// Easy disable check with environment variables
export const isLiveblocksEnabled = () => {
  // Only check on client side to prevent hydration mismatches
  if (typeof window === 'undefined') {
    return false;
  }
  
  const publicKey = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  
  // Check if keys exist and are properly formatted
  const hasValidKeys = publicKey && 
                      secretKey && 
                      publicKey.startsWith('pk_') && 
                      secretKey.startsWith('sk_') &&
                      publicKey !== secretKey;
    
  return config.features.liveblocks && hasValidKeys;
};

// Enhanced client setup with better configuration
export const client = isLiveblocksEnabled() 
  ? createClient({
      publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
      throttle: 16, // 60fps updates
      // Optimize for hexagon collaboration
      lossy: true, // Allow lossy updates for cursor movements
      polyfills: {
        fetch: typeof fetch !== 'undefined' ? fetch : undefined,
      },
    })
  : null;

// Create fallback component that doesn't crash
const FallbackRoomProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

// Mock context for development/disabled state
const mockContext = {
  RoomProvider: FallbackRoomProvider,
  useOthers: () => [],
  useUpdateMyPresence: () => () => {},
  useSelf: () => null,
  useStorage: () => null,
  useMutation: () => () => {},
  useCanUndo: () => false,
  useCanRedo: () => false,
  useUndo: () => () => {},
  useRedo: () => () => {},
};

// Room context (only if enabled and client exists)  
const roomContext = client && isLiveblocksEnabled()
  ? createRoomContext<Presence, Storage>(client)
  : mockContext;

export const {
  RoomProvider,
  useOthers,
  useUpdateMyPresence,
  useSelf,
  useStorage,
  useMutation,
  useCanUndo,
  useCanRedo,
  useUndo,
  useRedo,
} = roomContext;

// Enhanced user utilities for better collaboration experience
export const generateUserColor = () => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#A8E6CF", "#88D8A3", "#6C7B95", "#B8860B",
    "#FF7F7F", "#87CEEB", "#DDA0DD", "#F0E68C"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const generateUserName = () => {
  const adjectives = ["Quick", "Bright", "Clever", "Swift", "Bold", "Wise", "Creative", "Focused", "Agile", "Sharp"];
  const roles = ["Designer", "Thinker", "Builder", "Explorer", "Innovator", "Strategist", "Architect", "Catalyst", "Visionary", "Pioneer"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${roles[Math.floor(Math.random() * roles.length)]}`;
};

// Utility to lock/unlock hexagons for editing
export const lockHexagon = (hexagonId: string, userId: string, duration: number = 30000) => {
  return {
    locked_by: userId,
    lock_expires: Date.now() + duration
  };
};

export const isHexagonLocked = (hexagon: LiveHexagon, currentUserId: string): boolean => {
  if (!hexagon.locked_by || !hexagon.lock_expires) return false;
  if (hexagon.locked_by === currentUserId) return false; // Own lock
  return Date.now() < hexagon.lock_expires;
};

// Conflict resolution for simultaneous edits
export const resolveHexagonConflict = (local: LiveHexagon, remote: LiveHexagon): LiveHexagon => {
  // Use "last writer wins" with timestamp comparison
  return local.last_updated > remote.last_updated ? local : remote;
};

// User activity tracking
export const updateUserActivity = () => {
  return {
    last_activity: Date.now(),
    is_active: true
  };
};