import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 min-h-0 overflow-auto flex flex-col">
        <AdminHeader />
        {/* pt pour ne pas passer sous le header fixe (hauteur ~ 56px) */}
        <main className="flex-1 min-h-0 pt-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
