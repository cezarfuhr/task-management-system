'use client';

import { useEffect } from 'react';
import tinykeys from 'tinykeys';

export function useKeyboardShortcuts(callbacks: {
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleTheme?: () => void;
}) {
  useEffect(() => {
    const unsubscribe = tinykeys(window, {
      'n': (e) => {
        e.preventDefault();
        callbacks.onNewTask?.();
      },
      '$mod+k': (e) => {
        e.preventDefault();
        callbacks.onSearch?.();
      },
      '$mod+Shift+t': (e) => {
        e.preventDefault();
        callbacks.onToggleTheme?.();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [callbacks]);
}
