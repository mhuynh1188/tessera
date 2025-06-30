'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon, Mail, MapPin, Phone, Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    urgency: 'normal'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('🎉 Message sent successfully! We\'ll get back to you within 24 hours.', {
          duration: 6000,
          style: {
            background: 'linear-gradient(90deg, #10b981, #3b82f6)',
            color: 'white',
          },
        });
        setFormData({ name: '', email: '', company: '', subject: '', message: '', urgency: 'normal' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Hexagon className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-xl group-hover:bg-blue-700/30 transition-colors"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hexies
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href="/demo" className="text-gray-600 hover:text-gray-900 transition-colors">Demo</Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Ready to transform your methodology? We'd love to hear about your project and how Hexies can help your team achieve breakthrough results.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-gray-100 shadow-xl shadow-blue-500/5">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl">Send us a message</CardTitle>
                  <CardDescription className="text-base">
                    Tell us about your project and we'll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-12 space-y-6">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Message Sent Successfully!</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Thank you for reaching out! We've received your message and will get back to you within 24 hours.
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p>Confirmation ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{Date.now().toString(36).toUpperCase()}</span></p>
                        <p>Expected response time: Within 24 hours</p>
                      </div>
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Send Another Message
                      </button>
                    </div>
                  ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="company" className="text-sm font-medium text-gray-700">
                          Company
                        </label>
                        <input
                          id="company"
                          name="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          placeholder="Your company"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="urgency" className="text-sm font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          id="urgency"
                          name="urgency"
                          value={formData.urgency}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        >
                          <option value="low">Low - General inquiry</option>
                          <option value="normal">Normal - Project discussion</option>
                          <option value="high">High - Urgent request</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                        Subject *
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        placeholder="What's this about?"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium text-gray-700">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={6}
                        required
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                        placeholder="Tell us about your project, goals, and how we can help..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Send className="h-4 w-4" />
                          <span>Send Message</span>
                        </div>
                      )}
                    </Button>
                  </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-2 border-gray-100 shadow-xl shadow-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Response Time</h3>
                      <p className="text-sm text-gray-600">Within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Support</h3>
                      <p className="text-sm text-gray-600">Enterprise support available</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Hexagon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Consultation</h3>
                      <p className="text-sm text-gray-600">Free strategy session</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900 mb-1">Enterprise Inquiries</h3>
                      <p className="text-sm text-amber-700">
                        For enterprise implementations, custom integrations, or partnerships, please mention this in your message for priority handling.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}