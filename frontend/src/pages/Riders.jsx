import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Eye, Package, TrendingUp, Star } from 'lucide-react';
import {
    getRiders,
    createRider,
    updateRider,
    deleteRider,
    updateAvailability,
    getRiderStats,
    getRiderOrders,
    clearSelectedRiderData
} from '../store/slices/ridersSlice';
import { getBranches } from '../store/slices/branchSlice';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatsCard from '../components/common/StatsCard';
import toast from 'react-hot-toast';

const Riders = () => {
    const dispatch = useDispatch();
    const {
        riders,
        isLoading,
        selectedRiderOrders,
        selectedRiderStats,
        isLoadingOrders,
        isLoadingStats
    } = useSelector((state) => state.riders);
    const { branches } = useSelector((state) => state.branches);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editingRider, setEditingRider] = useState(null);
    const [selectedRider, setSelectedRider] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('All');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        branch: '',
        vehicleType: 'Bike',
        vehicleNumber: '',
        licenseNumber: '',
        availability: 'available'
    });

    useEffect(() => {
        dispatch(getRiders());
        dispatch(getBranches());
    }, [dispatch]);

    // Fetch stats for all riders after they're loaded
    useEffect(() => {
        if (riders.length > 0) {
            riders.forEach(rider => {
                if (!rider.stats) {
                    dispatch(getRiderStats(rider._id));
                }
            });
        }
    }, [riders.length, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRider) {
                await dispatch(updateRider({ id: editingRider._id, riderData: formData })).unwrap();
                toast.success('Rider updated successfully');
            } else {
                await dispatch(createRider(formData)).unwrap();
                toast.success('Rider created successfully');
            }
            handleCloseModal();
        } catch (error) {
            toast.error(error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this rider?')) {
            try {
                await dispatch(deleteRider(id)).unwrap();
                toast.success('Rider deleted successfully');
            } catch (error) {
                toast.error(error || 'Failed to delete rider');
            }
        }
    };

    const handleEdit = (rider) => {
        setEditingRider(rider);
        setFormData({
            name: rider.name,
            email: rider.email,
            phone: rider.phone,
            assignedBranch: rider.branch?._id || '',
            vehicleType: rider.vehicleType,
            vehicleNumber: rider.vehicleNumber || '',
            licenseNumber: rider.licenseNumber || '',
            availability: rider.availability,
            branch: rider.branch?._id || ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRider(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            branch: formData.branch || undefined,
            vehicleType: 'Bike',
            vehicleNumber: '',
            availability: 'available'
        });
    };

    const handleViewDetails = async (rider) => {
        setSelectedRider(rider);
        setIsDetailsModalOpen(true);

        // Fetch latest data for this rider
        dispatch(getRiderOrders(rider._id));
        dispatch(getRiderStats(rider._id));
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedRider(null);
        dispatch(clearSelectedRiderData());
    };

    const handleAvailabilityChange = async (riderId, newAvailability) => {
        try {
            await dispatch(updateAvailability({ id: riderId, availability: newAvailability })).unwrap();
            toast.success('Availability updated');
        } catch (error) {
            toast.error(error || 'Failed to update availability');
        }
    };

    const filteredRiders = riders.filter(rider => {
        const matchesSearch =
            rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rider.phone.includes(searchTerm);
        const matchesAvailability = availabilityFilter === 'All' || rider.availability === availabilityFilter;
        return matchesSearch && matchesAvailability;
    });

    // Calculate stats from fetched data
    const availableRiders = riders.filter(r => r.availability === 'available').length;
    const busyRiders = riders.filter(r => r.availability === 'busy').length;
    const offlineRiders = riders.filter(r => r.availability === 'offline').length;
    const totalDeliveries = riders.reduce((total, rider) =>
        total + (rider.stats?.totalDeliveries || 0), 0
    );

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Phone', accessor: 'phone' },
        { header: 'Vehicle', cell: (rider) => `${rider.vehicleType} - ${rider.vehicleNumber}` },
        {
            header: 'Total Deliveries',
            cell: (rider) => (
                <span className="font-semibold text-blue-600">
                    {rider.stats?.totalDeliveries || 0}
                </span>
            )
        },
        {
            header: 'Active Orders',
            cell: (rider) => (
                <span className="font-semibold text-orange-600">
                    {rider.stats?.activeDeliveries || 0}
                </span>
            )
        },
        {
            header: 'Status',
            cell: (rider) => (
                <select
                    value={rider.availability}
                    onChange={(e) => handleAvailabilityChange(rider._id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-medium ${rider.availability === 'available' ? 'bg-green-100 text-green-800' :
                        rider.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}
                >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                </select>
            )
        },
        {
            header: 'Actions',
            cell: (rider) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleViewDetails(rider)}
                        className="text-purple-600 hover:text-purple-800"
                        title="View Details"
                    >
                        <Eye size={18} />
                    </button>
                    <button onClick={() => handleEdit(rider)} className="text-blue-600 hover:text-blue-800">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(rider._id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Riders Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Add Rider
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Deliveries" value={totalDeliveries} icon={Package} color="bg-blue-500" />
                <StatsCard title="Available Riders" value={availableRiders} icon={CheckCircle} color="bg-green-500" />
                <StatsCard title="Busy Riders" value={busyRiders} icon={Clock} color="bg-yellow-500" />
                <StatsCard title="Offline Riders" value={offlineRiders} icon={XCircle} color="bg-gray-500" />
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
                {['All', 'available', 'busy', 'offline'].map(status => (
                    <button
                        key={status}
                        onClick={() => setAvailabilityFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm capitalize ${availabilityFilter === status
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Riders Table */}
            <DataTable
                columns={columns}
                data={filteredRiders}
                onSearch={setSearchTerm}
                searchPlaceholder="Search riders by name or phone..."
            />

            {/* Add/Edit Rider Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingRider ? 'Edit Rider' : 'Add New Rider'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Branch</label>
                            <select
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Type</label>
                            <select
                                value={formData.vehicleType}
                                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="Bike">Bike</option>
                                <option value="Scooter">Scooter</option>
                                <option value="Car">Car</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Number</label>
                            <input
                                type="text"
                                value={formData.vehicleNumber}
                                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                placeholder="ABC-1234"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">License Number</label>
                        <input
                            type="text"
                            value={formData.licenseNumber}
                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</label>
                        <select
                            value={formData.availability}
                            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            {editingRider ? 'Update' : 'Create'} Rider
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Rider Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                title={`Rider Details - ${selectedRider?.name || ''}`}
            >
                {isLoadingStats || isLoadingOrders ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Performance Stats */}
                        {selectedRiderStats && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <TrendingUp className="mr-2" size={20} />
                                    Performance Statistics
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{selectedRiderStats.totalDeliveries}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{selectedRiderStats.activeDeliveries}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Active Orders</div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">{selectedRiderStats.successRate}%</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600 flex items-center">
                                            {selectedRiderStats.averageRating} <Star size={16} className="ml-1" />
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-indigo-600">{selectedRiderStats.averageDeliveryTime} min</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Delivery Time</div>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">{selectedRiderStats.cancelledDeliveries}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg col-span-2">
                                        <div className="text-2xl font-bold text-emerald-600">Rs {selectedRiderStats.totalRevenue}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue Delivered</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Orders */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Package className="mr-2" size={20} />
                                Active Orders ({selectedRiderOrders?.length || 0})
                            </h3>
                            {selectedRiderOrders && selectedRiderOrders.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedRiderOrders.map(order => (
                                        <div key={order._id} className="border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-semibold">{order.orderId}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {order.customerInfo?.name || order.deliveryAddress?.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {order.items?.length || order.cartItems?.length || 0} items - Rs {order.totalAmount || order.total}
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${order.orderStatus === 'out_for_delivery' || order.orderStatus === 'OutForDelivery'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.orderStatus}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No active orders
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Riders;