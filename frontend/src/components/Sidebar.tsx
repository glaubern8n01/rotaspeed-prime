
import React from 'react';
import {
  Home,
  Package,
  Map,
  MapPin,
  BarChart2,
  Settings,
  Book,
  LogOut,
  Plus
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { logout } = useAuth();
  
  const navItems = [
    { to: '/', icon: Home, label: 'Painel' },
    { to: '/nova-entrega', icon: Plus, label: 'Nova Entrega' },
    { to: '/entregas', icon: Package, label: 'Entregas' },
    { to: '/rota', icon: Map, label: 'Rota' },
    { to: '/rotas-confirmadas', icon: MapPin, label: 'Rotas Confirmadas' },
    { to: '/estatisticas', icon: BarChart2, label: 'Estatísticas' },
    { to: '/configuracoes', icon: Settings, label: 'Configurações' },
    { to: '/como-usar', icon: Book, label: 'Como Usar' },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-md transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } z-50 lg:translate-x-0 lg:static`}
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-lg font-bold">RotaSpeed</span>
        <button
          className="lg:hidden focus:outline-none"
          onClick={closeSidebar}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
      <nav className="flex flex-col p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 transition-colors duration-200 ${
                isActive ? 'bg-gray-800 font-semibold' : ''
              }`
            }
            onClick={closeSidebar}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        {/* Botão Sair */}
        <button
          onClick={() => {
            logout();
            closeSidebar();
          }}
          className="flex items-center space-x-3 p-3 rounded-md text-white hover:bg-gray-800 transition-colors duration-200 w-full text-left"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
