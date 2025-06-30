// Collaboration utilities for sharing workspaces

import { v4 as uuidv4 } from 'uuid';

interface ShareSession {
  id: string;
  workspaceId: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  isActive: boolean;
  participants: string[];
}

// In-memory storage for demo (in production, use database)
const shareSessions = new Map<string, ShareSession>();

export function generateShareLink(workspaceId: string, createdBy: string = 'demo-user'): string {
  const sessionId = uuidv4().replace(/-/g, '').substring(0, 12);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry
  
  const session: ShareSession = {
    id: sessionId,
    workspaceId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdBy,
    isActive: true,
    participants: [createdBy]
  };
  
  shareSessions.set(sessionId, session);
  
  // Generate the collaboration URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  return `${baseUrl}/collaborate/${sessionId}`;
}

export function getShareSession(sessionId: string): ShareSession | null {
  return shareSessions.get(sessionId) || null;
}

export function isValidShareSession(sessionId: string): boolean {
  const session = getShareSession(sessionId);
  if (!session || !session.isActive) return false;
  
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  return now < expiresAt;
}

export function joinShareSession(sessionId: string, userId: string): boolean {
  const session = getShareSession(sessionId);
  if (!session || !isValidShareSession(sessionId)) return false;
  
  if (!session.participants.includes(userId)) {
    session.participants.push(userId);
  }
  
  return true;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }
  
  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(success);
  } catch (err) {
    return Promise.resolve(false);
  }
}