import type { Request, Response } from 'express';

/**
 * Serverless health check endpoint.
 * Works both as a standalone serverless function (Vercel/Netlify/Cloud Functions)
 * and mounted within an Express server.
 */
export default async function handler(req: Request | any, res: Response | any) {
  const hasKey = Boolean(process.env.LTA_ACCOUNT_KEY || process.env.ACCOUNT_KEY);

  res.status(200).json({
    status: 'ok',
    service: 'SG Bus Arrival Serverless API',
    timestamp: new Date().toISOString(),
    ltaKeyConfigured: hasKey,
    endpoints: {
      busArrival: '/api/busarrival?BusStopCode=<5_DIGIT_CODE>',
      health: '/api/health',
    },
  });
}
