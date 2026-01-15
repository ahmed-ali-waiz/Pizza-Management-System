import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatsCard from '../components/common/StatsCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getOrders } from '../store/slices/orderSlice';
// Temporarily commented out - payments API not available
// import { getPayments } from '../store/slices/paymentsSlice';
import { format } from 'date-fns';

const Dashboard = () => {
    const dispatch = useDispatch();
    const orderState = useSelector((state) => state.orders);
    const orders = orderState?.orders;
    const ordersLoading = orderState?.isLoading;

    // Temporarily commented out - payments API not available
    // const { payments } = useSelector((state) => state.payments);

    useEffect(() => {
        dispatch(getOrders());
        // Temporarily commented out - payments API not available
        // dispatch(getPayments());
    }, [dispatch]);

    // Calculate stats
    const safeOrders = Array.isArray(orders) ? orders : [];
    const totalOrders = safeOrders.length;
    // Calculate revenue from orders instead of payments
    const totalRevenue = safeOrders
        .filter(o => o && o.orderStatus === 'Delivered')
        .reduce((sum, order) => sum + ((order && order.total) || 0), 0);
    const completedOrders = safeOrders.filter(o => o && o.orderStatus === 'Delivered').length;
    const pendingOrders = safeOrders.filter(o => o && o.orderStatus === 'Placed').length;

    // Mock data for charts (you can replace with real data)
    const salesData = [
        { name: 'Mon', sales: 4000 },
        { name: 'Tue', sales: 3000 },
        { name: 'Wed', sales: 5000 },
        { name: 'Thu', sales: 2780 },
        { name: 'Fri', sales: 1890 },
        { name: 'Sat', sales: 2390 },
        { name: 'Sun', sales: 3490 },
    ];

    const ordersData = [
        { name: 'Mon', orders: 24 },
        { name: 'Tue', orders: 18 },
        { name: 'Wed', orders: 32 },
        { name: 'Thu', orders: 28 },
        { name: 'Fri', orders: 45 },
        { name: 'Sat', orders: 52 },
        { name: 'Sun', orders: 38 },
    ];

    if (ordersLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome to your pizza management dashboard</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Revenue"
                    value={`Rs ${totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="green"
                    trend={12.5}
                />
                <StatsCard
                    title="Total Orders"
                    value={totalOrders}
                    icon={ShoppingCart}
                    color="blue"
                    trend={8.2}
                />
                <StatsCard
                    title="Completed Orders"
                    value={completedOrders}
                    icon={TrendingUp}
                    color="purple"
                    trend={15.3}
                />
                <StatsCard
                    title="Pending Orders"
                    value={pendingOrders}
                    icon={Users}
                    color="yellow"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Sales</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Orders</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ordersData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="orders" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {safeOrders.slice(0, 10).map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{order.orderNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{order.customerInfo?.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                            order.orderStatus === 'Preparing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                order.orderStatus === 'Baking' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                                    order.orderStatus === 'OutForDelivery' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                            }`}>
                                            {order.orderStatus === 'OutForDelivery' ? 'Out for Delivery' : order.orderStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">Rs {order.total?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{order.orderType}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                                        {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;