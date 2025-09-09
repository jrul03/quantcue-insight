require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/stream' });

const PORT = process.env.PORT || 8080;
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
const MAX_SYMBOLS_PER_CLIENT = parseInt(process.env.MAX_SYMBOLS_PER_CLIENT) || 100;
const THROTTLE_MS = parseInt(process.env.THROTTLE_MS) || 100;

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Logging
const log = (level, message, meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }));
};

// Cache for REST endpoints
const cache = new Map();
const getCacheKey = (endpoint, params) => `${endpoint}:${JSON.stringify(params)}`;
const getCached = (key) => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < 30 * 60 * 1000) { // 30 minutes
    return item.data;
  }
  cache.delete(key);
  return null;
};
const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Polygon WebSocket connections
const polygonConnections = new Map();
const clientSubscriptions = new Map();
const clients = new Map();

// Create Polygon WebSocket connection for market type
const createPolygonConnection = (market) => {
  const wsUrl = `wss://socket.polygon.io/${market}`;
  const ws = new (require('ws'))(wsUrl);
  
  ws.on('open', () => {
    log('info', `Connected to Polygon ${market} WebSocket`);
    ws.send(JSON.stringify({ action: 'auth', params: POLYGON_API_KEY }));
  });
  
  ws.on('message', (data) => {
    try {
      const messages = JSON.parse(data);
      if (!Array.isArray(messages)) return;
      
      messages.forEach(msg => {
        if (msg.ev && msg.sym) {
          const normalizedMessage = normalizePolygonMessage(msg, market);
          broadcastToSubscribedClients(normalizedMessage);
        }
      });
    } catch (error) {
      log('error', 'Error processing Polygon message', { error: error.message, market });
    }
  });
  
  ws.on('error', (error) => {
    log('error', `Polygon ${market} WebSocket error`, { error: error.message });
  });
  
  ws.on('close', () => {
    log('warn', `Polygon ${market} WebSocket closed, reconnecting...`);
    setTimeout(() => {
      polygonConnections.set(market, createPolygonConnection(market));
    }, 5000);
  });
  
  return ws;
};

// Initialize Polygon connections
['stocks', 'options', 'crypto', 'forex'].forEach(market => {
  polygonConnections.set(market, createPolygonConnection(market));
});

// Normalize Polygon messages to consistent format
const normalizePolygonMessage = (msg, market) => {
  const channelType = getChannelType(msg.ev);
  return {
    timestamp: Date.now(),
    market,
    channel: channelType,
    symbol: msg.sym,
    data: msg
  };
};

const getChannelType = (ev) => {
  if (ev === 'T' || ev === 'XT') return 'trade';
  if (ev === 'Q' || ev === 'XQ' || ev === 'C' || ev === 'QO') return 'quote';
  if (ev === 'A' || ev === 'XA' || ev === 'CA') return 'agg1s';
  return 'unknown';
};

// Broadcast to clients subscribed to specific symbol
const broadcastToSubscribedClients = (message) => {
  const symbol = message.symbol;
  clients.forEach((client, clientId) => {
    const subscriptions = clientSubscriptions.get(clientId);
    if (subscriptions && subscriptions.has(symbol)) {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(JSON.stringify(message));
      }
    }
  });
};

// WebSocket client management
wss.on('connection', (ws, request) => {
  const clientId = uuidv4();
  const clientIp = request.socket.remoteAddress;
  
  clients.set(clientId, { ws, ip: clientIp, connectedAt: Date.now() });
  clientSubscriptions.set(clientId, new Set());
  
  log('info', 'Client connected', { clientId, ip: clientIp });
  
  ws.on('close', () => {
    log('info', 'Client disconnected', { clientId });
    clients.delete(clientId);
    clientSubscriptions.delete(clientId);
  });
  
  ws.on('error', (error) => {
    log('error', 'WebSocket client error', { clientId, error: error.message });
  });
});

// Subscribe to symbols
app.post('/api/subscribe', (req, res) => {
  const { symbols, clientId } = req.body;
  
  if (!symbols || !Array.isArray(symbols) || !clientId) {
    return res.status(400).json({ error: 'Invalid symbols or clientId' });
  }
  
  const subscriptions = clientSubscriptions.get(clientId) || new Set();
  
  if (subscriptions.size + symbols.length > MAX_SYMBOLS_PER_CLIENT) {
    return res.status(429).json({ error: 'Too many symbols subscribed' });
  }
  
  symbols.forEach(symbol => {
    subscriptions.add(symbol);
    subscribeToPolygon(symbol);
  });
  
  clientSubscriptions.set(clientId, subscriptions);
  
  log('info', 'Symbols subscribed', { clientId, symbols, total: subscriptions.size });
  res.json({ success: true, subscribed: symbols });
});

