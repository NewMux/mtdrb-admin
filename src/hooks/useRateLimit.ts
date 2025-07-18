import { useState, useEffect, useCallback } from 'react';

export const useRateLimit = (limit: number, interval: number) => {
  const [count, setCount] = useState(0);
  const [lastReset, setLastReset] = useState(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastReset >= interval) {
      setCount(0);
      setLastReset(now);
    }
  }, [count, lastReset, interval]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    if (now - lastReset >= interval) {
      setCount(0);
      setLastReset(now);
    }
    
    if (count >= limit) {
      throw new Error(`Rate limit exceeded (${limit} requests per ${interval/1000}s)`);
    }
    
    setCount(c => c + 1);
  }, [count, limit, interval, lastReset]);

  const resetLimit = useCallback(() => {
    setCount(0);
    setLastReset(Date.now());
  }, []);

  return { 
    checkLimit, 
    resetLimit, 
    remainingRequests: Math.max(0, limit - count),
    timeUntilReset: Math.max(0, interval - (Date.now() - lastReset))
  };
}; 