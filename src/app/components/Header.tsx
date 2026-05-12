import { Plane, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onAuthClick: () => void;
  onDashboardClick?: () => void;
  onNavigateToSection?: (sectionId: 'explore' | 'plans' | 'about') => void;
  onHomeClick?: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

export function Header({ onAuthClick, onDashboardClick, onNavigateToSection, onHomeClick, isAuthenticated, userName }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayUserName = userName
    ? userName.charAt(0).toUpperCase() + userName.slice(1)
    : '';

  const scrollToTop = () => {
    onHomeClick?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: 'explore' | 'plans' | 'about') => {
    if (onNavigateToSection) {
      onNavigateToSection(sectionId);
      setMobileMenuOpen(false);
      return;
    }

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-primary/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-3 cursor-pointer text-left"
          >
            <div className="bg-gradient-to-br from-primary via-secondary to-accent p-2.5 rounded-xl shadow-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Smart Travel
              </h1>
              <p className="text-xs text-muted-foreground">Explore Egypt your way</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={() => scrollToSection('explore')}
              className="text-foreground hover:text-primary transition-colors"
            >
              Explore
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('plans')}
              className="text-foreground hover:text-primary transition-colors"
            >
              Travel Plans
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={onDashboardClick}
                className="text-foreground hover:text-primary transition-colors"
              >
                My Trips
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-foreground hover:text-primary transition-colors"
            >
              About
            </button>
          </nav>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border-2 border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{displayUserName}</span>
                </div>
                <button
                  type="button"
                  onClick={onAuthClick}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                  type="button"
                onClick={onAuthClick}
                className="px-6 py-2.5 bg-gradient-to-r from-primary via-secondary to-accent text-white rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-border">
          <div className="px-4 py-3 space-y-3">
            <button type="button" onClick={() => scrollToSection('explore')} className="block w-full text-left py-2 text-foreground hover:text-primary">
              Explore
            </button>
            <button type="button" onClick={() => scrollToSection('plans')} className="block w-full text-left py-2 text-foreground hover:text-primary">
              Travel Plans
            </button>
            {isAuthenticated && (
              <>
                <button 
                  type="button"
                  onClick={() => {
                    onDashboardClick?.();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-foreground hover:text-primary"
                >
                  My Trips
                </button>
              </>
            )}
            <button type="button" onClick={() => scrollToSection('about')} className="block w-full text-left py-2 text-foreground hover:text-primary">
              About
            </button>
            <button
              type="button"
              onClick={onAuthClick}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-rose-500 via-red-600 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isAuthenticated ? 'Logout' : 'Sign In'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
