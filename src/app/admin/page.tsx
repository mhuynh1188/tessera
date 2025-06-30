import { Metadata } from 'next';
import { SimpleAdminInterface } from '@/components/ui/simple-admin';
import { AdminAuthWrapper } from '@/components/admin/AdminAuthWrapper';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Hex App Enterprise',
  description: 'Enterprise administration dashboard for user management, security, and system configuration',
};

export default function AdminDashboard() {
  return (
    <AdminAuthWrapper>
      <SimpleAdminInterface />
    </AdminAuthWrapper>
  );
}