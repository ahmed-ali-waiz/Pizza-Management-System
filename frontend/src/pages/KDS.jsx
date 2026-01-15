import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, ChefHat, Flame } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../store/slices/orderSlice';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const KDS = () => {
    const dispatch = useDispatch();
    const { orders = [], isLoading, error } = useSelector((state) => state.orders || {});
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const loadOrders = async () => {
            try {
                await dispatch(getOrders()).unwrap();
            } catch (error) {
                console.error('Error loading orders:', error);
                toast.error('Failed to load orders: ' + (error || 'Unknown error'));
            }
        };
        loadOrders();

        // Auto refresh every 30 seconds
        if (autoRefresh) {
            const interval = setInterval(() => {
                dispatch(getOrders()).catch(err => console.error('Auto-refresh error:', err));
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [dispatch, autoRefresh]);

    useEffect(() => {
        // Update clock every second
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
            toast.success(`Order moved to ${newStatus}`);
        } catch (error) {
            toast.error(error || 'Failed to update status');
        }
    };

    // Filter orders for kitchen view (Placed, Preparing and Baking only)
    const placedOrders = (orders || []).filter(o => o.orderStatus === 'Placed' || o.orderStatus === 'pending');
    const preparingOrders = (orders || []).filter(o => o.orderStatus === 'Preparing' || o.orderStatus === 'preparing');
    const bakingOrders = (orders || []).filter(o => o.orderStatus === 'Baking' || o.orderStatus === 'baking');

    const getOrderAge = (createdAt) => {
        const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
        return minutes;
    };

    const getOrderAgeColor = (minutes) => {
        if (minutes < 10) return 'text-green-600 dark:text-green-400';
        if (minutes < 20) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const OrderCard = ({ order, currentStatus }) => {
        const age = getOrderAge(order.createdAt);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.orderNumber || order.orderId || 'N/A'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.orderType || 'Delivery'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Clock className={`w-5 h-5 ${getOrderAgeColor(age)}`} />
                        <span className={`font-semibold ${getOrderAgeColor(age)}`}>{age} min</span>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    {(order.cartItems || order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {item.quantity}x {item.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Size: {item.size || 'N/A'}</p>
                                {(item.addons || item.customizations || []).length > 0 && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        + {(item.addons || item.customizations).map(a => a.name || a).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span>Customer: {order.customerInfo?.name}</span>
                    <span>{format(new Date(order.createdAt), 'HH:mm')}</span>
                </div>

                <div className="flex space-x-2">
                    {(currentStatus === 'Placed' || order.orderStatus === 'pending') && (
                        <button
                            onClick={() => handleStatusUpdate(order._id, 'Preparing')}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Start Preparing
                        </button>
                    )}
                    {(currentStatus === 'Preparing' || order.orderStatus === 'preparing') && (
                        <button
                            onClick={() => handleStatusUpdate(order._id, 'Baking')}
                            className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                        >
                            Move to Baking
                        </button>
                    )}
                    {(currentStatus === 'Baking' || order.orderStatus === 'baking') && (
                        <button
                            onClick={() => handleStatusUpdate(order._id, 'OutForDelivery')}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            Ready for Delivery
                        </button>
                    )}
                </div>
            </div>
        );
    };

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
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                        <ChefHat className="w-8 h-8 text-primary-600" />
                        <span>Kitchen Display System</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Real-time order tracking for kitchen staff</p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="autoRefresh"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="autoRefresh" className="text-sm text-gray-700 dark:text-gray-300">
                            Auto Refresh (30s)
                        </label>
                    </div>

                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(currentTime, 'HH:mm:ss')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">New Orders</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{placedOrders.length}</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-full">
                            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Preparing</p>
                            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{preparingOrders.length}</p>
                        </div>
                        <div className="bg-orange-100 dark:bg-orange-800 p-3 rounded-full">
                            <ChefHat className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Baking</p>
                            <p className="text-3xl font-bold text-red-700 dark:text-red-300">{bakingOrders.length}</p>
                        </div>
                        <div className="bg-red-100 dark:bg-red-800 p-3 rounded-full">
                            <Flame className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Kitchen Workflow Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* New Orders Column */}
                <div className="space-y-4">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
                        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>New Orders ({placedOrders.length})</span>
                        </h2>
                    </div>
                    <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                        {placedOrders.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400">No new orders</p>
                            </div>
                        ) : (
                            placedOrders.map(order => (
                                <OrderCard key={order._id} order={order} currentStatus="Placed" />
                            ))
                        )}
                    </div>
                </div>

                {/* Preparing Column */}
                <div className="space-y-4">
                    <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-3">
                        <h2 className="text-lg font-bold text-orange-900 dark:text-orange-100 flex items-center space-x-2">
                            <ChefHat className="w-5 h-5" />
                            <span>Preparing ({preparingOrders.length})</span>
                        </h2>
                    </div>
                    <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                        {preparingOrders.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400">No orders in preparation</p>
                            </div>
                        ) : (
                            preparingOrders.map(order => (
                                <OrderCard key={order._id} order={order} currentStatus="Preparing" />
                            ))
                        )}
                    </div>
                </div>

                {/* Baking Column */}
                <div className="space-y-4">
                    <div className="bg-red-100 dark:bg-red-900 rounded-lg p-3">
                        <h2 className="text-lg font-bold text-red-900 dark:text-red-100 flex items-center space-x-2">
                            <Flame className="w-5 h-5" />
                            <span>Baking ({bakingOrders.length})</span>
                        </h2>
                    </div>
                    <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                        {bakingOrders.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400">No orders baking</p>
                            </div>
                        ) : (
                            bakingOrders.map(order => (
                                <OrderCard key={order._id} order={order} currentStatus="Baking" />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KDS;