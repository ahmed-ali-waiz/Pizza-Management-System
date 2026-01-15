import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPayments, getPaymentStats, updatePaymentStatus, processRefund } from '../store/slices/paymentsSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Payments = () => {
  const dispatch = useDispatch();
  const { payments, stats, isLoading } = useSelector((state) => state.payments);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    dispatch(getPayments({}));
    dispatch(getPaymentStats({}));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getPayments({}));
    dispatch(getPaymentStats({}));
    toast.success('Data refreshed');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'refunded':
      case 'partially_refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'Stripe':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'Cash':
      case 'COD':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'Card':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Stats
  const totalRevenue = stats?.totals?.completedAmount || stats?.overview?.totalRevenue || 0;
  const totalPayments = stats?.totals?.totalPayments || 0;
  const completedPayments = stats?.byStatus?.find(s => s._id === 'completed')?.count || stats?.overview?.completedPayments || 0;
  const pendingPayments = stats?.byStatus?.find(s => s._id === 'pending')?.count || stats?.overview?.pendingPayments || 0;

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await dispatch(updatePaymentStatus({ id: paymentId, status: newStatus })).unwrap();
      toast.success('Payment status updated');
      dispatch(getPayments({}));
      dispatch(getPaymentStats({}));
    } catch (error) {
      toast.error(error || 'Failed to update status');
    }
  };

  const handleRefund = async (paymentId, amount) => {
    if (!window.confirm(`Refund Rs ${amount?.toLocaleString()}?`)) return;
    try {
      await dispatch(processRefund({ id: paymentId, amount })).unwrap();
      toast.success('Refund processed');
      dispatch(getPayments({}));
      dispatch(getPaymentStats({}));
    } catch (error) {
      toast.error(error || 'Refund failed');
    }
  };

  // Filter payments by status
  const filteredPayments = selectedStatus === 'all' 
    ? (Array.isArray(payments) ? payments : [])
    : (Array.isArray(payments) ? payments : []).filter(p => p.paymentStatus === selectedStatus);

  const columns = [
    {
      header: 'Order',
      cell: (row) => (
        <div>
          <span className="font-medium text-gray-900 dark:text-white">
            {row.order?.orderId || row.order?.orderNumber || 'N/A'}
          </span>
          {row.user?.name && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.user.name}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (row) => (
        <span className="font-bold text-gray-900 dark:text-white">
          Rs {row.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Method',
      cell: (row) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getMethodColor(row.paymentMethod)}`}>
          {row.paymentMethod}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.paymentStatus)}
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(row.paymentStatus)}`}>
            {row.paymentStatus}
          </span>
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (row) => (
        <div className="text-sm">
          <p className="text-gray-900 dark:text-white">{format(new Date(row.createdAt), 'MMM dd, yyyy')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(row.createdAt), 'HH:mm')}</p>
        </div>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.paymentStatus === 'pending' && (
            <>
              <button
                onClick={() => handleStatusUpdate(row._id, 'completed')}
                className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Complete
              </button>
              <button
                onClick={() => handleStatusUpdate(row._id, 'failed')}
                className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Fail
              </button>
            </>
          )}
          {row.paymentStatus === 'completed' && (
            <button
              onClick={() => handleRefund(row._id, row.amount)}
              className="px-3 py-1.5 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Refund
            </button>
          )}
          {(row.paymentStatus === 'refunded' || row.paymentStatus === 'failed') && (
            <span className="text-xs text-gray-400">No actions</span>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all payment transactions</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">Rs {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Transactions</p>
              <p className="text-2xl font-bold mt-1">{totalPayments}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold mt-1">{completedPayments}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold mt-1">{pendingPayments}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1 inline-flex gap-1">
        {['all', 'pending', 'completed', 'failed', 'refunded'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              selectedStatus === status
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <DataTable columns={columns} data={filteredPayments} />
      </div>
    </div>
  );
};

export default Payments;





















