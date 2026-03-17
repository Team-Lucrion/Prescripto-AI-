import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      creditsToAdd
    } = JSON.parse(event.body);

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Update Supabase credits using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current credits
    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    const currentCredits = currentData?.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({ 
        user_id: userId, 
        credits: newCredits,
        updated_at: new Date().toISOString()
      });

    if (updateError) throw updateError;

    // Log payment
    await supabase.from('payments').insert({
      user_id: userId,
      razorpay_order_id,
      razorpay_payment_id,
      amount: creditsToAdd * 2, // 1 credit = 2 INR
      credits_added: creditsToAdd,
      status: 'success'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, newCredits }),
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to verify payment' }),
    };
  }
};
