import { useEffect, useRef, useCallback } from 'react';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 2 * 60 * 1000;  // warn 2 minutes before expiry

const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

/**
 * Resets a 30-minute inactivity timer on any user interaction.
 * Calls onWarning 2 minutes before expiry, and onExpire when time runs out.
 * Returns a resetTimer function the caller can invoke manually (e.g. on modal close).
 */
export function useSessionTimeout({ onExpire, onWarning, enabled = true }) {
  const expireTimer = useRef(null);
  const warnTimer = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(expireTimer.current);
    clearTimeout(warnTimer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    warnTimer.current = setTimeout(() => {
      onWarning?.();
    }, TIMEOUT_MS - WARNING_MS);
    expireTimer.current = setTimeout(() => {
      onExpire?.();
    }, TIMEOUT_MS);
  }, [enabled, clearTimers, onExpire, onWarning]);

  useEffect(() => {
    if (!enabled) return;
    resetTimer();
    EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      clearTimers();
      EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [enabled, resetTimer, clearTimers]);

  return { resetTimer };
}
