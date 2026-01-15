import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, CheckCircle, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { getShifts, createShift, updateShift, deleteShift, getTasks, createTask, updateTask, deleteTask, getAttendance, createAttendance, updateAttendance } from '../store/slices/operationsSlice';
import { getBranches } from '../store/slices/branchSlice';
import { getUsers } from '../store/slices/userSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Operations = () => {
  const dispatch = useDispatch();
  const { shifts, tasks, attendance, isLoading } = useSelector((state) => state.operations);
  const { branches } = useSelector((state) => state.branches || {});
  const { users } = useSelector((state) => state.users || {});
  const [activeTab, setActiveTab] = useState('shifts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    dispatch(getShifts());
    dispatch(getTasks());
    dispatch(getAttendance());
    dispatch(getBranches());
    dispatch(getUsers());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
  };

  const handleOpenModal = (type, item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      if (type === 'shifts') {
        setFormData({
          status: 'scheduled',
          userId: '',
          branchId: '',
          shiftDate: new Date().toISOString().split('T')[0],
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
        });
      } else if (type === 'tasks') {
        setFormData({
          priority: 'medium',
          status: 'pending',
          category: 'other',
          assignedTo: '',
          branchId: '',
          dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
        });
      } else if (type === 'attendance') {
        setFormData({
          status: 'present',
          userId: '',
          branchId: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        resetForm();
      }
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'shifts') {
        if (editingItem) {
          await dispatch(updateShift({ id: editingItem._id, data: formData })).unwrap();
          toast.success('Shift updated successfully');
        } else {
          await dispatch(createShift(formData)).unwrap();
          toast.success('Shift created successfully');
        }
        dispatch(getShifts());
      } else if (activeTab === 'tasks') {
        if (editingItem) {
          await dispatch(updateTask({ id: editingItem._id, data: formData })).unwrap();
          toast.success('Task updated successfully');
        } else {
          await dispatch(createTask(formData)).unwrap();
          toast.success('Task created successfully');
        }
        dispatch(getTasks());
      } else if (activeTab === 'attendance') {
        if (editingItem) {
          await dispatch(updateAttendance({ id: editingItem._id, data: formData })).unwrap();
          toast.success('Attendance updated successfully');
        } else {
          await dispatch(createAttendance(formData)).unwrap();
          toast.success('Attendance created successfully');
        }
        dispatch(getAttendance());
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'shifts') {
        await dispatch(deleteShift(id)).unwrap();
        toast.success('Shift deleted successfully');
        dispatch(getShifts());
      } else if (activeTab === 'tasks') {
        await dispatch(deleteTask(id)).unwrap();
        toast.success('Task deleted successfully');
        dispatch(getTasks());
      }
    } catch (error) {
      toast.error(error || 'Delete failed');
    }
  };

  const shiftColumns = [
    { header: 'Staff', cell: (item) => item.userId?.name || 'N/A' },
    { header: 'Branch', cell: (item) => item.branchId?.branchName || 'N/A' },
    { header: 'Date', cell: (item) => item.shiftDate ? new Date(item.shiftDate).toLocaleDateString() : 'N/A' },
    { header: 'Start Time', cell: (item) => item.startTime ? new Date(item.startTime).toLocaleTimeString() : 'N/A' },
    { header: 'End Time', cell: (item) => item.endTime ? new Date(item.endTime).toLocaleTimeString() : 'N/A' },
    {
      header: 'Status',
      cell: (item) => {
        const statusColors = {
          scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          in_progress: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.scheduled}`}>
            {item.status || 'N/A'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-2">
          <button onClick={() => handleOpenModal('shifts', item)} className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const taskColumns = [
    { header: 'Title', cell: (item) => item.title || 'N/A' },
    { header: 'Category', cell: (item) => item.category || 'N/A' },
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
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          on_hold: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.pending}`}>
            {item.status || 'pending'}
          </span>
        );
      }
    },
    { header: 'Assigned To', cell: (item) => item.assignedTo?.name || 'Unassigned' },
    { header: 'Due Date', cell: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A' },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-2">
          <button onClick={() => handleOpenModal('tasks', item)} className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const attendanceColumns = [
    { header: 'Staff', cell: (item) => item.userId?.name || 'N/A' },
    { header: 'Branch', cell: (item) => item.branchId?.branchName || 'N/A' },
    { header: 'Date', cell: (item) => item.date ? new Date(item.date).toLocaleDateString() : 'N/A' },
    { header: 'Check In', cell: (item) => item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString() : 'N/A' },
    { header: 'Check Out', cell: (item) => item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString() : 'N/A' },
    {
      header: 'Status',
      cell: (item) => {
        const statusColors = {
          present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          on_leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status] || statusColors.present}`}>
            {item.status || 'N/A'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      cell: (item) => (
        <button onClick={() => handleOpenModal('attendance', item)} className="text-blue-600 hover:text-blue-800">
          <Edit className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const renderForm = () => {
    if (activeTab === 'shifts') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Staff *</label>
              <select
                value={formData.userId || ''}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Staff</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
              <select
                value={formData.branchId || ''}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shift Date *</label>
              <input
                type="date"
                value={formData.shiftDate ? new Date(formData.shiftDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
              <select
                value={formData.status || 'scheduled'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
              <input
                type="datetime-local"
                value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
              <input
                type="datetime-local"
                value={formData.endTime ? new Date(formData.endTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
        </div>
      );
    } else if (activeTab === 'tasks') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority *</label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
              <select
                value={formData.status || 'pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <select
                value={formData.category || 'other'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="prep">Prep</option>
                <option value="delivery">Delivery</option>
                <option value="cleaning">Cleaning</option>
                <option value="inventory">Inventory</option>
                <option value="maintenance">Maintenance</option>
                <option value="customer_service">Customer Service</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned To</label>
              <select
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
              <select
                value={formData.branchId || ''}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
            <input
              type="datetime-local"
              value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div >
      );
    } else if (activeTab === 'attendance') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Staff *</label>
              <select
                value={formData.userId || ''}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Staff</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
              <select
                value={formData.branchId || ''}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
              <select
                value={formData.status || 'present'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Check In Time</label>
              <input
                type="datetime-local"
                value={formData.checkInTime ? new Date(formData.checkInTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Check Out Time</label>
              <input
                type="datetime-local"
                value={formData.checkOutTime ? new Date(formData.checkOutTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Operations Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage shifts, tasks, and attendance</p>
        </div>
        <button
          onClick={() => handleOpenModal(activeTab)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add {activeTab === 'shifts' ? 'Shift' : activeTab === 'tasks' ? 'Task' : 'Attendance'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Shifts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {shifts.filter(s => s.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {tasks.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Present Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {attendance.filter(a => a.status === 'present').length}
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
            {['shifts', 'tasks', 'attendance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
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
              {activeTab === 'shifts' && <DataTable data={shifts} columns={shiftColumns} />}
              {activeTab === 'tasks' && <DataTable data={tasks} columns={taskColumns} />}
              {activeTab === 'attendance' && <DataTable data={attendance} columns={attendanceColumns} />}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? `Edit ${activeTab === 'shifts' ? 'Shift' : activeTab === 'tasks' ? 'Task' : 'Attendance'}` : `Add ${activeTab === 'shifts' ? 'Shift' : activeTab === 'tasks' ? 'Task' : 'Attendance'}`}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderForm()}
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
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Operations;
