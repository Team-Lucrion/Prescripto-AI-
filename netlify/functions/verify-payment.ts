import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
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

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    console.error('RAZORPAY_KEY_SECRET missing');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Payment service not configured.' }),
    };
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      creditsToAdd,
    } = JSON.parse(event.body || '{}');

    // 1. Verify Razorpay signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('Signature mismatch');
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid payment signature' }),
      };
    }

    // 2. Update credits in Supabase
    if (supabaseUrl && serviceRoleKey && userId && creditsToAdd) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Get current credits
      const { data: currentData, error: fetchError } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Supabase fetch error:', fetchError);
        throw new Error(fetchError.message);
      }

      const newCredits = (currentData?.credits || 0) + creditsToAdd;

      const { error: updateError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          credits: newCredits,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Supabase upsert error:', updateError);
        throw new Error(updateError.message);
      }

      // Log payment record
      await supabase.from('payments').insert({
        user_id: userId,
        razorpay_order_id,
        razorpay_payment_id,
        credits_added: creditsToAdd,
        status: 'success',
      });
    } else {
      console.warn('Skipping Supabase update — missing env vars or params:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey,
        userId,
        creditsToAdd,
      });
    }import { createClerkSupabaseClient } from '../lib/supabase';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const waitForRazorpay = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if ((window as any).Razorpay) {
        clearInterval(interval);
        resolve();
      } else if (attempts > 20) {
        clearInterval(interval);
        reject(new Error('Razorpay SDK failed to load. Please disable any ad-blockers and try again.'));
      }
    }, 250);
  });
};

export const processPayment = async (
  userId: string,
  pack: { id: string; price: number; credits: number; name: string },
  userEmail: string,
  userName: string,
  token: string | null
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const startPayment = async () => {
      try {
        await waitForRazorpay();

        // 1. Create order via Netlify function
        const orderResponse = await fetch('/.netlify/functions/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: pack.price,
            currency: 'INR',
            receipt: `receipt_${userId}_${Date.now()}`,
          }),
        });

        // Read body ONCE as text, then parse
        const orderText = await orderResponse.text();
        console.log('create-order response:', orderResponse.status, orderText);

        let order: any;
        try {
          order = JSON.parse(orderText);
        } catch {
          throw new Error(`Server returned invalid response: ${orderText}`);
        }

        if (!orderResponse.ok) {
          // Show the actual server error to the user
          throw new Error(order?.error || order?.razorpay_error?.description || `Order creation failed (${orderResponse.status})`);
        }

        // 2. Open Razorpay checkout
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Prescription AI',
          description: `${pack.name} — ${pack.credits} Credits`,
          order_id: order.id,
          prefill: { name: userName, email: userEmail },
          theme: { color: '#00a3e0' },
          notes: { mode: 'beta_test', pack_id: pack.id, user_id: userId },
          handler: async (response: RazorpayResponse) => {
            try {
              const verifyResponse = await fetch('/.netlify/functions/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId,
                  creditsToAdd: pack.credits,
                }),
              });

              const verifyText = await verifyResponse.text();
              console.log('verify-payment response:', verifyResponse.status, verifyText);

              let verification: any;
              try { verification = JSON.parse(verifyText); } catch { throw new Error('Invalid verify response'); }

              if (!verifyResponse.ok) {
                throw new Error(verification?.error || 'Payment verification failed');
              }

              resolve(verification.success === true);
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => resolve(false),
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (r: any) => {
          reject(new Error(`Payment failed: ${r.error?.description || 'Unknown error'}`));
        });
        rzp.open();

      } catch (error) {
        reject(error);
      }
    };

    startPayment();
  });
};

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Payment verification failed. Please contact support.' }),
    };
  }
};
