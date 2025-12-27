import { ThreatActor, Endpoint, AnomalyEvent, ActionRecommendation, TrafficMetrics, TimeSeriesData } from '@/types/security';

export const mockThreatActors: ThreatActor[] = [
  {
    id: '1',
    ip: '185.220.101.42',
    country: 'Russia',
    countryCode: 'RU',
    threatScore: 98,
    requestCount: 45230,
    blockedCount: 44100,
    firstSeen: new Date(Date.now() - 3600000 * 24),
    lastSeen: new Date(Date.now() - 60000),
    status: 'active',
    fingerprint: 'fp_7a3b9c2d1e',
    userAgent: 'python-requests/2.28.0',
    targetEndpoints: ['/api/auth/login', '/api/users'],
    attackTypes: ['credential_stuffing', 'rate_abuse'],
  },
  {
    id: '2',
    ip: '103.152.220.33',
    country: 'China',
    countryCode: 'CN',
    threatScore: 92,
    requestCount: 28450,
    blockedCount: 27800,
    firstSeen: new Date(Date.now() - 3600000 * 12),
    lastSeen: new Date(Date.now() - 120000),
    status: 'blocked',
    fingerprint: 'fp_2c4d6e8f0a',
    userAgent: 'curl/7.68.0',
    targetEndpoints: ['/api/products', '/api/search'],
    attackTypes: ['scraping', 'enumeration'],
  },
  {
    id: '3',
    ip: '45.155.205.108',
    country: 'Netherlands',
    countryCode: 'NL',
    threatScore: 85,
    requestCount: 15670,
    blockedCount: 12300,
    firstSeen: new Date(Date.now() - 3600000 * 6),
    lastSeen: new Date(Date.now() - 300000),
    status: 'monitoring',
    fingerprint: 'fp_9b8a7c6d5e',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    targetEndpoints: ['/api/checkout', '/api/payments'],
    attackTypes: ['payment_fraud_attempt'],
  },
  {
    id: '4',
    ip: '91.121.87.45',
    country: 'France',
    countryCode: 'FR',
    threatScore: 76,
    requestCount: 8920,
    blockedCount: 5600,
    firstSeen: new Date(Date.now() - 3600000 * 2),
    lastSeen: new Date(Date.now() - 180000),
    status: 'active',
    fingerprint: 'fp_3e2d1c0b9a',
    userAgent: 'Scrapy/2.7.1',
    targetEndpoints: ['/api/catalog', '/api/inventory'],
    attackTypes: ['scraping'],
  },
  {
    id: '5',
    ip: '192.99.34.178',
    country: 'Canada',
    countryCode: 'CA',
    threatScore: 68,
    requestCount: 5430,
    blockedCount: 2100,
    firstSeen: new Date(Date.now() - 3600000),
    lastSeen: new Date(Date.now() - 60000),
    status: 'monitoring',
    fingerprint: 'fp_5f4e3d2c1b',
    userAgent: 'axios/0.27.2',
    targetEndpoints: ['/api/auth/register'],
    attackTypes: ['account_creation_abuse'],
  },
];

export const mockEndpoints: Endpoint[] = [
  {
    id: '1',
    path: '/api/auth/login',
    method: 'POST',
    requestsPerMinute: 2450,
    avgResponseTime: 145,
    errorRate: 68.5,
    anomalyScore: 95,
    isUnderAttack: true,
    topAbusers: ['185.220.101.42', '103.152.220.33'],
  },
  {
    id: '2',
    path: '/api/products',
    method: 'GET',
    requestsPerMinute: 1820,
    avgResponseTime: 89,
    errorRate: 2.3,
    anomalyScore: 72,
    isUnderAttack: true,
    topAbusers: ['103.152.220.33', '91.121.87.45'],
  },
  {
    id: '3',
    path: '/api/search',
    method: 'GET',
    requestsPerMinute: 980,
    avgResponseTime: 234,
    errorRate: 1.8,
    anomalyScore: 45,
    isUnderAttack: false,
    topAbusers: ['103.152.220.33'],
  },
  {
    id: '4',
    path: '/api/checkout',
    method: 'POST',
    requestsPerMinute: 156,
    avgResponseTime: 567,
    errorRate: 12.4,
    anomalyScore: 58,
    isUnderAttack: false,
    topAbusers: ['45.155.205.108'],
  },
  {
    id: '5',
    path: '/api/users',
    method: 'GET',
    requestsPerMinute: 342,
    avgResponseTime: 78,
    errorRate: 0.5,
    anomalyScore: 15,
    isUnderAttack: false,
    topAbusers: [],
  },
];

