import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star, AlertCircle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { getReviews, getComplaints, updateReviewStatus, resolveComplaint, assignComplaint } from '../store/slices/qualitySlice';
import { getUsers } from '../store/slices/userSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Quality = () => {
  const dispatch = useDispatch();
  const { reviews, complaints, isLoading } = useSelector((state) => state.quality);
  const { users } = useSelector((state) => state.users || {});
  const [activeTab, setActiveTab] = useState('reviews');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    dispatch(getReviews());
    dispatch(getComplaints());
    dispatch(getUsers());
  }, [dispatch]);

  const handleApproveReview = async (id) => {
    try {
      await dispatch(updateReviewStatus({ id, status: 'approved' })).unwrap();
      toast.success('Review approved');
      dispatch(getReviews());
    } catch (error) {
      toast.error(error || 'Failed to approve review');
    }
  };

  const handleRejectReview = async (id) => {
    try {
      await dispatch(updateReviewStatus({ id, status: 'rejected' })).unwrap();
      toast.success('Review rejected');
      dispatch(getReviews());
    } catch (error) {
      toast.error(error || 'Failed to reject review');
    }
  };

  const handleResolveComplaint = async (id) => {
    setSelectedItem({ _id: id });
    setActionType('resolve');
    setIsModalOpen(true);
  };

  const handleAssignComplaint = async (id) => {
    setSelectedItem({ _id: id });
    setActionType('assign');
    setIsModalOpen(true);
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    try {
      if (actionType === 'resolve') {
        await dispatch(resolveComplaint({ id: selectedItem._id, data: formData })).unwrap();
        toast.success('Complaint resolved');
        dispatch(getComplaints());
      } else if (actionType === 'assign') {
        await dispatch(assignComplaint({ id: selectedItem._id, data: { assignedTo: formData.assignedTo } })).unwrap();
        toast.success('Complaint assigned');
        dispatch(getComplaints());
      }
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
    } catch (error) {
      toast.error(error || 'Operation failed');
    }
  };

  const reviewColumns = [
    { header: 'Customer', cell: (item) => item.userId?.name || item.userId?.email || 'N/A' },
    { 
      header: 'Rating', 
      cell: (item) => (
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="ml-1 text-gray-900 dark:text-white">{item.rating || 0}/5</span>
        </div>
      )
    },
    { header: 'Title', cell: (item) => item.title || 'N/A' },
    { header: 'Comment', cell: (item) => item.comment ? (item.comment.length > 50 ? item.comment.substring(0, 50) + '...' : item.comment) : 'N/A' },
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
    { header: 'Date', cell: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A' },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-2">
          {item.status !== 'approved' && (
            <button 
              onClick={() => handleApproveReview(item._id)} 
              className="text-green-600 hover:text-green-800 dark:text-green-400"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {item.status !== 'rejected' && (
            <button 
              onClick={() => handleRejectReview(item._id)} 
              className="text-red-600 hover:text-red-800 dark:text-red-400"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const complaintColumns = [
    { header: 'Customer', cell: (item) => item.userId?.name || item.userId?.email || 'N/A' },
    { header: 'Type', cell: (item) => item.complaintType || 'N/A' },
    { 
      header: 'Priority', 
      cell: (item) => {
        const priorityColors = {
          low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
          urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full capitalize ${priorityColors[item.priority] || priorityColors.medium}`}>
            {item.priority || 'medium'}
          </span>
        );
      }
    },
    { 
      header: 'Status', 
      cell: (item) => {
        const statusColors = {
          open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.open}`}>
            {item.status || 'open'}
          </span>
        );
      }
    },
    { header: 'Assigned To', cell: (item) => item.assignedTo?.name || 'Unassigned' },
    { header: 'Date', cell: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A' },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-2">
          {item.status !== 'resolved' && item.status !== 'closed' && (
            <>
              {!item.assignedTo && (
                <button 
                  onClick={() => handleAssignComplaint(item._id)} 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  title="Assign"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => handleResolveComplaint(item._id)} 
                className="text-green-600 hover:text-green-800 dark:text-green-400"
                title="Resolve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quality & Reviews</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage customer reviews and complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reviews.length}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Open Complaints</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {complaints.filter(c => c.status === 'open' || c.status === 'in_progress').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {['reviews', 'complaints'].map((tab) => (
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
              {activeTab === 'reviews' && <DataTable data={reviews} columns={reviewColumns} />}
              {activeTab === 'complaints' && <DataTable data={complaints} columns={complaintColumns} />}
            </>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); setFormData({}); }}
        title={actionType === 'resolve' ? 'Resolve Complaint' : 'Assign Complaint'}
        size="medium"
      >
        <form onSubmit={handleSubmitAction} className="space-y-4">
          {actionType === 'resolve' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution *</label>
                <textarea
                  value={formData.resolution || ''}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="3"
                  required
                  placeholder="Enter resolution details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution Notes</label>
                <textarea
                  value={formData.resolutionNotes || ''}
                  onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To *</label>
              <select
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setSelectedItem(null); setFormData({}); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {actionType === 'resolve' ? 'Resolve' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Quality;
