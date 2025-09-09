import { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface StreamMessage {
  timestamp: number;
  market: 'stocks' | 'options' | 'crypto' | 'forex';
  channel: 'trade' | 'quote' | 'agg1s';
  symbol: string;
  data: any;
}

interface UseStreamDataOptions {
  autoConnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface StreamState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: StreamMessage | null;
  subscriptions: Set<string>;
}

const STREAM_URL = import.meta.env.VITE_STREAM_URL || 'ws://localhost:8080/stream';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function useStreamData(options: UseStreamDataOptions = {}) {
  const {
    autoConnect = true,
    reconnectDelay = 5000,
    maxReconnectAttempts = 5
  } = options;

  const [state, setState] = useState<StreamState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    subscriptions: new Set()
  });

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(uuidv4());
  const reconnectAttemptsRef = useRef(0);
  const messageHandlersRef = useRef<Map<string, (message: StreamMessage) => void>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const ws = new WebSocket(STREAM_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Stream connected');
        reconnectAttemptsRef.current = 0;
        setState(prev => ({ 
          ...prev, 
          connected: true, 
          connecting: false, 
          error: null 
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: StreamMessage = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: message }));
          
          // Call symbol-specific handlers
          const handler = messageHandlersRef.current.get(message.symbol);
          if (handler) {
            handler(message);
          }

          // Call general handlers
          const globalHandler = messageHandlersRef.current.get('*');
          if (globalHandler) {
            globalHandler(message);
          }
        } catch (error) {
          console.error('Error parsing stream message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Stream error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Connection error', 
          connecting: false 
        }));
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, connected: false, connecting: false }));
        
        // Auto-reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
          
          console.log(`Stream disconnected. Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setState(prev => ({ 
            ...prev, 
            error: 'Max reconnection attempts reached' 
          }));
        }
      };

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to create WebSocket connection',
        connecting: false 
      }));
    }
  }, [maxReconnectAttempts, reconnectDelay]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      connected: false, 
      connecting: false,
      error: null
    }));
  }, []);

  // Subscribe to symbols
  const subscribe = useCallback(async (symbols: string[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          symbols
        }),
      });

      if (!response.ok) {
        throw new Error(`Subscribe failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setState(prev => {
        const newSubscriptions = new Set(prev.subscriptions);
        symbols.forEach(symbol => newSubscriptions.add(symbol));
        return { ...prev, subscriptions: newSubscriptions };
      });

      return result;
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  }, []);

  // Unsubscribe from symbols
  const unsubscribe = useCallback(async (symbols: string[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          symbols
        }),
      });

      if (!response.ok) {
        throw new Error(`Unsubscribe failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setState(prev => {
        const newSubscriptions = new Set(prev.subscriptions);
        symbols.forEach(symbol => newSubscriptions.delete(symbol));
        return { ...prev, subscriptions: newSubscriptions };
      });

      return result;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      throw error;
    }
  }, []);

  // Add message handler for specific symbol or global (*) 
  const addMessageHandler = useCallback((symbol: string, handler: (message: StreamMessage) => void) => {
    messageHandlersRef.current.set(symbol, handler);
    
    return () => {
      messageHandlersRef.current.delete(symbol);
    };
  }, []);

  // Search tickers
  const searchTickers = useCallback(async (market: string, search: string, limit = 50) => {
    try {
      const params = new URLSearchParams({ market, search, limit: limit.toString() });
      const response = await fetch(`${API_BASE_URL}/api/tickers?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Search tickers error:', error);
      throw error;
    }
  }, []);

  // Search options contracts
  const searchOptionsContracts = useCallback(async (underlying: string, expFrom?: string, expTo?: string, limit = 100) => {
    try {
      const params = new URLSearchParams({ underlying, limit: limit.toString() });
      if (expFrom) params.append('exp_from', expFrom);
      if (expTo) params.append('exp_to', expTo);
      
      const response = await fetch(`${API_BASE_URL}/api/options/contracts?${params}`);
      
      if (!response.ok) {
        throw new Error(`Options search failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Search options error:', error);
      throw error;
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // State
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    lastMessage: state.lastMessage,
    subscriptions: Array.from(state.subscriptions),
    
    // Actions
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    addMessageHandler,
    searchTickers,
    searchOptionsContracts
  };
}