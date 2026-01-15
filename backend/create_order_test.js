const API_URL = 'http://localhost:5001/api';

const runTest = async () => {
    try {
        // Helper for fetch
        const post = async (url, data, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`POST ${url} failed: ${res.status} ${text}`);
            }
            return res.json();
        };

        const get = async (url, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(url, { headers });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`GET ${url} failed: ${res.status} ${text}`);
            }
            return res.json();
        };

        // 1. Login
        console.log('Logging in...');
        const loginData = await post(`${API_URL}/auth/admin/login`, {
            email: 'admin@test.com',
            password: 'password123'
        });
        const token = loginData.accessToken;
        console.log('Login successful, token obtained.');

        // 2. Get Branches
        console.log('Fetching branches...');
        const branchesRes = await get(`${API_URL}/branches`, token);
        const branches = branchesRes.data;
        if (branches.length === 0) {
            console.error('No branches found. Cannot create order.');
            return;
        }
        const branchId = branches[0]._id;
        console.log(`Using branch: ${branches[0].branchName} (${branchId})`);

        // 3. Get Menu Items
        console.log('Fetching menu items...');
        const menuRes = await get(`${API_URL}/menu`, token);
        const menuItems = menuRes.data;
        if (menuItems.length === 0) {
            console.error('No menu items found. Cannot create order.');
            return;
        }
        const menuItem = menuItems[0];
        console.log(`Using menu item: ${menuItem.name} (${menuItem._id})`);

        // 4. Create Order
        console.log('Creating order...');
        const orderData = {
            orderId: `TEST-${Date.now()}`,
            branch: branchId,
            customerInfo: {
                name: 'Test User',
                phone: '1234567890',
                email: 'test@example.com',
                address: '123 Test St'
            },
            items: [{
                menuId: menuItem._id,
                name: menuItem.name,
                price: menuItem.sizes[0].price,
                quantity: 1,
                size: menuItem.sizes[0].size,
                totalPrice: menuItem.sizes[0].price
            }],
            orderType: 'Delivery',
            subtotal: menuItem.sizes[0].price,
            tax: menuItem.sizes[0].price * 0.15,
            deliveryFee: 100,
            total: menuItem.sizes[0].price * 1.15 + 100,
            orderStatus: 'Placed',
            paymentMethod: 'Cash'
        };

        const createOrderRes = await post(`${API_URL}/admin/orders`, orderData, token);

        console.log('Order created successfully!');
        console.log('Order ID:', createOrderRes.data._id);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
};

runTest();
