import type { Request, Response } from 'express';

const LTA_DATAMALL_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

/**
 * Serverless Bus Arrival endpoint.
 * Fetches live bus arrival times, next 2-3 buses, and load capacities from LTA DataMall v3.
 *
 * Query params:
 * - BusStopCode: required 5-digit bus stop code (e.g. 83139 or 08057)
 * - ServiceNo: optional bus service number (e.g. 190, 65)
 *
 * Headers:
 * - AccountKey: optional override if not set via LTA_ACCOUNT_KEY environment variable.
 */
export default async function handler(req: Request | any, res: Response | any) {
  // Support both GET query and body
  const query = req.query || {};
  const busStopCode = (query.BusStopCode || query.busStopCode || query.busstopcode || '').toString().trim();
  const serviceNo = (query.ServiceNo || query.serviceNo || query.serviceno || '').toString().trim();

  if (!busStopCode) {
    return res.status(400).json({
      error: 'Missing BusStopCode parameter',
      usage: 'GET /api/busarrival?BusStopCode=83139',
    });
  }

  // Retrieve AccountKey from environment variables or request headers (no hardcoded keys)
  const headers = req.headers || {};
  const accountKey = (
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    headers['accountkey'] ||
    headers['account-key'] ||
    headers['AccountKey'] ||
    ''
  ).toString().trim();

  if (!accountKey) {
    return res.status(401).json({
      error: 'LTA_ACCOUNT_KEY is not configured',
      message:
        'Please set the LTA_ACCOUNT_KEY environment variable in your .env file or pass it via the AccountKey request header.',
      BusStopCode: busStopCode,
    });
  }

  try {
    const ltaUrl = new URL(LTA_DATAMALL_URL);
    ltaUrl.searchParams.set('BusStopCode', busStopCode);
    if (serviceNo) {
      ltaUrl.searchParams.set('ServiceNo', serviceNo);
    }

    const response = await fetch(ltaUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `LTA DataMall responded with HTTP ${response.status}`,
        details: errText,
        BusStopCode: busStopCode,
      });
    }

    const data = await response.json();

    // Cache header: cache for 10 seconds to avoid exceeding LTA rate limits while keeping data real-time
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=5');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('LTA Datamall proxy error:', err);
    return res.status(502).json({
      error: 'Failed to communicate with LTA DataMall',
      message: err?.message || 'Unknown network error',
      BusStopCode: busStopCode,
    });
  }
}
