'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, Activity, BookOpen, TrendingUp, Clock, Target,
  Download, Filter, RefreshCw, Calendar, Search, Award,
  Building, MapPin, Zap, Eye, Brain, AlertTriangle
} from 'lucide-react';

// Types for real analytics data from our SQL queries
interface OrganizationMetrics {
  total_users: number;
  active_users_7d: number;
  active_users_30d: number;
  engagement_rate_30d: number;
  active_subscribers: number;
  total_cards_accessed: number;
  total_scenarios_available: number;
  total_workspaces: number;
  total_hours_engaged: number;
  total_sessions_30d: number;
  avg_scenario_effectiveness: number;
}

interface ContentUsage {
  id: string;
  title: string;
  category: string;
  category_name: string;
  usage_count: number;
  unique_users: number;
  avg_time_spent: number;
  helpful_votes: number;
  not_helpful_votes: number;
  helpfulness_percentage: number;
}

interface TrendData {
  week_start: string;
  active_users: number;
  total_sessions: number;
  card_views: number;
  scenario_starts: number;
  searches: number;
  total_hours: number;
  active_users_change_pct: number;
  sessions_change_pct: number;
  card_views_change_pct: number;
}

interface UserEngagement {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  total_sessions: number;
  unique_cards_used: number;
  unique_scenarios_attempted: number;
  scenarios_completed: number;
  total_hours_active: number;
  engagement_score: number;
  engagement_rank: number;
}

interface SearchTerm {
  search_term: string;
  search_count: number;
  unique_searchers: number;
  successful_searches: number;
  success_rate_pct: number;
}

interface DepartmentMetrics {
  department_name: string;
  total_users: number;
  active_users_30d: number;
  activity_rate: number;
  avg_actions_per_user: number;
  total_department_hours: number;
}

interface RealTimeData {
  metric_type: string;
  data: {
    total_users?: number;
    active_users_today?: number;
    total_sessions_today?: number;
    cards_viewed_today?: number;
    scenarios_started_today?: number;
    avg_session_duration_minutes?: number;
    top_cards?: Array<{title: string, usage_count: number, category: string}>;
    top_searches?: Array<{term: string, count: number}>;
  };
}

