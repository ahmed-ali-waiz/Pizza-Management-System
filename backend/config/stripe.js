import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key', {
  apiVersion: '2023-10-16',
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd', // Default currency
  paymentMethods: ['card'], // Supported payment methods
  statementDescriptor: 'PIZZA MANAGEMENT', // Shows on customer's card statement
  
  // Webhook event types we care about
  webhookEvents: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
    'charge.refunded',
    'charge.dispute.created',
  ],
};

/**
 * Create a Stripe Payment Intent
 * @param {number} amount - Amount in smallest currency unit (cents for USD)
 * @param {string} currency - Currency code (default: usd)
 * @param {object} metadata - Additional metadata to attach
 * @returns {Promise<object>} Stripe PaymentIntent object
 */
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: STRIPE_CONFIG.paymentMethods,
      metadata,
      statement_descriptor: STRIPE_CONFIG.statementDescriptor,
    });
    
    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Stripe createPaymentIntent error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Confirm a Payment Intent
 * @param {string} paymentIntentId - The payment intent ID
 * @param {string} paymentMethodId - The payment method ID
 * @returns {Promise<object>} Confirmed PaymentIntent
 */
export const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
    
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    console.error('Stripe confirmPaymentIntent error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Retrieve a Payment Intent
 * @param {string} paymentIntentId - The payment intent ID
 * @returns {Promise<object>} PaymentIntent object
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    console.error('Stripe retrievePaymentIntent error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Cancel a Payment Intent
 * @param {string} paymentIntentId - The payment intent ID
 * @returns {Promise<object>} Cancelled PaymentIntent
 */
export const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    console.error('Stripe cancelPaymentIntent error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create a Refund
 * @param {string} paymentIntentId - The payment intent ID to refund
 * @param {number} amount - Amount to refund (optional, defaults to full refund)
 * @param {string} reason - Reason for refund
 * @returns {Promise<object>} Refund object
 */
export const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
      reason,
    };
    
    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }
    
    const refund = await stripe.refunds.create(refundData);
    
    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error('Stripe createRefund error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Construct webhook event from payload and signature
 * @param {Buffer} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @param {string} webhookSecret - Webhook endpoint secret
 * @returns {object} Stripe Event object
 */
export const constructWebhookEvent = (payload, signature, webhookSecret) => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return {
      success: true,
      event,
    };
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create a Stripe Customer
 * @param {object} customerData - Customer details
 * @returns {Promise<object>} Stripe Customer object
 */
export const createCustomer = async (customerData) => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      metadata: {
        userId: customerData.userId,
      },
    });
    
    return {
      success: true,
      customer,
    };
  } catch (error) {
    console.error('Stripe createCustomer error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Retrieve a Stripe Customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<object>} Stripe Customer object
 */
export const retrieveCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return {
      success: true,
      customer,
    };
  } catch (error) {
    console.error('Stripe retrieveCustomer error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * List customer's payment methods
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<object>} List of payment methods
 */
export const listPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    
    return {
      success: true,
      paymentMethods: paymentMethods.data,
    };
  } catch (error) {
    console.error('Stripe listPaymentMethods error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Attach a payment method to a customer
 * @param {string} paymentMethodId - Payment method ID
 * @param {string} customerId - Customer ID
 * @returns {Promise<object>} Attached payment method
 */
export const attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    return {
      success: true,
      paymentMethod,
    };
  } catch (error) {
    console.error('Stripe attachPaymentMethod error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Detach a payment method from a customer
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<object>} Detached payment method
 */
export const detachPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    
    return {
      success: true,
      paymentMethod,
    };
  } catch (error) {
    console.error('Stripe detachPaymentMethod error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export stripe instance for advanced usage
export default stripe;
