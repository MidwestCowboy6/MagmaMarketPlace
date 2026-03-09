import { useEffect, useState } from 'react';

export function useColorScheme(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Default to dark for Magma Marketplace
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'dark'); // Always dark for this app

    const handler = (e: MediaQueryListEvent) => {
      setColorScheme('dark'); // Keep dark always for Magma brand
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return colorScheme;
}
