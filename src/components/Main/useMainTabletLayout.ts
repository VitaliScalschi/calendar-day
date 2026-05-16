import { useEffect, useState } from 'react';

export const MAIN_TABLET_BREAKPOINT = 1024;

export function useMainTabletLayout() {
  const [isTabletViewport, setIsTabletViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= MAIN_TABLET_BREAKPOINT;
  });

  const [isFilterOpen, setIsFilterOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > MAIN_TABLET_BREAKPOINT;
  });

  useEffect(() => {
    const onResize = () => {
      const isTablet = window.innerWidth <= MAIN_TABLET_BREAKPOINT;
      const wasTablet = isTabletViewport;
      setIsTabletViewport(isTablet);

      if (!isTablet) {
        setIsFilterOpen(true);
      } else if (!wasTablet && isTablet) {
        setIsFilterOpen(false);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isTabletViewport]);

  useEffect(() => {
    if (!isTabletViewport) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = isFilterOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isTabletViewport, isFilterOpen]);

  return { isTabletViewport, isFilterOpen, setIsFilterOpen };
}
