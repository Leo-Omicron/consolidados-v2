import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders all tabs and the title', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
    expect(screen.getByText('Analysis')).toBeDefined();
    expect(screen.getByText('Charts')).toBeDefined();
    expect(screen.getByText('Reports')).toBeDefined();
  });

  it('calls setActiveTab when a tab is clicked', () => {
    const setActiveTab = vi.fn();
    render(<Header activeTab="analysis" setActiveTab={setActiveTab} />);
    
    fireEvent.click(screen.getByText('Charts'));
    expect(setActiveTab).toHaveBeenCalledWith('charts');
  });
});