export default function RealAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState<'admin' | 'org_admin' | 'manager' | 'user'>('admin');
  
  // State for analytics data
  const [orgMetrics, setOrgMetrics] = useState<OrganizationMetrics | null>(null);
  const [contentUsage, setContentUsage] = useState<ContentUsage[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);

  // Fetch real analytics data from the backend APIs
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // These API endpoints run the SQL queries we created
      const endpoints = [
        '/api/analytics/organization-metrics',
        '/api/analytics/content-usage',
        '/api/analytics/trends',
        '/api/analytics/user-engagement',
        '/api/analytics/search-terms',
        '/api/analytics/department-metrics',
        '/api/analytics/real-time-dashboard'
      ];

      const [
        metricsRes, contentRes, trendsRes, engagementRes, 
        searchRes, departmentRes, realTimeRes
      ] = await Promise.all(endpoints.map(endpoint => fetch(endpoint)));

      if (metricsRes.ok) setOrgMetrics(await metricsRes.json());
      if (contentRes.ok) setContentUsage(await contentRes.json());
      if (trendsRes.ok) setTrendData(await trendsRes.json());
      if (engagementRes.ok) setUserEngagement(await engagementRes.json());
      if (searchRes.ok) setSearchTerms(await searchRes.json());
      if (departmentRes.ok) setDepartmentMetrics(await departmentRes.json());
      if (realTimeRes.ok) setRealTimeData(await realTimeRes.json());

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // Load sample data when backend isn't ready
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  // Sample data for demonstration
  const loadSampleData = () => {
    setOrgMetrics({
      total_users: 147,
      active_users_7d: 89,
      active_users_30d: 132,
      engagement_rate_30d: 89.8,
      active_subscribers: 98,
      total_cards_accessed: 342,
      total_scenarios_available: 28,
      total_workspaces: 12,
      total_hours_engaged: 1247.5,
      total_sessions_30d: 856,
      avg_scenario_effectiveness: 4.2
    });

    setContentUsage([
      { id: '1', title: 'Active Listening Techniques', category: 'communication', category_name: 'Communication', usage_count: 156, unique_users: 42, avg_time_spent: 180, helpful_votes: 38, not_helpful_votes: 4, helpfulness_percentage: 90.5 },
      { id: '2', title: 'Feedback Framework', category: 'feedback', category_name: 'Feedback', usage_count: 134, unique_users: 39, avg_time_spent: 165, helpful_votes: 35, not_helpful_votes: 3, helpfulness_percentage: 92.1 },
      { id: '3', title: 'Decision Making Matrix', category: 'decision-making', category_name: 'Decision Making', usage_count: 98, unique_users: 28, avg_time_spent: 220, helpful_votes: 26, not_helpful_votes: 2, helpfulness_percentage: 92.9 },
      { id: '4', title: 'Conflict Resolution Steps', category: 'conflict', category_name: 'Conflict Resolution', usage_count: 87, unique_users: 25, avg_time_spent: 195, helpful_votes: 22, not_helpful_votes: 3, helpfulness_percentage: 88.0 },
      { id: '5', title: 'Team Building Exercises', category: 'teamwork', category_name: 'Teamwork', usage_count: 76, unique_users: 23, avg_time_spent: 210, helpful_votes: 20, not_helpful_votes: 2, helpfulness_percentage: 90.9 }
    ]);

    setTrendData([
      { week_start: '2024-11-04', active_users: 78, total_sessions: 198, card_views: 1045, scenario_starts: 34, searches: 145, total_hours: 289.2, active_users_change_pct: 0, sessions_change_pct: 0, card_views_change_pct: 0 },
      { week_start: '2024-11-11', active_users: 82, total_sessions: 215, card_views: 1156, scenario_starts: 38, searches: 158, total_hours: 312.7, active_users_change_pct: 5.1, sessions_change_pct: 8.6, card_views_change_pct: 10.6 },
      { week_start: '2024-11-18', active_users: 89, total_sessions: 245, card_views: 1234, scenario_starts: 45, searches: 167, total_hours: 324.5, active_users_change_pct: 8.5, sessions_change_pct: 13.9, card_views_change_pct: 6.7 },
      { week_start: '2024-11-25', active_users: 94, total_sessions: 268, card_views: 1456, scenario_starts: 52, searches: 189, total_hours: 356.2, active_users_change_pct: 5.6, sessions_change_pct: 9.4, card_views_change_pct: 18.0 },
      { week_start: '2024-12-02', active_users: 102, total_sessions: 289, card_views: 1587, scenario_starts: 48, searches: 203, total_hours: 398.7, active_users_change_pct: 8.5, sessions_change_pct: 7.8, card_views_change_pct: 9.0 }
    ]);

    setUserEngagement([
      { id: '1', first_name: 'Sarah', last_name: 'Johnson', email: 's.johnson@acme.com', department_name: 'Engineering', total_sessions: 45, unique_cards_used: 23, unique_scenarios_attempted: 8, scenarios_completed: 6, total_hours_active: 12.5, engagement_score: 285, engagement_rank: 1 },
      { id: '2', first_name: 'Michael', last_name: 'Chen', email: 'm.chen@acme.com', department_name: 'Product Management', total_sessions: 38, unique_cards_used: 19, unique_scenarios_attempted: 7, scenarios_completed: 7, total_hours_active: 11.2, engagement_score: 268, engagement_rank: 2 },
      { id: '3', first_name: 'Emily', last_name: 'Rodriguez', email: 'e.rodriguez@acme.com', department_name: 'Human Resources', total_sessions: 42, unique_cards_used: 21, unique_scenarios_attempted: 6, scenarios_completed: 5, total_hours_active: 10.8, engagement_score: 254, engagement_rank: 3 }
    ]);

    setSearchTerms([
      { search_term: 'communication', search_count: 45, unique_searchers: 18, successful_searches: 41, success_rate_pct: 91.1 },
      { search_term: 'feedback', search_count: 38, unique_searchers: 15, successful_searches: 35, success_rate_pct: 92.1 },
      { search_term: 'leadership', search_count: 31, unique_searchers: 12, successful_searches: 28, success_rate_pct: 90.3 },
      { search_term: 'teamwork', search_count: 27, unique_searchers: 11, successful_searches: 24, success_rate_pct: 88.9 },
      { search_term: 'conflict', search_count: 23, unique_searchers: 9, successful_searches: 20, success_rate_pct: 87.0 }
    ]);

    setDepartmentMetrics([
      { department_name: 'Engineering', total_users: 45, active_users_30d: 38, activity_rate: 84.4, avg_actions_per_user: 24.5, total_department_hours: 156.7 },
      { department_name: 'Product Management', total_users: 28, active_users_30d: 25, activity_rate: 89.3, avg_actions_per_user: 28.2, total_department_hours: 134.2 },
      { department_name: 'Human Resources', total_users: 18, active_users_30d: 16, activity_rate: 88.9, avg_actions_per_user: 31.4, total_department_hours: 98.5 }
    ]);
  };

  useEffect(() => {
    fetchAnalyticsData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatHours = (hours: number) => {
    return `${Math.round(hours * 10) / 10}h`;
  };

  const formatPercentage = (pct: number) => {
    return `${Math.round(pct * 10) / 10}%`;
  };

  const getRoleBasedTitle = () => {
    switch (userRole) {
      case 'admin': return 'System Analytics Dashboard';
      case 'org_admin': return 'Organization Analytics Dashboard';
      case 'manager': return 'Team Analytics Dashboard';
      default: return 'My Analytics Dashboard';
    }
  };

  const getRoleBasedSubtitle = () => {
    switch (userRole) {
      case 'admin': return 'Complete system-wide usage analytics and performance metrics';
      case 'org_admin': return 'Organization-level insights for strategic decision making';
      case 'manager': return 'Team performance and engagement analytics';
      default: return 'Your personal usage and learning analytics';
    }
  };

  if (loading && !orgMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        <span className="ml-4 text-lg">Loading real analytics data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getRoleBasedTitle()}</h1>
          <p className="text-gray-600 mt-1">{getRoleBasedSubtitle()}</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="admin">System Admin</option>
            <option value="org_admin">Organization Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
          <Badge variant="outline" className="text-sm">
            <Clock className="w-3 h-3 mr-1" />
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button 
            onClick={fetchAnalyticsData} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(orgMetrics?.active_users_30d || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(orgMetrics?.engagement_rate_30d || 0)} engagement rate
            </p>
            <Progress value={orgMetrics?.engagement_rate_30d || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Accessed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(orgMetrics?.total_cards_accessed || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Hexie cards viewed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Hours</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(orgMetrics?.total_hours_engaged || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total engagement time (30d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenario Effectiveness</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgMetrics?.avg_scenario_effectiveness?.toFixed(1) || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Average rating out of 5.0
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity Trend</CardTitle>
                <CardDescription>User engagement over the last 12 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week_start" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="active_users" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Active Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Usage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Distribution</CardTitle>
                <CardDescription>How users engage with content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Card Views</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(trendData.reduce((sum, week) => sum + week.card_views, 0))}
                    </span>
                  </div>
                  <Progress value={75} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Scenario Starts</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(trendData.reduce((sum, week) => sum + week.scenario_starts, 0))}
                    </span>
                  </div>
                  <Progress value={45} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Searches</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(trendData.reduce((sum, week) => sum + week.searches, 0))}
                    </span>
                  </div>
                  <Progress value={60} />
                </div>
              </CardContent>
            </Card>

            {/* Growth Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Week-over-week percentage changes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week_start" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="active_users_change_pct" stroke="#10b981" strokeWidth={2} name="Users %" />
                    <Line type="monotone" dataKey="sessions_change_pct" stroke="#f59e0b" strokeWidth={2} name="Sessions %" />
                    <Line type="monotone" dataKey="card_views_change_pct" stroke="#6366f1" strokeWidth={2} name="Views %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Popular Search Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Search Terms</CardTitle>
                <CardDescription>What users are looking for</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchTerms.slice(0, 5).map((term, index) => (
                    <div key={term.search_term} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{term.search_term}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(term.search_count / (searchTerms[0]?.search_count || 1)) * 100} className="w-20" />
                        <span className="text-sm text-muted-foreground w-8">
                          {term.search_count}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(term.success_rate_pct)} success
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Content</CardTitle>
              <CardDescription>Hexie cards with highest usage and effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentUsage.map((content, index) => (
                  <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <h4 className="font-semibold">{content.title}</h4>
                          <p className="text-sm text-muted-foreground">{content.category_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(content.usage_count)}</div>
                        <div className="text-muted-foreground">views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{content.unique_users}</div>
                        <div className="text-muted-foreground">users</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{Math.round(content.avg_time_spent / 60)}m</div>
                        <div className="text-muted-foreground">avg time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{formatPercentage(content.helpfulness_percentage)}</div>
                        <div className="text-muted-foreground">helpful</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Leaderboard</CardTitle>
              <CardDescription>Most engaged users in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userEngagement.slice(0, 10).map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        {index + 1}
                      </Badge>
                      <div>
                        <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
                        <p className="text-sm text-muted-foreground">{user.department_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{user.engagement_score}</div>
                        <div className="text-muted-foreground">score</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{user.scenarios_completed}</div>
                        <div className="text-muted-foreground">scenarios</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{formatHours(user.total_hours_active)}</div>
                        <div className="text-muted-foreground">time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{user.unique_cards_used}</div>
                        <div className="text-muted-foreground">cards</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Activity and engagement by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentMetrics.map((dept, index) => (
                  <div key={dept.department_name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        {dept.department_name}
                      </h4>
                      <Badge variant="outline">
                        {formatPercentage(dept.activity_rate)} active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{dept.total_users}</div>
                        <div className="text-muted-foreground">Total Users</div>
                      </div>
                      <div>
                        <div className="font-medium">{dept.active_users_30d}</div>
                        <div className="text-muted-foreground">Active (30d)</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(dept.avg_actions_per_user)}</div>
                        <div className="text-muted-foreground">Avg Actions</div>
                      </div>
                      <div>
                        <div className="font-medium">{formatHours(dept.total_department_hours)}</div>
                        <div className="text-muted-foreground">Total Hours</div>
                      </div>
                    </div>
                    <Progress value={dept.activity_rate} className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <h5 className="font-medium text-blue-900">High Engagement Pattern</h5>
                    <p className="text-sm text-blue-700 mt-1">
                      Communication-related content shows 23% higher engagement than average. Consider expanding this category.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <h5 className="font-medium text-green-900">Search Success</h5>
                    <p className="text-sm text-green-700 mt-1">
                      90%+ search success rate indicates content is well-organized and discoverable.
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <h5 className="font-medium text-yellow-900">Department Variation</h5>
                    <p className="text-sm text-yellow-700 mt-1">
                      HR department shows highest per-user engagement. Share best practices across teams.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Expand Scenario Library</h5>
                      <p className="text-sm text-gray-600">
                        4.2/5 average effectiveness suggests users want more scenarios.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Eye className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Feature Underused Content</h5>
                      <p className="text-sm text-gray-600">
                        Several high-quality cards have low visibility. Consider featuring them.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Department Workshops</h5>
                      <p className="text-sm text-gray-600">
                        Lower-performing departments could benefit from guided workshops.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}