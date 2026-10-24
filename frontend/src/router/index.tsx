import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {}
});

export const useRouter = () => useContext(RouterContext);

export const Router: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to.startsWith('#')) {
      // Anchor scroll
      const element = document.getElementById(to.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      setPath(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Link: React.FC<{
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ href, className, children, onClick }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onClick) onClick();
    navigate(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
};
