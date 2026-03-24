import { Handler, HandlerEvent } from '@netlify/functions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
  }

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  // Log env status (never log actual values)
  console.log('Env check — key_id present:', !!key_id, '| key_secret present:', !!key_secret);

  if (!key_id || !key_secret) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Payment service not configured.',
        debug: `key_id: ${!!key_id}, key_secret: ${!!key_secret}` 
      }),
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(event.body || '{}');
    console.log('Request body parsed — amount:', parsed.amount);
  } catch (e) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const { amount, currency = 'INR', receipt } = parsed;

  if (!amount || amount <= 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid amount: ' + amount }),
    };
  }

  try {
    const credentials = Buffer.from(`${key_id}:${key_secret}`).toString('base64');
    const amountInPaise = Math.round(Number(amount) * 100);

    console.log('Calling Razorpay API — amount in paise:', amountInPaise, '| currency:', currency);

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      }),
    });

    const responseText = await razorpayRes.text();
    console.log('Razorpay response status:', razorpayRes.status, '| body:', responseText);

    let order: any;
    try {
      order = JSON.parse(responseText);
    } catch {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Razorpay returned invalid JSON: ' + responseText }),
      };
    }

    if (!razorpayRes.ok) {
      return {
        statusCode: razorpayRes.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: order?.error?.description || 'Razorpay order creation failed',
          razorpay_error: order?.error || order,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error?.message || 'Unexpected server error' }),
    };
  }
};
