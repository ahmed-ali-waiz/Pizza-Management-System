import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../store/slices/branchSlice';
import { getUsers } from '../store/slices/userSlice';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Branches = () => {
    const dispatch = useDispatch();
    const { branches, isLoading } = useSelector((state) => state.branches);
    const { users } = useSelector((state) => state.users);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        branchName: '',
        address: { street: '', city: '', state: '', zipCode: '', country: 'Pakistan' },
        manager: '',
        deliveryRadius: 5,
        status: 'active'
    });

    useEffect(() => {
        dispatch(getBranches());
        dispatch(getUsers());
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await dispatch(updateBranch({ id: editingBranch._id, branchData: formData })).unwrap();
                toast.success('Branch updated successfully');
            } else {
                await dispatch(createBranch(formData)).unwrap();
                toast.success('Branch created successfully');
            }
            handleCloseModal();
        } catch (error) {
            toast.error(error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await dispatch(deleteBranch(id)).unwrap();
                toast.success('Branch deleted');
            } catch (error) {
                toast.error(error);
            }
        }
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            branchName: branch.branchName,
            address: branch.address,
            manager: branch.manager?._id || '',
            deliveryRadius: branch.deliveryRadius,
            status: branch.status
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
        setFormData({
            branchName: '',
            address: { street: '', city: '', state: '', zipCode: '', country: 'Pakistan' },
            manager: '',
            deliveryRadius: 5,
            status: 'active'
        });
    };

    const managers = users.filter(u => u.role === 'BranchManager');
    const filteredBranches = branches.filter(b =>
        b.branchName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { header: 'Branch Name', accessor: 'branchName' },
        { header: 'City', cell: (row) => row.address.city },
        { header: 'Manager', cell: (row) => row.manager?.name || 'Not Assigned' },
        { header: 'Delivery Radius', cell: (row) => `${row.deliveryRadius} km` },
        {
            header: 'Status',
            cell: (row) => (
                <span className={`px-2 py-1 text-xs rounded-full ${row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    <button onClick={() => handleEdit(row)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button onClick={() => handleDelete(row._id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                </div>
            )
        }
    ];

    if (isLoading) return <div className="flex justify-center"><LoadingSpinner size="large" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branch Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your pizza branches</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Branch</span>
                </button>
            </div>

            <DataTable columns={columns} data={filteredBranches} onSearch={setSearchTerm} searchPlaceholder="Search branches..." />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBranch ? 'Edit Branch' : 'Add Branch'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch Name</label>
                        <input
                            type="text"
                            value={formData.branchName}
                            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Street</label>
                            <input
                                type="text"
                                value={formData.address.street}
                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                            <input
                                type="text"
                                value={formData.address.city}
                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                            <input
                                type="text"
                                value={formData.address.state}
                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zip Code</label>
                            <input
                                type="text"
                                value={formData.address.zipCode}
                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Manager</label>
                            <select
                                value={formData.manager}
                                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Select Manager</option>
                                {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Radius (km)</label>
                            <input
                                type="number"
                                value={formData.deliveryRadius}
                                onChange={(e) => setFormData({ ...formData, deliveryRadius: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                min="1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            {editingBranch ? 'Update' : 'Create'} Branch
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Branches;