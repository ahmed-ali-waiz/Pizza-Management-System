import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { getInventory, createInventoryItem } from '../store/slices/inventorySlice';
import { getBranches } from '../store/slices/branchSlice';
import { getMenuItems } from '../store/slices/menuSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Inventory = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.inventory);
  const { branches } = useSelector((state) => state.branches || {});
  const { menuItems } = useSelector((state) => state.menu || {});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    itemId: '',
    branchId: '',
    quantity: 0,
    minStockLevel: 10,
    maxStockLevel: 100,
    unit: 'piece',
    costPerUnit: 0,
    supplier: '',
    location: 'main_storage',
  });

  useEffect(() => {
    dispatch(getInventory());
    dispatch(getBranches());
    dispatch(getMenuItems());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(createInventoryItem(formData)).unwrap();
      toast.success('Inventory item added successfully');
      setIsModalOpen(false);
      setFormData({
        itemId: '',
        branchId: '',
        quantity: 0,
        minStockLevel: 10,
        maxStockLevel: 100,
        unit: 'piece',
        costPerUnit: 0,
        supplier: '',
        location: 'main_storage',
      });
      // Refresh inventory list to get populated data
      await dispatch(getInventory()).unwrap();
    } catch (error) {
      toast.error(error || 'Failed to add inventory item');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      itemId: '',
      branchId: '',
      quantity: 0,
      minStockLevel: 10,
      maxStockLevel: 100,
      unit: 'piece',
      costPerUnit: 0,
      supplier: '',
      location: 'main_storage',
    });
  };

  const filteredItems = items.filter((item) => {
    const itemName = item.itemId?.name || item.menuItem?.name || '';
    const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'low' && item.quantity <= item.minStockLevel) ||
      (filter === 'out' && item.quantity === 0);
    return matchesSearch && matchesFilter;
  });

  const lowStockItems = items.filter(item => item.quantity <= item.minStockLevel);

  const columns = [
    { 
      header: 'Item', 
      cell: (item) => {
        const name = item.itemId?.name || item.menuItem?.name;
        if (name) return name;
        // If name not available, try to find it from menuItems
        if (item.itemId && typeof item.itemId === 'string') {
          const menuItem = menuItems.find(m => m._id === item.itemId);
          return menuItem?.name || `Item ${item.itemId.substring(0, 8)}...`;
        }
        return 'N/A';
      }
    },
    { 
      header: 'Branch', 
      cell: (item) => {
        const branchName = item.branchId?.branchName;
        if (branchName) return branchName;
        // If name not available, try to find it from branches
        if (item.branchId && typeof item.branchId === 'string') {
          const branch = branches.find(b => b._id === item.branchId);
          return branch?.branchName || `Branch ${item.branchId.substring(0, 8)}...`;
        }
        return 'N/A';
      }
    },
    { 
      header: 'Quantity',
      cell: (item) => (
        <span className={item.quantity <= item.minStockLevel ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}>
          {item.quantity} {item.unit}
        </span>
      )
    },
    { 
      header: 'Min Level',
      cell: (item) => item.minStockLevel || 0
    },
    { 
      header: 'Max Level',
      cell: (item) => item.maxStockLevel || 0
    },
    { 
      header: 'Cost Per Unit',
      cell: (item) => `Rs ${(item.costPerUnit || 0).toLocaleString()}`
    },
    { 
      header: 'Status',
      cell: (item) => {
        if (item.quantity === 0) return <span className="text-red-600 dark:text-red-400 font-medium">Out of Stock</span>;
        if (item.quantity <= item.minStockLevel) return <span className="text-orange-600 dark:text-orange-400 font-medium">Low Stock</span>;
        return <span className="text-green-600 dark:text-green-400 font-medium">In Stock</span>;
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track and manage inventory levels</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{items.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{lowStockItems.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {items.filter(i => i.quantity === 0).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                Rs {items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No inventory items found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {items.length === 0 ? 'Get started by adding your first inventory item' : 'Try adjusting your search or filter'}
          </p>
        </div>
      ) : (
        <DataTable data={filteredItems} columns={columns} />
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add Inventory Item" size="medium">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Menu Item *</label>
              <select
                value={formData.itemId}
                onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Menu Item</option>
                {menuItems.map(item => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
              <select
                value={formData.branchId}
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram</option>
                <option value="liter">Liter</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost Per Unit (Rs) *</label>
              <input
                type="number"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Stock Level *</label>
              <input
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Stock Level *</label>
              <input
                type="number"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="main_storage"
              />
            </div>
          </div>

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
              Add Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;


