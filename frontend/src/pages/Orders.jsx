import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Truck, CreditCard } from 'lucide-react';
import { getOrders, createOrder, updateOrderStatus, assignRider } from '../store/slices/orderSlice';
import { getMenuItems } from '../store/slices/menuSlice';
import { getBranches } from '../store/slices/branchSlice';
import { getRiders } from '../store/slices/ridersSlice';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Orders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { orders = [], isLoading, error } = useSelector((state) => state.orders || {});
    const { menuItems = [] } = useSelector((state) => state.menu || {});
    const { branches = [] } = useSelector((state) => state.branches || {});
    const { riders = [] } = useSelector((state) => state.riders || {});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAssignRiderModalOpen, setIsAssignRiderModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [formData, setFormData] = useState({
        branch: '',
        customerInfo: {
            name: '',
            phone: '',
            email: '',
            address: ''
        },
        cartItems: [],
        orderType: 'Delivery',
        orderStatus: 'Placed'
    });
    const [selectedRider, setSelectedRider] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                await dispatch(getOrders()).unwrap();
            } catch (error) {
                console.error('Error loading orders:', error);
                toast.error('Failed to load orders: ' + (error || 'Unknown error'));
            }
        };
        loadData();
        dispatch(getMenuItems());
        dispatch(getBranches());
        dispatch(getRiders());
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate that at least one item is added
            if (formData.cartItems.length === 0) {
                toast.error('Please add at least one item to the order');
                return;
            }

            // Validate that all items have required fields
            const invalidItems = formData.cartItems.filter(item => !item.menuItem || !item.name || item.price <= 0);
            if (invalidItems.length > 0) {
                toast.error('Please complete all item details (select menu item, size, and quantity)');
                return;
            }

            // Calculate totals
            const subtotal = formData.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.15;
            const deliveryFee = formData.orderType === 'Delivery' ? 100 : 0;
            const total = subtotal + tax + deliveryFee;

            const orderData = {
                ...formData,
                subtotal,
                tax,
                deliveryFee,
                total
            };

            const result = await dispatch(createOrder(orderData)).unwrap();
            toast.success('Order created successfully');
            handleCloseModal();
            
            // Navigate to checkout with order data
            const createdOrder = result.data || result;
            navigate(`/checkout/${createdOrder._id}`, { 
                state: { order: { ...orderData, ...createdOrder } } 
            });
        } catch (error) {
            toast.error(error || 'Failed to create order');
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
            toast.success('Order status updated');
        } catch (error) {
            toast.error(error || 'Failed to update status');
        }
    };

    const handleAssignRider = async () => {
        try {
            await dispatch(assignRider({ orderId: selectedOrder._id, riderId: selectedRider })).unwrap();
            toast.success('Rider assigned successfully');
            setIsAssignRiderModalOpen(false);
            setSelectedRider('');
        } catch (error) {
            toast.error(error || 'Failed to assign rider');
        }
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    const handleOpenAssignRider = (order) => {
        setSelectedOrder(order);
        setIsAssignRiderModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            branch: '',
            customerInfo: {
                name: '',
                phone: '',
                email: '',
                address: ''
            },
            cartItems: [],
            orderType: 'Delivery',
            orderStatus: 'Placed'
        });
    };

    const addCartItem = () => {
        setFormData({
            ...formData,
            cartItems: [...formData.cartItems, {
                menuItem: '',
                name: '',
                size: 'Medium',
                quantity: 1,
                price: 0,
                addons: []
            }]
        });
    };

    const removeCartItem = (index) => {
        const newItems = formData.cartItems.filter((_, i) => i !== index);
        setFormData({ ...formData, cartItems: newItems });
    };

    const updateCartItem = (index, field, value) => {
        const newItems = [...formData.cartItems];

        if (field === 'menuItem') {
            const selectedItem = menuItems.find(item => item._id === value);
            if (selectedItem) {
                newItems[index] = {
                    ...newItems[index],
                    menuItem: value,
                    name: selectedItem.name,
                    price: selectedItem.sizes[0]?.price || 0
                };
            }
        } else if (field === 'size') {
            const selectedItem = menuItems.find(item => item._id === newItems[index].menuItem);
            const selectedSize = selectedItem?.sizes.find(s => s.size === value);
            newItems[index] = {
                ...newItems[index],
                size: value,
                price: selectedSize?.price || 0
            };
        } else {
            newItems[index][field] = value;
        }

        setFormData({ ...formData, cartItems: newItems });
    };

    const filteredOrders = (orders || []).filter(order => {
        const orderNum = order.orderNumber || order.orderId || '';
        const customerName = order.customerInfo?.name || '';
        const matchesSearch =
            orderNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        const colors = {
            'Placed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'Preparing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'Baking': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            'OutForDelivery': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            'Delivered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const columns = [
        { 
            header: 'Order #', 
            accessor: (row) => (
                <span className="font-mono text-sm">{row.orderNumber || row.orderId || 'N/A'}</span>
            ),
            cell: (row) => (
                <span className="font-mono text-sm">{row.orderNumber || row.orderId || 'N/A'}</span>
            )
        },
        {
            header: 'Customer',
            cell: (row) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{row.customerInfo?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{row.customerInfo?.phone}</p>
                </div>
            )
        },
        {
            header: 'Branch',
            cell: (row) => row.branch?.branchName || 'N/A'
        },
        {
            header: 'Type',
            cell: (row) => (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-600 text-gray-200">
                    {row.orderType}
                </span>
            )
        },
        {
            header: 'Status',
            cell: (row) => (
                <select
                    value={row.orderStatus}
                    onChange={(e) => handleStatusChange(row._id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(row.orderStatus)} border-0 cursor-pointer outline-none`}
                >
                    <option value="Placed">Placed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Baking">Baking</option>
                    <option value="OutForDelivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            )
        },
        {
            header: 'Total',
            cell: (row) => <span className="font-semibold">Rs {row.total?.toLocaleString()}</span>
        },
        {
            header: 'Payment',
            cell: (row) => {
                const status = row.paymentStatus || 'pending';
                const colors = {
                    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                    refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
                };
                return (
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${colors[status] || colors.pending}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            header: 'Date',
            cell: (row) => format(new Date(row.createdAt), 'MMM dd, yyyy HH:mm')
        },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleViewOrder(row)}
                        className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4 text-blue-400" />
                    </button>
                    {row.paymentStatus !== 'completed' && row.orderStatus !== 'Cancelled' && (
                        <button
                            onClick={() => navigate(`/checkout/${row._id}`, { state: { order: row } })}
                            className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                            title="Process Payment"
                        >
                            <CreditCard className="w-4 h-4 text-emerald-400" />
                        </button>
                    )}
                    {row.orderType === 'Delivery' && row.orderStatus !== 'Delivered' && row.orderStatus !== 'Cancelled' && (
                        <button
                            onClick={() => handleOpenAssignRider(row)}
                            className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                            title="Assign Rider"
                        >
                            <Truck className="w-4 h-4 text-green-400" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner size="large" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-full space-y-4">
                <p className="text-red-600 dark:text-red-400 text-lg">Error loading orders</p>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
                <button
                    onClick={() => dispatch(getOrders())}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Track and manage all orders</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Order</span>
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {['All', 'Placed', 'Preparing', 'Baking', 'OutForDelivery', 'Delivered', 'Cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        {status === 'OutForDelivery' ? 'Out for Delivery' : status}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 && !isLoading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                    {orders.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try creating a new order</p>
                    )}
                </div>
            ) : (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        onSearch={setSearchTerm}
                        searchPlaceholder="Search by order number or customer..."
                    />
                </div>
            )}

            {/* Create Order Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Create New Order"
                size="large"
            >
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                            <select
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="">Select Branch</option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Type</label>
                            <select
                                value={formData.orderType}
                                onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            >
                                <option value="Delivery">Delivery</option>
                                <option value="Takeaway">Takeaway</option>
                                <option value="DineIn">Dine In</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.customerInfo.name}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        customerInfo: { ...formData.customerInfo, name: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.customerInfo.phone}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        customerInfo: { ...formData.customerInfo, phone: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.customerInfo.email}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        customerInfo: { ...formData.customerInfo, email: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.customerInfo.address}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        customerInfo: { ...formData.customerInfo, address: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required={formData.orderType === 'Delivery'}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium text-gray-900 dark:text-white">Order Items</h3>
                            <button
                                type="button"
                                onClick={addCartItem}
                                className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                            >
                                + Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {!formData.cartItems || formData.cartItems.length === 0 ? (
                                <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                                    <p className="text-gray-500 dark:text-gray-400 mb-2">No items added yet</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">Click "+ Add Item" button above to add items to this order</p>
                                </div>
                            ) : (
                                formData.cartItems.map((item, index) => (
                                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                                    <div className="grid grid-cols-4 gap-2">
                                        <select
                                            value={item.menuItem}
                                            onChange={(e) => updateCartItem(index, 'menuItem', e.target.value)}
                                            className="col-span-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                                            required
                                        >
                                            <option value="">Select Item</option>
                                            {menuItems.map(mi => (
                                                <option key={mi._id} value={mi._id}>{mi.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={item.size}
                                            onChange={(e) => updateCartItem(index, 'size', e.target.value)}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                                            required
                                        >
                                            {menuItems.find(mi => mi._id === item.menuItem)?.sizes.map(s => (
                                                <option key={s.size} value={s.size}>{s.size}</option>
                                            )) || <option value="Medium">Medium</option>}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateCartItem(index, 'quantity', parseInt(e.target.value))}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                                            placeholder="Qty"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Price: Rs {item.price * item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeCartItem(index)}
                                            className="text-red-600 text-sm hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    </div>
                                ))
                            )}
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
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Create Order
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Order Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Order Details - ${selectedOrder?.orderNumber || selectedOrder?.orderId || 'N/A'}`}
                size="medium"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerInfo?.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.customerInfo?.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Order Type</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.orderType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.orderStatus)}`}>
                                    {selectedOrder.orderStatus === 'OutForDelivery' ? 'Out for Delivery' : selectedOrder.orderStatus}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.branch?.branchName}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Items</h3>
                            <div className="space-y-2">
                                {(selectedOrder.cartItems || selectedOrder.items || []).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>{item.name} ({item.size || 'N/A'}) x {item.quantity}</span>
                                        <span>Rs {((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-1">
                            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>Subtotal</span>
                                <span>Rs {selectedOrder.subtotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>Tax (15%)</span>
                                <span>Rs {selectedOrder.tax?.toLocaleString()}</span>
                            </div>
                            {selectedOrder.deliveryFee > 0 && (
                                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                    <span>Delivery Fee</span>
                                    <span>Rs {selectedOrder.deliveryFee?.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                                <span>Total</span>
                                <span>Rs {selectedOrder.total?.toLocaleString()}</span>
                            </div>
                        </div>

                        {selectedOrder.assignedRider && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Rider</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.assignedRider?.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.assignedRider?.phone}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Assign Rider Modal */}
            <Modal
                isOpen={isAssignRiderModalOpen}
                onClose={() => setIsAssignRiderModalOpen(false)}
                title="Assign Delivery Rider"
                size="small"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Rider</label>
                        <select
                            value={selectedRider}
                            onChange={(e) => setSelectedRider(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Choose a rider</option>
                            {riders.filter(r => r.availability === 'available').map(rider => (
                                <option key={rider._id} value={rider._id}>
                                    {rider.name} - {rider.vehicleType}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setIsAssignRiderModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssignRider}
                            disabled={!selectedRider}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Assign Rider
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Orders;