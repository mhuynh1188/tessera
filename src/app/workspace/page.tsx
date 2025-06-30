'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Hexagon, 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  User, 
  LogOut,
  Crown,
  Star,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Brain
} from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { TesseraCard, User as UserType } from '@/types';
import toast from 'react-hot-toast';
import { config } from '@/lib/config';
import UserNav from '@/components/layout/UserNav';
import { UnifiedTour, UnifiedTourTrigger } from '@/components/tours/UnifiedTour';
import { SuperUnifiedTour, SuperUnifiedTourTrigger } from '@/components/tours/SuperUnifiedTour';
import { TesseraLogo } from '@/components/ui/tessera-logo';

// Enhanced Demo Component for authenticated users
export default function WorkspacePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tesseraLibrary, setTesseraLibrary] = useState<TesseraCard[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showSuperTour, setShowSuperTour] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        // Redirect to login if not authenticated
        window.location.href = '/auth/login';
        return;
      }
      setUser(currentUser);
      await loadUserData(currentUser);
    } catch (error) {
      console.error('Authentication check failed:', error);
      window.location.href = '/auth/login';
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (user: UserType) => {
    try {
      // Load tesseras based on subscription tier
      const tesseras = await db.getTesseraCards({
        subscription_tier: user.subscription_tier || 'free',
        is_active: true
      });
      setTesseraLibrary(tesseras);

      // Load categories
      const cats = await db.getCategories();
      setCategories(cats || []);

      toast.success(`Welcome back, ${user.name}! 🎉`);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load workspace data');
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out');
    }
  };

  const filteredTesseras = tesseraLibrary.filter(tessera => {
    const matchesSearch = tessera.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tessera.front_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tessera.back_text?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || tessera.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return { color: 'bg-yellow-500', icon: Crown, text: 'Premium' };
      case 'basic':
        return { color: 'bg-blue-500', icon: Star, text: 'Basic' };
      default:
        return { color: 'bg-gray-500', icon: User, text: 'Free' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Loading Your Workspace...
          </h3>
          <p className="text-gray-500">
            Authenticating and loading your tesseras
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500 mb-6">
            Please sign in to access your workspace
          </p>
          <Link href="/auth/login">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const badge = getSubscriptionBadge(user.subscription_tier || 'free');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TesseraLogo size="md" theme="dark" />
            <div>
              <div className="text-xs text-blue-300/80 font-medium tracking-wide">ENTERPRISE PLATFORM</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/workspace/enhanced">
              <Button variant="outline" size="sm" className="bg-blue-600/20 border-blue-600 text-blue-300 hover:bg-blue-600/30">
                <Maximize2 className="h-4 w-4 mr-2" />
                Enhanced Workspace
              </Button>
            </Link>
            <UnifiedTourTrigger
              onStartTour={() => setShowTour(true)}
              context="workspace"
              variant="icon"
              size="sm"
              className="mr-2"
            />
            {/* User Navigation */}
            <UserNav />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tesseras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Link href="/workspace/board">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </Button>
              </Link>
              
              <Link href="/workspace/board?tab=scenarios">
                <Button variant="outline" className="border-purple-600 text-purple-300 hover:text-white hover:border-purple-500">
                  <Settings className="h-4 w-4 mr-2" />
                  Scenarios
                </Button>
              </Link>
              
              <Link href="/analytics">
                <Button variant="outline" className="border-purple-600 text-purple-300 hover:text-white hover:border-purple-500">
                  <Brain className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              
              <div className="flex items-center space-x-2">
                <UnifiedTourTrigger
                  onStartTour={() => setShowTour(true)}
                  context="workspace"
                  variant="icon"
                  size="sm"
                  label="Quick Tour"
                />
                <SuperUnifiedTourTrigger
                  onStartTour={() => setShowSuperTour(true)}
                  context="workspace"
                  variant="icon"
                  size="sm"
                  label="Complete Tour"
                />
              </div>
              
              <Link href="/demo">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
                  <Eye className="h-4 w-4 mr-2" />
                  Demo Mode
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Hexagon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Total Tesseras</p>
                  <p className="text-2xl font-bold text-white">{filteredTesseras.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Unlock className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Available</p>
                  <p className="text-2xl font-bold text-white">
                    {tesseraLibrary.filter(t => authService.hasSubscriptionAccess(user.subscription_tier || 'free', t.subscription_tier_required)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Crown className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Premium Only</p>
                  <p className="text-2xl font-bold text-white">
                    {tesseraLibrary.filter(t => t.subscription_tier_required === 'premium').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Filter className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Categories</p>
                  <p className="text-2xl font-bold text-white">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tessera Library */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTesseras.map((tessera) => {
            const hasAccess = authService.hasSubscriptionAccess(user.subscription_tier || 'free', tessera.subscription_tier_required);
            const colorScheme = tessera.color_scheme || { primary: '#6b7280', secondary: '#4b5563', text: '#ffffff' };
            
            return (
              <Card 
                key={tessera.id} 
                className={`bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 ${
                  !hasAccess ? 'opacity-60' : ''
                }`}
                style={{ boxShadow: 'none' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colorScheme.primary }}
                    >
                      <Hexagon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {!hasAccess && <Lock className="h-4 w-4 text-yellow-400" />}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        tessera.subscription_tier_required === 'premium' ? 'bg-yellow-500/20 text-yellow-300' :
                        tessera.subscription_tier_required === 'basic' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {tessera.subscription_tier_required}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-white text-lg mb-2">{tessera.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-3">{tessera.front_text}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300 text-sm font-medium">{tessera.category}</span>
                    <Button
                      size="sm"
                      disabled={!hasAccess}
                      className={`${
                        hasAccess 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-600 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (hasAccess) {
                          // Navigate to demo with this tessera selected
                          window.location.href = `/demo?tessera=${tessera.id}`;
                        } else {
                          setShowSubscriptionModal(true);
                        }
                      }}
                    >
                      {hasAccess ? 'Use Tessera' : 'Upgrade'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTesseras.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No tesseras found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Upgrade to Premium</h3>
              <p className="text-gray-400 mb-6">
                Unlock all tesseras, advanced features, and unlimited workspaces
              </p>
              
              <div className="space-y-4">
                <div className="text-left bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Premium Features:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Access to all {tesseraLibrary.length}+ tesseras</li>
                    <li>• Unlimited workspaces and collaborators</li>
                    <li>• Advanced search and filtering</li>
                    <li>• Priority support</li>
                    <li>• Export to multiple formats</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setShowSubscriptionModal(false)}
                    variant="ghost" 
                    className="flex-1 text-gray-300 border-gray-600"
                  >
                    Maybe Later
                  </Button>
                  <Button 
                    onClick={() => {
                      toast.success('Upgrade feature coming soon! 🚀');
                      setShowSubscriptionModal(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Tour */}
      <UnifiedTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          setShowTour(false);
          console.log('Unified workspace tour completed!');
        }}
        context="workspace"
      />

      {/* Super Unified Tour */}
      <SuperUnifiedTour
        isOpen={showSuperTour}
        onClose={() => setShowSuperTour(false)}
        onComplete={() => {
          setShowSuperTour(false);
          console.log('Super unified tour completed!');
        }}
        context="workspace"
      />
    </div>
  );
}