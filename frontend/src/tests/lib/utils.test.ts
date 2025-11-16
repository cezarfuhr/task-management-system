import { cn, formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan.*15.*2024/);
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct color for priority', () => {
      expect(getPriorityColor('low')).toContain('green');
      expect(getPriorityColor('medium')).toContain('yellow');
      expect(getPriorityColor('high')).toContain('orange');
      expect(getPriorityColor('urgent')).toContain('red');
    });

    it('should return default color for unknown priority', () => {
      expect(getPriorityColor('unknown')).toContain('yellow');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for status', () => {
      expect(getStatusColor('todo')).toContain('gray');
      expect(getStatusColor('in_progress')).toContain('blue');
      expect(getStatusColor('review')).toContain('purple');
      expect(getStatusColor('done')).toContain('green');
    });
  });
});
