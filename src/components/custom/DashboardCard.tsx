"use client";

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  gradient?: string;
}

export default function DashboardCard({ 
  title, 
  icon: Icon, 
  children, 
  onClick,
  gradient = "from-purple-600 to-blue-500"
}: DashboardCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`bg-gradient-to-br ${gradient} p-3 rounded-2xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
