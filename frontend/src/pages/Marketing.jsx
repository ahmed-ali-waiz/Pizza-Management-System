import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Mail, Bell, Gift, TrendingUp } from 'lucide-react';
import { getCampaigns, createCampaign, getLoyaltyPrograms, getNotifications, createNotification, updateLoyaltyProgram } from '../store/slices/marketingSlice';
import { getBranches } from '../store/slices/branchSlice';
import { getMenuItems } from '../store/slices/menuSlice';
import { getUsers } from '../store/slices/userSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Marketing = () => {
  const dispatch = useDispatch();
  const { campaigns, loyaltyPrograms, notifications, isLoading } = useSelector((state) => state.marketing);
  const { branches } = useSelector((state) => state.branches || {});
  const { menuItems } = useSelector((state) => state.menu || {});
  const { users } = useSelector((state) => state.users || {});
  const { user } = useSelector((state) => state.auth || {});
  const [activeTab, setActiveTab] = useState('campaigns');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('campaign'); // 'campaign', 'notification', 'loyalty'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaignType: 'email',
    startDate: '',
    endDate: '',
    targetAudience: 'all',
    budget: 0,
    status: 'draft',
    branches: [],
    featuredItems: [],
    content: {
      subject: '',
      title: '',
      message: '',
      imageUrl: '',
      linkUrl: '',
    },
    // Notification specific
    title: '',
    type: 'promotion',
    channel: 'push',
    userId: '',
    // Loyalty specific
    points: 0,
    adjustmentType: 'bonus',
  });

  useEffect(() => {
    dispatch(getCampaigns());
    dispatch(getLoyaltyPrograms());
    dispatch(getNotifications());
    dispatch(getBranches());
    dispatch(getMenuItems());
    dispatch(getUsers());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'campaign') {
        const campaignData = {
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          createdBy: user?.id || user?._id,
        };
        await dispatch(createCampaign(campaignData)).unwrap();
        toast.success('Campaign created successfully');
        dispatch(getCampaigns());
      } else if (modalType === 'notification') {
        const notificationData = {
          title: formData.title,
          message: formData.content.message,
          type: formData.type,
          channel: formData.channel,
          userId: formData.userId || null,
        };
        await dispatch(createNotification(notificationData)).unwrap();
        toast.success('Notification sent successfully');
        dispatch(getNotifications());
      } else if (modalType === 'loyalty') {
        const loyaltyData = {
          points: formData.points,
          adjustmentType: formData.adjustmentType,
        };
        await dispatch(updateLoyaltyProgram({ userId: formData.userId, data: loyaltyData })).unwrap();
        toast.success('Loyalty points adjusted');
        dispatch(getLoyaltyPrograms());
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error?.message || 'Action failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      campaignType: 'email',
      startDate: '',
      endDate: '',
      targetAudience: 'all',
      budget: 0,
      status: 'draft',
      branches: [],
      featuredItems: [],
      content: {
        subject: '',
        title: '',
        message: '',
        imageUrl: '',
        linkUrl: '',
      },
      title: '',
      type: 'promotion',
      channel: 'push',
      userId: '',
      points: 0,
      adjustmentType: 'bonus',
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const campaignColumns = [
    { header: 'Campaign Name', cell: (item) => item.name || 'N/A' },
    { header: 'Type', cell: (item) => item.campaignType || 'N/A' },
    {
      header: 'Status',
      cell: (item) => {
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
          cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.draft}`}>
            {item.status || 'N/A'}
          </span>
        );
      }
    },
    {
      header: 'Start Date',
      cell: (item) => item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'
    },
    {
      header: 'End Date',
      cell: (item) => item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'
    },
    {
      header: 'Performance',
      cell: (item) => (
        <div className="text-sm text-gray-900 dark:text-white">
          <div>Clicks: {item.metrics?.clicks || 0}</div>
          <div>Conversions: {item.metrics?.conversions || 0}</div>
        </div>
      )
    },
  ];

  const loyaltyColumns = [
    { header: 'User', cell: (item) => item.userId?.name || item.userId?.email || 'N/A' },
    { header: 'Points', cell: (item) => item.points || 0 },
    {
      header: 'Tier',
      cell: (item) => {
        const tierColors = {
          bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
          silver: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          platinum: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full capitalize ${tierColors[item.tier] || tierColors.bronze}`}>
            {item.tier || 'bronze'}
          </span>
        );
      }
    },
    { header: 'Total Earned', cell: (item) => item.totalPointsEarned || 0 },
    { header: 'Total Redeemed', cell: (item) => item.totalPointsRedeemed || 0 },
  ];

  const notificationColumns = [
    { header: 'Title', cell: (item) => item.title || 'N/A' },
    { header: 'Type', cell: (item) => item.type || 'N/A' },
    { header: 'Channel', cell: (item) => item.channel || 'N/A' },
    {
      header: 'Status',
      cell: (item) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          read: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
          failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.pending}`}>
            {item.status || 'N/A'}
          </span>
        );
      }
    },
    {
      header: 'Sent At',
      cell: (item) => item.sentAt ? new Date(item.sentAt).toLocaleString() : 'Not sent'
    },
    {
      header: 'Read At',
      cell: (item) => item.readAt ? new Date(item.readAt).toLocaleString() : 'Not read'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing & Promotions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage campaigns, loyalty programs, and notifications</p>
        </div>
        <button
          onClick={() => {
            setModalType(activeTab === 'campaigns' ? 'campaign' : activeTab === 'loyalty' ? 'loyalty' : 'notification');
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-5 h-5" />
          <span>
            {activeTab === 'campaigns' ? 'New Campaign' : activeTab === 'loyalty' ? 'Adjust Points' : 'Send Notification'}
          </span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {campaigns.filter(c => c.status === 'active').length}
              </p>
            </div>
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Loyalty Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{loyaltyPrograms.length}</p>
            </div>
            <Gift className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Notifications Sent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Conversions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('loyalty')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'loyalty'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Loyalty Programs
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notifications'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Notifications
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeTab === 'campaigns' && <DataTable data={campaigns} columns={campaignColumns} />}
              {activeTab === 'loyalty' && <DataTable data={loyaltyPrograms} columns={loyaltyColumns} />}
              {activeTab === 'notifications' && <DataTable data={notifications} columns={notificationColumns} />}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalType === 'campaign' ? 'Create Campaign' : modalType === 'loyalty' ? 'Adjust Loyalty Points' : 'Send Notification'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          {modalType === 'campaign' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Type *</label>
                  <select
                    value={formData.campaignType}
                    onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                    <option value="banner">Banner</option>
                    <option value="social">Social Media</option>
                    <option value="in_app">In-App</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Customers</option>
                    <option value="new_customers">New Customers</option>
                    <option value="regular_customers">Regular Customers</option>
                    <option value="vip_customers">VIP Customers</option>
                    <option value="churned_customers">Churned Customers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget (Rs)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branches</label>
                <select
                  multiple
                  value={formData.branches}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, branches: selected });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  size="3"
                >
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple branches</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Featured Menu Items</label>
                <select
                  multiple
                  value={formData.featuredItems}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, featuredItems: selected });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  size="3"
                >
                  {menuItems.map(item => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple items</p>
              </div>

            </>
          )}

          {modalType === 'notification' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message *</label>
                <textarea
                  value={formData.content.message}
                  onChange={(e) => setFormData({ ...formData, content: { ...formData.content, message: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="4"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="promotion">Promotion</option>
                    <option value="system">System</option>
                    <option value="reminder">Reminder</option>
                    <option value="order_update">Order Update</option>
                    <option value="payment">Payment</option>
                    <option value="delivery">Delivery</option>
                    <option value="review_request">Review Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="push">Push Notification</option>
                    <option value="in_app">In-App</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target User *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {modalType === 'loyalty' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target User *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Points</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustment Type</label>
                  <select
                    value={formData.adjustmentType}
                    onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="bonus">Bonus</option>
                    <option value="adjustment">Manual Adjustment</option>
                    <option value="earned">Add Earned</option>
                    <option value="redeemed">Subtract Redeemed</option>
                  </select>
                </div>
              </div>
            </>
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {modalType === 'campaign' ? 'Create Campaign' : modalType === 'loyalty' ? 'Adjust Points' : 'Send Notification'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Marketing;


