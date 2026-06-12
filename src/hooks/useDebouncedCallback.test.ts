import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('does not call callback immediately', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));
    
    result.current();
    expect(callback).not.toHaveBeenCalled();
  });

  it('calls callback after delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));
    
    result.current('arg1');
    vi.advanceTimersByTime(500);
    
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg1');
  });

  it('resets timer on subsequent calls (only last call fires)', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));
    
    result.current('call1');
    vi.advanceTimersByTime(250);
    
    result.current('call2');
    vi.advanceTimersByTime(250);
    expect(callback).not.toHaveBeenCalled(); 
    
    vi.advanceTimersByTime(250);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('call2');
  });

  it('cleans up timer on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500));
    
    result.current();
    unmount();
    
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
  });
});
