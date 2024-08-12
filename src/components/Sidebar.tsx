// File: src/components/Sidebar.tsx
import React from 'react';

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
      {children}
    </div>
  );
};

export default Sidebar;