import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should render theme toggle buttons', () => {
    render(<ThemeToggle />);

    expect(screen.getByTitle('Light mode')).toBeInTheDocument();
    expect(screen.getByTitle('Dark mode')).toBeInTheDocument();
    expect(screen.getByTitle('System theme')).toBeInTheDocument();
  });

  it('should save theme to localStorage when clicked', () => {
    render(<ThemeToggle />);

    const darkModeButton = screen.getByTitle('Dark mode');
    fireEvent.click(darkModeButton);

    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});
