import { useState } from 'react';
import {
  Navbar,
  NavBody,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle
} from '../../components/ui/resizable-navbar';

interface ConsoleNavBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function ConsoleNavBar({ activeView, onViewChange }: ConsoleNavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { name: 'Session', link: '#session' },
    { name: 'Connection', link: '#connection' },
    { name: 'Status', link: '#status' },
    { name: 'Profile', link: '#profile' },
  ];

  const handleNavItemClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (href) {
      const view = href.replace('#', '');
      onViewChange(view);
      setMobileMenuOpen(false);
    }
  };

  return (
    <Navbar className="sticky top-0 z-50">
      <NavBody className="liquid-glass-nav">
        <div className="flex items-center">
          <span className="text-white font-semibold text-lg mr-8">Navigation</span>
        </div>
        <div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-white transition duration-200 lg:flex lg:space-x-2">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              onClick={handleNavItemClick}
              className={`relative px-4 py-2 text-white transition-colors hover:text-blue-400 ${
                activeView === item.link.replace('#', '') ? 'text-blue-400 font-semibold' : ''
              }`}
            >
              <span className="relative z-20">{item.name}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-300 text-sm">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</span>
        </div>
      </NavBody>

              <MobileNav className="liquid-glass-nav">
        <MobileNavHeader>
          <span className="text-white font-semibold text-lg">Navigation</span>
          <MobileNavToggle
            isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </MobileNavHeader>
        <MobileNavMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          className="bg-gray-800/90 backdrop-blur-sm border border-gray-700"
        >
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              onClick={handleNavItemClick}
              className={`text-white hover:text-blue-400 transition-colors ${
                activeView === item.link.replace('#', '') ? 'text-blue-400 font-semibold' : ''
              }`}
            >
              {item.name}
            </a>
          ))}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
