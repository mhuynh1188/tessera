'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Shield, 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface TwoFactorSetupProps {
  user: {
    id: string;
    email: string;
    two_factor_enabled?: boolean;
  };
  onStatusChange?: (enabled: boolean) => void;
}

interface SetupData {
  qrCode: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export function TwoFactorSetup({ user, onStatusChange }: TwoFactorSetupProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  
  const { toast } = useToast();

  const startSetup = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/enterprise/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSetupData(data.setup);
        setStep('verify');
        setIsSetupOpen(true);
      } else {
        throw new Error(data.message || 'Failed to setup 2FA');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to setup 2FA',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/enterprise/2fa/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep('backup');
        toast({
          title: "Success",
          description: "2FA has been enabled successfully"
        });
        onStatusChange?.(true);
      } else {
        throw new Error(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to verify 2FA',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!currentPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/enterprise/2fa/setup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsDisableOpen(false);
        setCurrentPassword('');
        toast({
          title: "Success",
          description: "2FA has been disabled"
        });
        onStatusChange?.(false);
      } else {
        throw new Error(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to disable 2FA',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Text copied to clipboard"
      });
    });
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    
    const content = [
      'Hex App - Two-Factor Authentication Backup Codes',
      '=================================================',
      '',
      'IMPORTANT: Store these codes in a safe place.',
      'Each code can only be used once.',
      '',
      ...setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Account: ${user.email}`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hex-app-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completeSetup = () => {
    setIsSetupOpen(false);
    setSetupData(null);
    setVerificationToken('');
    setStep('generate');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.two_factor_enabled ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5 text-gray-500" />
            )}
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          {user.two_factor_enabled ? (
            <Badge variant="default" className="bg-green-500">
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary">
              Disabled
            </Badge>
          )}
        </div>
        <CardDescription>
          Add an extra layer of security to your account with two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.two_factor_enabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Two-factor authentication is enabled</span>
            </div>
            
            <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  Disable 2FA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Disable Two-Factor Authentication
                  </DialogTitle>
                  <DialogDescription>
                    This will make your account less secure. Please enter your current password to confirm.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={disable2FA}
                      disabled={loading}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      Disable 2FA
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDisableOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Your account is not protected by 2FA</span>
            </div>
            
            <Button 
              onClick={startSetup}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Enable 2FA
            </Button>
          </div>
        )}

        {/* Setup Dialog */}
        <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Setup Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                {step === 'verify' && 'Scan the QR code with your authenticator app'}
                {step === 'backup' && 'Save your backup codes in a safe place'}
              </DialogDescription>
            </DialogHeader>

            {step === 'verify' && setupData && (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <img 
                      src={setupData.qrCode} 
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {/* Manual Entry */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Can't scan? Enter this code manually:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={setupData.manualEntryKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(setupData.manualEntryKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Verification */}
                <div className="space-y-2">
                  <Label htmlFor="verification-code">
                    Enter the 6-digit code from your authenticator app:
                  </Label>
                  <Input
                    id="verification-code"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-lg tracking-wider"
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={verifyAndEnable}
                  disabled={loading || verificationToken.length !== 6}
                  className="w-full flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Verify and Enable
                </Button>
              </div>
            )}

            {step === 'backup' && setupData && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">Backup Codes</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Save these backup codes in a safe place. Each code can only be used once 
                    if you lose access to your authenticator app.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={downloadBackupCodes}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy All
                  </Button>
                </div>

                <Button 
                  onClick={completeSetup}
                  className="w-full"
                >
                  I've Saved My Backup Codes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}