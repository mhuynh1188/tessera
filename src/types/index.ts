// Core application types

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  subscription_status: 'active' | 'inactive' | 'trial' | 'past_due';
  miro_user_id?: string;
  created_at: string;
  updated_at: string;
  two_factor_enabled: boolean;
  last_login?: string;
}

export interface TesseraCard {
  id: string;
  title: string;
  front_text: string;
  back_text: string;
  category: Category['name'];
  subscription_tier_required: 'free' | 'basic' | 'premium';
  icon_name?: string;
  icon_svg?: string;
  color_scheme?: {
    primary: string;
    secondary: string;
    text: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
  tags?: string[];
  card_references?: TesseraReference[];
  references?: TesseraReference[]; // Keep for backward compatibility
}

export interface TesseraReference {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'research' | 'book' | 'website' | 'video' | 'podcast';
  authors?: string;
  publication?: string;
  year?: number;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  icon?: string;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_enabled: boolean;
  created_by: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  settings: WorkspaceSettings;
  collaborators: WorkspaceCollaborator[];
}

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'auto';
  grid_size: number;
  snap_to_grid: boolean;
  auto_save: boolean;
  collaboration_enabled: boolean;
  max_tesseras: number;
}

export interface WorkspaceCollaborator {
  user_id: string;
  workspace_id: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: CollaboratorPermissions;
  invited_at: string;
  accepted_at?: string;
}

export interface CollaboratorPermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_invite: boolean;
  can_export: boolean;
}

export interface TesseraInstance {
  id: string;
  workspace_id: string;
  tessera_card_id: string;
  position: Position;
  rotation: number;
  scale: number;
  is_flipped: boolean;
  z_index: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  metadata?: Record<string, any>;
}

export interface Position {
  x: number;
  y: number;
}

export interface TesseraGroup {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  tessera_instances: string[]; // Array of TesseraInstance IDs
  position: Position;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Future workplace analytics types
export interface WorkplaceBehaviorReport {
  id: string;
  workspace_id: string;
  reporter_id?: string; // Optional for anonymous reporting
  behavior_type: BehaviorType;
  description: string;
  frequency: 'once' | 'rarely' | 'sometimes' | 'often' | 'always';
  impact_level: 1 | 2 | 3 | 4 | 5;
  department?: string;
  team_size?: string;
  is_anonymous: boolean;
  metadata: Record<string, any>;
  created_at: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface BehaviorType {
  id: string;
  name: string;
  category: 'communication' | 'management' | 'collaboration' | 'culture' | 'workload' | 'environment';
  description: string;
  severity_weight: number;
}

export interface AnalyticsVisualization {
  id: string;
  workspace_id: string;
  type: 'heatmap' | 'timeline' | 'network' | 'distribution' | 'trend';
  data_source: string;
  config: Record<string, any>;
  created_at: string;
  created_by: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
  inquiry_type: 'general' | 'sales' | 'support' | 'partnership';
}

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
  rememberMe?: boolean;
}

export interface WorkspaceFormData {
  name: string;
  description?: string;
  is_public: boolean;
  settings: Partial<WorkspaceSettings>;
}

// Event types for real-time collaboration
export interface RealtimeEvent {
  type: 'tessera_moved' | 'tessera_added' | 'tessera_removed' | 'user_joined' | 'user_left' | 'workspace_updated';
  data: Record<string, any>;
  user_id: string;
  workspace_id: string;
  timestamp: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// Security types
export interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Legacy type exports for backward compatibility during migration
export type HexieCard = TesseraCard;
export type HexieReference = TesseraReference;
export type HexieInstance = TesseraInstance;
export type HexieGroup = TesseraGroup;