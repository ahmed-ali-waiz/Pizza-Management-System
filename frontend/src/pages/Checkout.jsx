import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  processCashPayment, 
  createPaymentIntent,
  clearCheckout,
  setPaymentSuccess 
} from '../store/slices/paymentsSlice';
import { updatePaymentStatus } from '../store/slices/paymentsSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  CreditCard, 
  Banknote, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Receipt,
  Truck,
  MapPin,
  Phone,
  User,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  
  // Get order data from navigation state
  const orderData = location.state?.order;
  
  const { checkoutLoading, checkoutError, paymentSuccess, clientSecret } = useSelector(
    (state) => state.payments
  );
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Clear checkout state on mount
    dispatch(clearCheckout());
    
    // If no order data, redirect back
    if (!orderData && !orderId) {
      toast.error('No order found');
      navigate('/orders');
    }
  }, [dispatch, orderData, orderId, navigate]);

  useEffect(() => {
    if (paymentSuccess) {
      toast.success('Payment completed successfully!');
      // Redirect to orders after 2 seconds
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    }
  }, [paymentSuccess, navigate]);

  const order = orderData;
  const totalAmount = order?.total || order?.totalAmount || 0;

  const handleCashPayment = async () => {
    const received = parseFloat(amountReceived) || totalAmount;
    
    if (received < totalAmount) {
      toast.error(`Amount received (Rs ${received}) is less than total (Rs ${totalAmount})`);
      return;
    }

    setProcessing(true);
    try {
      await dispatch(processCashPayment({
        orderId: order._id,
        amountReceived: received,
      })).unwrap();
      
      dispatch(setPaymentSuccess(true));
    } catch (error) {
      toast.error(error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setProcessing(true);
    try {
      // Create payment intent
      const result = await dispatch(createPaymentIntent({
        orderId: order._id,
        amount: totalAmount,
      })).unwrap();
      
      // For demo purposes, mark as completed immediately
      // In production, you would use Stripe Elements here
      if (result.paymentId) {
        await dispatch(updatePaymentStatus({
          id: result.paymentId,
          status: 'completed',
          transactionId: `TXN-${Date.now()}`,
        })).unwrap();
        
        dispatch(setPaymentSuccess(true));
      }
    } catch (error) {
      toast.error(error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitPayment = () => {
    if (paymentMethod === 'Cash' || paymentMethod === 'COD') {
      handleCashPayment();
    } else {
      handleCardPayment();
    }
  };

  const changeAmount = amountReceived ? parseFloat(amountReceived) - totalAmount : 0;

  if (!order) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Order #{order.orderId || order._id?.slice(-6)} has been paid
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-3xl font-bold text-green-600">
              Rs {totalAmount.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete payment for Order #{order.orderId || order._id?.slice(-6)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.customerInfo?.name || 'Guest'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.customerInfo?.phone || 'N/A'}
                  </p>
                </div>
              </div>
              {order.orderType === 'Delivery' && (
                <div className="col-span-2 flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.customerInfo?.address || order.deliveryAddress?.addressLine1 || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-3">
              {(order.cartItems || order.items || []).map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-bold">{item.quantity}x</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      {item.size && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.size}</p>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Rs {((item.price || item.totalPrice) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'Cash', label: 'Cash', icon: Banknote, color: 'emerald' },
                { id: 'Card', label: 'Card', icon: CreditCard, color: 'blue' },
                { id: 'COD', label: 'COD', icon: Truck, color: 'amber' },
                { id: 'Stripe', label: 'Stripe', icon: CreditCard, color: 'indigo' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === method.id
                      ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-900/20`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <method.icon className={`w-6 h-6 mx-auto mb-2 ${
                    paymentMethod === method.id 
                      ? `text-${method.color}-600` 
                      : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    paymentMethod === method.id 
                      ? `text-${method.color}-600` 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {method.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Cash/COD Amount Input */}
            {(paymentMethod === 'Cash' || paymentMethod === 'COD') && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount Received
                </label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder={totalAmount.toString()}
                  className="w-full px-4 py-3 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {changeAmount > 0 && (
                  <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Change to return: <span className="font-bold">Rs {changeAmount.toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Payment Summary
            </h2>

            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>Rs {(order.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax (15%)</span>
                <span>Rs {(order.tax || 0).toLocaleString()}</span>
              </div>
              {order.orderType === 'Delivery' && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span>Rs {(order.deliveryFee || order.deliveryCharges || 100).toLocaleString()}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-Rs {order.discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary-600">
                  Rs {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className={`w-3 h-3 rounded-full ${
                  paymentMethod === 'Cash' || paymentMethod === 'COD' 
                    ? 'bg-emerald-500' 
                    : 'bg-blue-500'
                }`} />
                <span>Paying via {paymentMethod}</span>
              </div>

              <button
                onClick={handleSubmitPayment}
                disabled={processing || checkoutLoading}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                  processing || checkoutLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'
                }`}
              >
                {processing || checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="small" />
                    Processing...
                  </span>
                ) : (
                  `Pay Rs ${totalAmount.toLocaleString()}`
                )}
              </button>

              <button
                onClick={() => navigate('/orders')}
                className="w-full py-3 rounded-xl font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>

            {checkoutError && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">{checkoutError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
