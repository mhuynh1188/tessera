import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon } from 'lucide-react';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Hexagon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hexies
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Your beautiful workspace is ready!
          </p>
        </div>

        {/* Test Components */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Sign In</Button>
              <Button variant="outline" className="w-full">Sign Up</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Styling Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"></div>
              <div className="h-8 bg-gray-100 rounded-lg"></div>
              <div className="h-8 bg-green-100 rounded-lg"></div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Beautiful Design", icon: "🎨", color: "bg-pink-100" },
            { title: "Fast Performance", icon: "⚡", color: "bg-yellow-100" },
            { title: "Secure", icon: "🔐", color: "bg-green-100" },
          ].map((feature, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}