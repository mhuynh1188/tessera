'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminGet, adminPost } from '@/lib/admin-api';
import { 
  Shield, 
  Users, 
  Crown, 
  Settings, 
  Check, 
  X, 
  UserCog,
  Key,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface Role {
  role: string;
  description: string;
  users: number;
  permissions: string[];
}

interface UserRole {
  user_id: string;
  email: string;
  name: string;
  current_role: string;
  last_login: string;
  status: string;
}

// Permissions will be loaded from API
let AVAILABLE_PERMISSIONS: Permission[] = [];

export function RolesPermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRolesData();
  }, []);

  const fetchRolesData = async () => {
    try {
      setLoading(true);
      
      const [permissionsResponse, usersResponse] = await Promise.all([
        adminGet('/api/admin/permissions'),
        adminGet('/api/admin/users')
      ]);

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        if (permissionsData.success) {
          setPermissions(permissionsData.data.permissions || []);
          setRoles(permissionsData.data.roles || []);
          // Update global permissions for compatibility
          AVAILABLE_PERMISSIONS = permissionsData.data.permissions || [];
        }
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setUserRoles(usersData.data.map((user: any) => ({
            user_id: user.id,
            email: user.email,
            name: user.display_name,
            current_role: user.role,
            last_login: user.last_login_at,
            status: user.status
          })));
        }
      }

    } catch (error) {
      console.error('Error fetching roles data:', error);
      toast({ title: "Error", description: "Failed to load roles data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdating(true);
      
      const response = await adminPost('/api/admin/roles', {
        user_id: userId,
        new_role: newRole
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setUserRoles(prev => prev.map(user => 
            user.user_id === userId ? { ...user, current_role: newRole } : user
          ));
          
          toast({ title: "Role Updated", description: "User role has been updated successfully." });
          
          // Refresh roles data to get updated counts
          await fetchRolesData();
        } else {
          toast({ title: "Error", description: data.message || "Failed to update role", variant: "destructive" });
        }
      } else {
        toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
      }

    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <UserCog className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      case 'viewer': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading roles and permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">
            Manage user roles and configure permissions for your organization
          </p>
        </div>
        <Button onClick={fetchRolesData} disabled={updating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Role Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {roles.map((role) => (
          <Card key={role.role} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                {getRoleIcon(role.role)}
                <CardTitle className="text-sm font-medium capitalize">{role.role}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{role.users}</div>
              <p className="text-xs text-muted-foreground">{role.users === 1 ? 'user' : 'users'}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                {role.permissions.length} permissions
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Assignment</CardTitle>
            <CardDescription>
              Assign and modify user roles within your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRoles.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(user.current_role)}>
                        {getRoleIcon(user.current_role)}
                        <span className="ml-1 capitalize">{user.current_role}</span>
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={user.current_role}
                      onValueChange={(newRole) => handleRoleChange(user.user_id, newRole)}
                      disabled={updating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>
              View permissions assigned to each role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    {category.replace('_', ' ')}
                  </h4>
                  <div className="space-y-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{permission.name}</span>
                            <Badge className={getRiskLevelColor(permission.risk_level)}>
                              {permission.risk_level}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {roles.map((role) => (
                            <div key={role.role} className="flex items-center">
                              {role.permissions.includes(permission.id) ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-gray-300" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Details */}
      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
          <CardDescription>
            Detailed breakdown of each role and their capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.role} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {getRoleIcon(role.role)}
                  <h4 className="font-medium capitalize">{role.role}</h4>
                  <Badge variant="outline">{role.users} users</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Key Permissions:</div>
                  {role.permissions.slice(0, 3).map((permissionId) => {
                    const permission = permissions.find(p => p.id === permissionId);
                    return permission ? (
                      <div key={permissionId} className="text-xs text-muted-foreground">
                        • {permission.name}
                      </div>
                    ) : null;
                  })}
                  {role.permissions.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{role.permissions.length - 3} more permissions
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}