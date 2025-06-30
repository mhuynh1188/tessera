import { Metadata } from 'next';
import { EmailTemplateManager } from '@/components/admin/EmailTemplateManager';

export const metadata: Metadata = {
  title: 'Email Management | Hex App Admin',
  description: 'Manage email templates and system configuration',
};

export default function EmailManagementPage() {
  return <EmailTemplateManager />;
}