import { Outlet } from 'react-router-dom';
import ParentSidebar from '@/components/parent/ParentSidebar';
import { ParentChildrenProvider } from '@/context';

export default function ParentLayout() {
  return (
    <ParentChildrenProvider>
      <div className="flex min-h-screen">
        <ParentSidebar />
        <div className="flex-1 min-h-0 overflow-auto">
          <Outlet />
        </div>
      </div>
    </ParentChildrenProvider>
  );
}
