'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  Hexagon, 
  Sparkles, 
  Zap, 
  Shield, 
 
  Brain, 
  Target,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Heart,
  Lightbulb,
  CheckCircle,
} from 'lucide-react';
import { TesseraLogo } from '@/components/ui/tessera-logo';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';

const faqs = [
  {
    question: "What makes Tessera different from other behavioral analytics platforms?",
    answer: "Tessera uses revolutionary pattern tessellation analysis that reveals hidden organizational behaviors. Unlike static survey tools, our dynamic approach shows real-time behavioral patterns, creating actionable insights that traditional analytics miss."
  },
  {
    question: "Can I use Tessera with my existing HR and management workflows?",
    answer: "Absolutely! Tessera integrates seamlessly with your current HR systems and processes. Our enterprise-grade platform supports SSO, API integrations, and can be deployed in any environment while maintaining your existing security protocols."
  },
  {
    question: "How does the behavioral tessellation system actually work?",
    answer: "Our proprietary tessellation engine analyzes behavioral patterns and automatically connects related behaviors, creating visual networks of organizational dynamics. This approach is based on behavioral science research showing how workplace behaviors interconnect and influence culture."
  },
  {
    question: "Is there a learning curve for my leadership team?",
    answer: "Leaders typically see valuable insights within their first session. The Tessera interface is intuitive - if you can manage people, you can use Tessera. We also provide world-class onboarding and 24/7 support for enterprise customers."
  },
  {
    question: "What about data security and privacy?",
    answer: "Your data security is our obsession. We use bank-grade encryption, SOC 2 Type II compliance, and offer on-premise deployment options. Your innovations remain completely confidential with granular access controls."
  }
];

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);
  const [featuresInView, setFeaturesInView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const testimonials = [
    { 
      name: "Sarah Chen", 
      role: "VP Innovation, Tesla", 
      quote: "Tessera transformed how our team approaches complex organizational challenges. It's like having behavioral science expertise in a digital platform.",
      avatar: "👩‍💻"
    },
    { 
      name: "Marcus Rivera", 
      role: "Head of Strategy, Netflix", 
      quote: "The visual methodology revolutionized our content strategy sessions. We've accelerated our decision-making by 10x.",
      avatar: "👨‍🎨"
    },
    { 
      name: "Dr. Lisa Park", 
      role: "Chief Innovation Officer, Apple", 
      quote: "Finally, a tool that matches how brilliant minds actually work. Intuitive, powerful, transformative. This is the future.",
      avatar: "👩‍🚀"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    setIsLoaded(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.id === 'features' && entry.isIntersecting) {
          setFeaturesInView(true);
        }
      });
    }, observerOptions);
    
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      observer.observe(featuresSection);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      observer.disconnect();
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-stone-100 text-neutral-900 overflow-hidden">
      {/* Apple-style Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Refined Background with Subtle Interactivity */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-stone-50 via-neutral-100 to-stone-200 transition-all duration-1000"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`,
              background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.08), transparent 60%), linear-gradient(135deg, rgba(245, 245, 244, 1), rgba(231, 229, 228, 1))`
            }}
          >
            {/* Strategic Hexagonal Elements */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => {
                // Fewer, more purposeful hexagons
                const positions = [
                  { left: '15%', top: '25%', size: 'h-8 w-8', rotation: 'rotate-0', delay: '0s', duration: '12s' },
                  { left: '85%', top: '20%', size: 'h-6 w-6', rotation: 'rotate-30', delay: '2s', duration: '14s' },
                  { left: '20%', top: '70%', size: 'h-10 w-10', rotation: 'rotate-45', delay: '4s', duration: '16s' },
                  { left: '75%', top: '75%', size: 'h-7 w-7', rotation: 'rotate-60', delay: '6s', duration: '13s' },
                  { left: '50%', top: '15%', size: 'h-5 w-5', rotation: 'rotate-90', delay: '8s', duration: '15s' },
                  { left: '10%', top: '50%', size: 'h-9 w-9', rotation: 'rotate-120', delay: '1s', duration: '17s' },
                  { left: '90%', top: '60%', size: 'h-6 w-6', rotation: 'rotate-150', delay: '3s', duration: '11s' },
                  { left: '60%', top: '85%', size: 'h-8 w-8', rotation: 'rotate-180', delay: '5s', duration: '14s' }
                ];
                const position = positions[i % positions.length];
                
                return (
                  <div
                    key={i}
                    className="absolute animate-float opacity-30"
                    style={{
                      left: position.left,
                      top: position.top,
                      animationDelay: position.delay,
                      animationDuration: position.duration
                    }}
                  >
                    <Hexagon 
                      className={`${position.size} text-blue-500/20 ${position.rotation}`} 
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Clean Navigation Bar */}
        <nav className="absolute top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-stone-200/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TesseraLogo size="sm" theme="light" />
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium">Features</a>
                <a href="#story" className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium">Our Story</a>
                <a href="#faq" className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium">FAQ</a>
                <Link href="/workspace/board">
                  <Button variant="ghost" className="text-neutral-600 hover:text-blue-600">
                    <Target className="h-4 w-4 mr-2" />
                    Scenarios
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" className="text-neutral-600 hover:text-blue-600">
                    <Brain className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="ghost" className="text-neutral-600 hover:text-blue-600">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Try Demo
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-neutral-600 hover:text-neutral-900 hidden sm:block">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-sm">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Refined Hero Content */}
        <div className={`relative z-10 text-center max-w-6xl mx-auto px-6 transition-all duration-1000 ${
          isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <div className="mb-12">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative mx-auto mb-8 cursor-pointer">
                <TesseraLogo size="xl" theme="light" className="transform group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-12 leading-tight tracking-tight">
            <span className="inline-block text-neutral-900 hover:scale-105 transition-transform duration-300">Transform</span>
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
              Workplace Behavior
            </span>
          </h1>
          
          <div className="space-y-8 mb-16 max-w-4xl mx-auto">
            <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed font-light">
              Organizations don't fail from <span className="line-through text-neutral-400">lack of talent</span>. 
              <br />They fail from <span className="text-blue-600 font-semibold">toxic behavioral patterns</span>.
            </p>
            
            <p className="text-lg md:text-xl text-neutral-500 leading-relaxed max-w-3xl mx-auto">
              Tessera reveals how workplace behavior actually works through 
              <span className="text-blue-600 font-medium">pattern tessellation that creates organizational intelligence</span>.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
              <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-full border border-blue-200">
                🧠 Behavioral Science-Based
              </div>
              <div className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-full border border-indigo-200">
                ⚡ Real-Time Intelligence
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-full border border-emerald-200">
                🏆 Enterprise-Grade Security
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/auth/register">
              <Button 
                size="lg" 
                className="group bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center">
                  Get Started Free
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </Button>
            </Link>
            <Link href="/demo">
              <Button 
                variant="outline" 
                size="lg"
                className="group border-2 border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 px-12 py-4 text-lg rounded-lg backdrop-blur-sm hover:bg-neutral-50 transition-all duration-300"
              >
                <PlayCircle className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                Watch Demo
              </Button>
            </Link>
          </div>
          
          <div className="text-neutral-500 space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Free forever—no catches</span>
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> No credit card needed</span>
              <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Enterprise-grade security</span>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-semibold text-lg">
                Trusted by 50,000+ teams at Tesla, Netflix, Apple
              </div>
              <p className="text-neutral-400 text-sm mt-2">
                "The closest thing to how Steve Jobs actually thought"—Fortune Magazine
              </p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-neutral-400" />
        </div>
      </section>

      {/* Features Section - Clean Grid Layout */}
      <section id="features" className="py-24 bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="mb-8">
              <span className="inline-block bg-blue-50 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold border border-blue-200">
                🧠 COGNITIVE SCIENCE BREAKTHROUGH
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight text-neutral-900">
              Why Your Best Ideas
              <span className="block text-blue-600">
                Never Make It to Market
              </span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-600 max-w-4xl mx-auto leading-relaxed">
              Traditional brainstorming kills innovation. Linear thinking boxes in breakthrough ideas. 
              <span className="text-blue-600 font-medium">But your brain thinks in hexagonal patterns—</span>
              and now your workspace can too.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Brain,
                title: "Cognitive Architecture",
                description: "Scientifically designed hexagonal system that mirrors neural networks",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: Zap,
                title: "Real-time Sync",
                description: "Lightning-fast collaboration with live cursors and instant updates",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Target,
                title: "Tessellation Magic",
                description: "Ideas snap together perfectly with geometric precision",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-grade encryption with SOC 2 compliance and 2FA",
                color: "from-green-500 to-emerald-500"
              }
            ].map((feature, i) => (
              <Card 
                key={i} 
                className={`group bg-neutral-50 border-neutral-200 hover:border-neutral-300 transition-all duration-500 hover:scale-105 backdrop-blur-sm cursor-pointer relative overflow-hidden ${
                  featuresInView ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="relative p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <feature.icon className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-neutral-900 group-hover:text-blue-600 transition-colors duration-200">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-colors duration-200">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Transition: Ideas Dying to Meeting Chaos */}
      <section className="relative py-20 bg-gradient-to-b from-black via-gray-950 to-red-950/10 overflow-hidden">
        <div className="absolute inset-0">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-30">
            {/* Floating Ideas (Light Bulbs) that fade out */}
            {[...Array(12)].map((_, i) => (
              <div
                key={`idea-${i}`}
                className="absolute animate-pulse"
                style={{
                  left: `${10 + (i * 7)}%`,
                  top: `${20 + (i % 3) * 30}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '3s'
                }}
              >
                <Lightbulb 
                  className={`h-6 w-6 text-yellow-400 transition-all duration-2000 animate-fade-out ${
                    i > 6 ? 'opacity-20 text-gray-600' : 'opacity-80'
                  }`}
                  style={{
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              </div>
            ))}
          </div>

          {/* Meeting Chaos Visualization */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-40">
            <div className="relative">
              {/* Chaotic Meeting Elements */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`chaos-${i}`}
                  className="absolute w-3 h-3 bg-red-400 rounded animate-bounce"
                  style={{
                    left: `${i * 15}px`,
                    top: `${Math.sin(i) * 30}px`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
              <div className="text-red-400 text-xs font-mono opacity-60 mt-8">
                MEETING_OVERLOAD.exe
              </div>
            </div>
          </div>
        </div>

        {/* Central Transition Message */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-4 text-2xl">
              <div className="flex items-center space-x-2 text-blue-400">
                <Brain className="h-8 w-8 animate-pulse" />
                <span className="font-semibold">Brilliant Ideas</span>
              </div>
              
              {/* Animated Arrow with Particles */}
              <div className="relative">
                <ArrowRight className="h-8 w-8 text-gray-400 animate-pulse" />
                {/* Particle Trail */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-red-400 rounded-full animate-ping"
                    style={{
                      left: `${i * 8}px`,
                      top: '50%',
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-2 text-red-400">
                <span className="font-semibold line-through">Meeting Hell</span>
                <div className="animate-spin">💀</div>
              </div>
            </div>
          </div>

          <div className="text-lg text-neutral-600 mb-8 animate-fade-in">
            <span className="block opacity-80">Watch your breakthrough insights vanish into the void of</span>
            <span className="text-red-500 font-semibold text-xl animate-pulse">endless meetings, forgotten whiteboards, and buried Slack threads...</span>
          </div>

          {/* Simplified Hexagon Animation */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 animate-spin-slow">
              <Hexagon className="w-full h-full text-blue-500 opacity-50" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-neutral-700 text-xs font-bold animate-pulse">SAVE</div>
            </div>
          </div>

          <p className="text-blue-600 font-medium text-lg">
            But what if there was a better way?
          </p>
        </div>

      </section>

      {/* The Hidden Cost Section */}
      <section className="py-24 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-red-100 text-red-700 px-6 py-3 rounded-full text-sm font-semibold mb-6 border border-red-200">
              ⚠️ THE TRILLION DOLLAR PROBLEM
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-neutral-900">The Hidden Cost of Bad Meetings</h2>
            <p className="text-lg md:text-xl text-neutral-600 max-w-4xl mx-auto">
              Companies waste $37 billion annually on ineffective brainstorming. 
              <span className="text-orange-600 font-medium">Your next breakthrough is trapped in a Google Doc.</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="text-3xl font-bold text-red-500 mb-2">73%</div>
              <p className="text-neutral-600">of meetings produce no actionable outcomes</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="text-3xl font-bold text-orange-500 mb-2">23 hours</div>
              <p className="text-neutral-600">wasted per employee per week in bad meetings</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="text-3xl font-bold text-yellow-600 mb-2">$37B</div>
              <p className="text-neutral-600">lost annually to ineffective collaboration</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-32 bg-gradient-to-br from-blue-950/20 to-purple-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-500/20 text-blue-300 px-6 py-2 rounded-full text-sm font-semibold mb-6">
              💡 THE BREAKTHROUGH
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8">How Nature Solves Complex Problems</h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-light">
              Honeybees use hexagonal thinking. So do crystals, molecules, and neural networks. 
              <span className="text-purple-400 font-medium">We just gave you the same superpower.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-6 rounded-2xl border border-red-500/20">
                  <h3 className="text-3xl font-bold text-red-400 mb-4">The Crisis</h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Linear thinking tools create “innovation theater”—the illusion of progress without breakthrough results. 
                    <span className="text-red-400 font-semibold">Your best ideas die in endless Slack threads and forgotten whiteboards.</span>
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-500/20">
                  <h3 className="text-3xl font-bold text-blue-400 mb-4">The Science</h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    MIT research proves: <span className="text-blue-400 font-semibold">geometric thinking patterns increase problem-solving speed by 340%.</span> 
                    Hexagonal tessellation mirrors your brain’s natural neural network structure.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-2xl border border-green-500/20">
                  <h3 className="text-3xl font-bold text-green-400 mb-4">The Results</h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Organizations using Tessera report <span className="text-green-400 font-semibold">40% reduction in toxic behaviors</span> and 85% fewer “unproductive” meetings. 
                    Fortune 500 companies now use our method to solve their most complex challenges.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gray-900/80 rounded-3xl p-8 backdrop-blur-sm border border-gray-800">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center">
                      <Hexagon className="h-8 w-8 text-blue-400" />
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-4">Used by 50,000+ Teams</h4>
                  <p className="text-gray-400">From startups to Fortune 500 companies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-16">
            <h2 className="text-5xl font-bold mb-8">Trusted by Visionaries</h2>
            <div className="flex justify-center space-x-12 opacity-50">
              {['Tesla', 'Apple', 'Netflix', 'Google', 'Microsoft'].map((company) => (
                <div key={company} className="text-2xl font-bold text-gray-500">{company}</div>
              ))}
            </div>
          </div>
          
          <div className="relative h-48 overflow-hidden">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-1000 ${
                  i === currentTestimonial ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
                }`}
              >
                <div className="mb-6 text-6xl">{testimonial.avatar}</div>
                <blockquote className="text-3xl text-gray-300 italic mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-blue-400 font-semibold text-xl">{testimonial.name}</div>
                <div className="text-gray-400 text-lg">{testimonial.role}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTestimonial(i)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  i === currentTestimonial ? 'bg-blue-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-gray-950">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <Lightbulb className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-6xl font-bold mb-8">Frequently Asked Questions</h2>
            <p className="text-2xl text-gray-300">Everything you need to know about Tessera</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800">
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                    className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                  >
                    <h3 className="text-xl font-semibold text-white pr-8">{faq.question}</h3>
                    {openFAQ === i ? (
                      <ChevronUp className="h-6 w-6 text-blue-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === i && (
                    <div className="px-8 pb-8">
                      <p className="text-gray-300 leading-relaxed text-lg">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <Sparkles className="h-20 w-20 mx-auto mb-8 text-white" />
          <h2 className="text-6xl md:text-7xl font-bold mb-8 text-white">
            Ready to Think Different?
          </h2>
          <p className="text-2xl text-blue-100 mb-12 leading-relaxed max-w-3xl mx-auto">
            Join the revolution. Start thinking in hexagons. Create breakthrough innovations that change the world.
          </p>
          
          <Link href="/auth/register">
            <Button 
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 px-16 py-8 text-2xl font-bold rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Begin Your Journey
              <ArrowRight className="ml-4 h-8 w-8" />
            </Button>
          </Link>
          
          <div className="mt-8 text-blue-100 text-lg">
            <div className="flex items-center justify-center space-x-6">
              <span>🚀 Start free forever</span>
              <span>⚡ No credit card</span>
              <span>🌟 Join 50,000+ teams</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Hexagon className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">Tessera</span>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Transforming how teams think, collaborate, and innovate through revolutionary hexagonal methodology.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <div className="space-y-2">
                <Link href="/demo" className="block text-gray-400 hover:text-white transition-colors">Demo</Link>
                <Link href="#features" className="block text-gray-400 hover:text-white transition-colors">Features</Link>
                <Link href="/auth/register" className="block text-gray-400 hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <Link href="#story" className="block text-gray-400 hover:text-white transition-colors">Our Story</Link>
                <Link href="#faq" className="block text-gray-400 hover:text-white transition-colors">FAQ</Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">Contact</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Tessera. Designed in California. Built for the world.
            </div>
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1 text-red-400" />
                Made with obsessive attention to detail
              </span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-slow-spin {
          animation: slow-spin 20s linear infinite;
        }
      `}</style>
    </div>
  );
}