// Unsubscribe from symbols  
app.post('/api/unsubscribe', (req, res) => {
  const { symbols, clientId } = req.body;
  
  if (!symbols || !Array.isArray(symbols) || !clientId) {
    return res.status(400).json({ error: 'Invalid symbols or clientId' });
  }
  
  const subscriptions = clientSubscriptions.get(clientId);
  if (subscriptions) {
    symbols.forEach(symbol => subscriptions.delete(symbol));
  }
  
  log('info', 'Symbols unsubscribed', { clientId, symbols });
  res.json({ success: true, unsubscribed: symbols });
});

// Subscribe to Polygon channels based on symbol
const subscribeToPolygon = (symbol) => {
  const { market, channels } = getSymbolChannels(symbol);
  const ws = polygonConnections.get(market);
  
  if (ws && ws.readyState === 1) {
    channels.forEach(channel => {
      ws.send(JSON.stringify({ action: 'subscribe', params: channel }));
    });
  }
};

// Get appropriate market and channels for symbol
const getSymbolChannels = (symbol) => {
  if (symbol.includes('-USD') || symbol.includes('BTC') || symbol.includes('ETH')) {
    return {
      market: 'crypto',
      channels: [`XT.${symbol}`, `XQ.${symbol}`, `XA.${symbol}`]
    };
  } else if (symbol.includes('/')) {
    return {
      market: 'forex', 
      channels: [`C.${symbol}`, `CA.${symbol}`]
    };
  } else if (symbol.includes('O:')) {
    return {
      market: 'options',
      channels: [`QO.${symbol}`]
    };
  } else {
    return {
      market: 'stocks',
      channels: [`T.${symbol}`, `Q.${symbol}`, `A.${symbol}`]
    };
  }
};

// REST API endpoints
app.get('/api/tickers', async (req, res) => {
  try {
    const { market = 'stocks', search = '', limit = 50 } = req.query;
    const cacheKey = getCacheKey('/api/tickers', { market, search, limit });
    
    let cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const baseUrl = 'https://api.polygon.io';
    let endpoint;
    
    switch (market) {
      case 'stocks':
        endpoint = `/v3/reference/tickers?market=stocks&search=${search}&limit=${limit}&apikey=${POLYGON_API_KEY}`;
        break;
      case 'crypto':
        endpoint = `/v3/reference/tickers?market=crypto&search=${search}&limit=${limit}&apikey=${POLYGON_API_KEY}`;
        break;
      case 'forex':
        endpoint = `/v3/reference/tickers?market=fx&search=${search}&limit=${limit}&apikey=${POLYGON_API_KEY}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid market type' });
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`);
    const data = await response.json();
    
    setCache(cacheKey, data);
    res.json(data);
    
  } catch (error) {
    log('error', 'Error fetching tickers', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/options/contracts', async (req, res) => {
  try {
    const { underlying, exp_from, exp_to, limit = 100 } = req.query;
    
    if (!underlying) {
      return res.status(400).json({ error: 'underlying parameter required' });
    }
    
    const cacheKey = getCacheKey('/api/options/contracts', { underlying, exp_from, exp_to, limit });
    let cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const params = new URLSearchParams({
      'underlying.ticker': underlying,
      limit,
      apikey: POLYGON_API_KEY
    });
    
    if (exp_from) params.append('expiration_date.gte', exp_from);
    if (exp_to) params.append('expiration_date.lte', exp_to);
    
    const response = await fetch(`https://api.polygon.io/v3/reference/options/contracts?${params}`);
    const data = await response.json();
    
    setCache(cacheKey, data);
    res.json(data);
    
  } catch (error) {
    log('error', 'Error fetching options contracts', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/healthz', (req, res) => {
  const status = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: {
      clients: clients.size,
      polygon: Array.from(polygonConnections.entries()).map(([market, ws]) => ({
        market,
        connected: ws.readyState === 1
      }))
    }
  };
  res.json(status);
});

// Start server
server.listen(PORT, () => {
  log('info', `QuantCue Stream Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  log('info', 'Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});