import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DollarSign, TrendingUp, TrendingDown, Receipt, Plus, CheckCircle, XCircle } from 'lucide-react';
import { getExpenses, createExpense, approveExpense, rejectExpense, getRefunds, processRefund, completeRefund } from '../store/slices/financialSlice';
import { getBranches } from '../store/slices/branchSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Financial = () => {
  const dispatch = useDispatch();
  const { expenses, refunds, isLoading } = useSelector((state) => state.financial);
  const { branches } = useSelector((state) => state.branches || {});
  const [activeTab, setActiveTab] = useState('expenses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    dispatch(getExpenses());
    dispatch(getRefunds());
    dispatch(getBranches());
  }, [dispatch]);

  const handleOpenModal = (type, item = null) => {
    setActionType(type);
    setSelectedItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setFormData({});
    setActionType('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (actionType === 'create') {
        await dispatch(createExpense(formData)).unwrap();
        toast.success('Expense created successfully');
        dispatch(getExpenses());
      } else if (actionType === 'approve') {
        await dispatch(approveExpense({ id: selectedItem._id })).unwrap();
        toast.success('Expense approved');
        dispatch(getExpenses());
      } else if (actionType === 'reject') {
        await dispatch(rejectExpense({ id: selectedItem._id, data: { rejectionReason: formData.rejectionReason } })).unwrap();
        toast.success('Expense rejected');
        dispatch(getExpenses());
      } else if (actionType === 'process') {
        await dispatch(processRefund({ id: selectedItem._id })).unwrap();
        toast.success('Refund processing started');
        dispatch(getRefunds());
      } else if (actionType === 'complete') {
        await dispatch(completeRefund({ id: selectedItem._id })).unwrap();
        toast.success('Refund completed');
        dispatch(getRefunds());
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error || 'Operation failed');
    }
  };

  const expenseColumns = [
    { header: 'Category', cell: (item) => item.category || 'N/A' },
    { header: 'Description', cell: (item) => item.description || 'N/A' },
    { header: 'Amount', cell: (item) => `Rs ${(item.amount || 0).toLocaleString()}` },
    { header: 'Branch', cell: (item) => item.branchId?.branchName || 'N/A' },
    { header: 'Date', cell: (item) => item.expenseDate ? new Date(item.expenseDate).toLocaleDateString() : 'N/A' },
    { 
      header: 'Status', 
      cell: (item) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.pending}`}>
            {item.status || 'pending'}
          </span>
        );
      }
    },
    { header: 'Approved By', cell: (item) => item.approvedBy?.name || 'Pending' },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-2">
          {item.status === 'pending' && (
            <>
              <button 
                onClick={() => handleOpenModal('approve', item)} 
                className="text-green-600 hover:text-green-800 dark:text-green-400"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleOpenModal('reject', item)} 
                className="text-red-600 hover:text-red-800 dark:text-red-400"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const refundColumns = [
    { header: 'Order ID', cell: (item) => item.orderId?.orderNumber || item.orderId || 'N/A' },
    { header: 'Amount', cell: (item) => `Rs ${(item.refundAmount || 0).toLocaleString()}` },
    { header: 'Reason', cell: (item) => item.refundReason || 'N/A' },
    { 
      header: 'Status', 
      cell: (item) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.pending}`}>
            {item.status || 'pending'}
          </span>
        );
      }
    },
    { header: 'Processed At', cell: (item) => item.processedAt ? new Date(item.processedAt).toLocaleString() : 'Not processed' },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-2">
          {item.status === 'pending' && (
            <button 
              onClick={() => handleOpenModal('process', item)} 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
              title="Process"
            >
              <Receipt className="w-4 h-4" />
            </button>
          )}
          {item.status === 'processing' && (
            <button 
              onClick={() => handleOpenModal('complete', item)} 
              className="text-green-600 hover:text-green-800 dark:text-green-400"
              title="Complete"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRefunds = refunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
  const pendingRefunds = refunds.filter(r => r.status === 'pending' || r.status === 'processing').length;

  const renderModalContent = () => {
    if (actionType === 'create') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Category</option>
                <option value="ingredients">Ingredients</option>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="equipment">Equipment</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
              <select
                value={formData.branchId || ''}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="3"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (Rs) *</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expense Date *</label>
              <input
                type="date"
                value={formData.expenseDate ? new Date(formData.expenseDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
        </div>
      );
    } else if (actionType === 'reject') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rejection Reason *</label>
          <textarea
            value={formData.rejectionReason || ''}
            onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows="3"
            required
            placeholder="Enter rejection reason..."
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track expenses and manage refunds</p>
        </div>
        {activeTab === 'expenses' && (
          <button
            onClick={() => handleOpenModal('create')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expense</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                Rs {totalExpenses.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Approvals</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{pendingExpenses}</p>
            </div>
            <Receipt className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                Rs {totalRefunds.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Refunds</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{pendingRefunds}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {['expenses', 'refunds'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeTab === 'expenses' && <DataTable data={expenses} columns={expenseColumns} />}
              {activeTab === 'refunds' && <DataTable data={refunds} columns={refundColumns} />}
            </>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={
          actionType === 'create' ? 'Add Expense' :
          actionType === 'approve' ? 'Approve Expense' :
          actionType === 'reject' ? 'Reject Expense' :
          actionType === 'process' ? 'Process Refund' :
          actionType === 'complete' ? 'Complete Refund' : 'Action'
        }
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {actionType === 'create' || actionType === 'reject' ? renderModalContent() : (
            <p className="text-gray-700 dark:text-gray-300">
              {actionType === 'approve' && 'Are you sure you want to approve this expense?'}
              {actionType === 'process' && 'Are you sure you want to start processing this refund?'}
              {actionType === 'complete' && 'Are you sure you want to mark this refund as completed?'}
            </p>
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white ${
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {actionType === 'create' ? 'Create' :
               actionType === 'approve' ? 'Approve' :
               actionType === 'reject' ? 'Reject' :
               actionType === 'process' ? 'Process' :
               actionType === 'complete' ? 'Complete' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Financial;
