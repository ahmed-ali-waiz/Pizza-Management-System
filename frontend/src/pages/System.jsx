import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings as SettingsIcon, FileText, Tag, Save, Plus, Edit, Trash2 } from 'lucide-react';
import { getSettings, getCategories, updateSetting, createCategory, updateCategory, deleteCategory } from '../store/slices/systemSlice';
import { getBranches } from '../store/slices/branchSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const System = () => {
  const dispatch = useDispatch();
  const { settings, categories, isLoading } = useSelector((state) => state.system);
  const { branches } = useSelector((state) => state.branches || {});
  const [activeTab, setActiveTab] = useState('settings');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    dispatch(getSettings());
    dispatch(getCategories());
    dispatch(getBranches());
  }, [dispatch]);

  const handleOpenModal = (type, item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'settings') {
        await dispatch(updateSetting({
          key: editingItem?.key || formData.key,
          value: formData.value,
          branchId: formData.branchId || null,
        })).unwrap();
        toast.success('Setting updated');
        dispatch(getSettings());
      } else if (activeTab === 'categories') {
        if (editingItem) {
          await dispatch(updateCategory({ id: editingItem._id, data: formData })).unwrap();
          toast.success('Category updated');
        } else {
          await dispatch(createCategory(formData)).unwrap();
          toast.success('Category created');
        }
        dispatch(getCategories());
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await dispatch(deleteCategory(id)).unwrap();
      toast.success('Category deleted');
      dispatch(getCategories());
    } catch (error) {
      toast.error(error || 'Delete failed');
    }
  };

  const settingsColumns = [
    { header: 'Key', cell: (item) => item.key || 'N/A' },
    { header: 'Value', cell: (item) => String(item.value || '').substring(0, 50) + (String(item.value || '').length > 50 ? '...' : '') },
    { header: 'Category', cell: (item) => item.category || 'N/A' },
    { header: 'Branch', cell: (item) => item.branchId?.branchName || 'Global' },
    { header: 'Active', cell: (item) => item.isActive ? 'Yes' : 'No' },
    {
      header: 'Actions',
      cell: (item) => (
        <button onClick={() => handleOpenModal('settings', item)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
          <Edit className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const categoryColumns = [
    { header: 'Name', cell: (item) => item.name || 'N/A' },
    { header: 'Description', cell: (item) => item.description || 'N/A' },
    { header: 'Order', cell: (item) => item.displayOrder || 0 },
    { header: 'Active', cell: (item) => item.isActive ? 'Yes' : 'No' },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex space-x-2">
          <button onClick={() => handleOpenModal('categories', item)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800 dark:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const renderForm = () => {
    if (activeTab === 'settings') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key *</label>
            <input
              type="text"
              value={formData.key || ''}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
              disabled={!!editingItem}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value *</label>
            <textarea
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows="3"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
              <select
                value={formData.branchId || ''}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Global</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive !== false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>
        </div>
      );
    } else if (activeTab === 'categories') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Order</label>
            <input
              type="number"
              value={formData.displayOrder || 0}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              min="0"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive !== false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage system configuration and categories</p>
        </div>
        {(activeTab === 'settings' || activeTab === 'categories') && (
          <button
            onClick={() => handleOpenModal(activeTab)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add {activeTab === 'settings' ? 'Setting' : 'Category'}</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Settings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{settings.length}</p>
            </div>
            <SettingsIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{categories.length}</p>
            </div>
            <Tag className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {['settings', 'categories'].map((tab) => (
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
              {activeTab === 'settings' && <DataTable data={settings} columns={settingsColumns} />}
              {activeTab === 'categories' && <DataTable data={categories} columns={categoryColumns} />}
            </>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingItem ? `Edit ${activeTab === 'settings' ? 'Setting' : 'Category'}` : `Add ${activeTab === 'settings' ? 'Setting' : 'Category'}`}
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

export default System;