export const mockAnomalies: AnomalyEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 120000),
    type: 'credential_stuffing',
    severity: 'critical',
    endpoint: '/api/auth/login',
    sourceIp: '185.220.101.42',
    description: 'Detected 45K+ login attempts from single IP with rotating credentials',
    recommendation: 'Block IP immediately and enable CAPTCHA for login endpoint',
    collateralDamage: {
      affectedUsers: 0,
      affectedRequests: 45230,
      legitimateTrafficPercent: 2.5,
    },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 300000),
    type: 'scraping',
    severity: 'high',
    endpoint: '/api/products',
    sourceIp: '103.152.220.33',
    description: 'Aggressive scraping pattern detected - 28K requests in 12 hours',
    recommendation: 'Apply rate limiting (100 req/min) and require authentication',
    collateralDamage: {
      affectedUsers: 12,
      affectedRequests: 28450,
      legitimateTrafficPercent: 8.2,
    },
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 600000),
    type: 'rate_spike',
    severity: 'medium',
    endpoint: '/api/search',
    sourceIp: '91.121.87.45',
    description: 'Traffic spike 400% above baseline for search endpoint',
    recommendation: 'Monitor closely and prepare rate limit rules',
    collateralDamage: {
      affectedUsers: 145,
      affectedRequests: 8920,
      legitimateTrafficPercent: 34.5,
    },
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 900000),
    type: 'geo_anomaly',
    severity: 'medium',
    endpoint: '/api/checkout',
    sourceIp: '45.155.205.108',
    description: 'Unusual geo pattern - checkout requests from datacenter IP',
    recommendation: 'Add friction (2FA) for high-risk transactions',
    collateralDamage: {
      affectedUsers: 3,
      affectedRequests: 156,
      legitimateTrafficPercent: 15.0,
    },
  },
];

export const mockRecommendations: ActionRecommendation[] = [
  {
    id: '1',
    action: 'block',
    target: '185.220.101.42',
    reason: 'Confirmed credential stuffing attack with 98% malicious traffic',
    confidence: 99,
    collateralDamage: {
      affectedUsers: 0,
      affectedRequests: 45230,
      legitimateTrafficPercent: 2.5,
    },
    estimatedImpact: 'Blocks ~45K malicious requests/day, minimal impact on legitimate users',
  },
  {
    id: '2',
    action: 'throttle',
    target: '/api/products',
    reason: 'High scraping activity detected on product catalog',
    confidence: 87,
    collateralDamage: {
      affectedUsers: 12,
      affectedRequests: 1200,
      legitimateTrafficPercent: 8.2,
    },
    estimatedImpact: 'Rate limit to 50 req/min will slow scrapers without affecting normal browsing',
  },
  {
    id: '3',
    action: 'challenge',
    target: '/api/auth/login',
    reason: 'Enable CAPTCHA to prevent automated login attempts',
    confidence: 94,
    collateralDamage: {
      affectedUsers: 2340,
      affectedRequests: 5600,
      legitimateTrafficPercent: 100,
    },
    estimatedImpact: 'All users face CAPTCHA but stops 99% of automated attacks',
  },
  {
    id: '4',
    action: 'monitor',
    target: '192.99.34.178',
    reason: 'Suspicious pattern but insufficient data to confirm malicious intent',
    confidence: 62,
    collateralDamage: {
      affectedUsers: 0,
      affectedRequests: 0,
      legitimateTrafficPercent: 0,
    },
    estimatedImpact: 'No immediate action, continue monitoring for pattern confirmation',
  },
];

export const mockMetrics: TrafficMetrics = {
  totalRequests: 2847650,
  blockedRequests: 89234,
  anomalousRequests: 12456,
  avgResponseTime: 142,
  errorRate: 3.2,
  uniqueIps: 45623,
  requestsPerSecond: 847,
};

export const generateTimeSeriesData = (hours: number = 24): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 3600000);
    const baseRequests = 1000 + Math.random() * 500;
    const anomalySpike = i === 3 || i === 8 ? 2.5 : 1;
    
    data.push({
      timestamp,
      requests: Math.floor(baseRequests * anomalySpike),
      blocked: Math.floor(baseRequests * 0.03 * anomalySpike * (1 + Math.random())),
      anomalies: Math.floor(Math.random() * 20 * anomalySpike),
    });
  }
  
  return data;
};
