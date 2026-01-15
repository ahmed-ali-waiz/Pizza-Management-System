import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../store/slices/menuSlice';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Menu = () => {
    const dispatch = useDispatch();
    const { menuItems, isLoading } = useSelector((state) => state.menu);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [formData, setFormData] = useState({
        category: 'Pizza',
        name: '',
        description: '',
        ingredients: [],
        sizes: [
            { size: 'Small', price: 0 },
            { size: 'Medium', price: 0 },
            { size: 'Large', price: 0 }
        ],
        addons: [],
        isAvailable: true,
        image: '',
        tags: []
    });

    useEffect(() => {
        dispatch(getMenuItems());
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const menuData = {
                ...formData,
                ingredients: formData.ingredients.filter(i => i.trim() !== ''),
                sizes: formData.sizes.filter(s => s.price > 0),
                addons: formData.addons.filter(a => a.name && a.price > 0)
            };

            if (editingItem) {
                await dispatch(updateMenuItem({ id: editingItem._id, menuData })).unwrap();
                toast.success('Menu item updated successfully');
            } else {
                await dispatch(createMenuItem(menuData)).unwrap();
                toast.success('Menu item created successfully');
            }
            handleCloseModal();
        } catch (error) {
            toast.error(error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                await dispatch(deleteMenuItem(id)).unwrap();
                toast.success('Menu item deleted successfully');
            } catch (error) {
                toast.error(error || 'Failed to delete menu item');
            }
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            category: item.category,
            name: item.name,
            description: item.description,
            ingredients: item.ingredients || [],
            sizes: item.sizes.length > 0 ? item.sizes : [
                { size: 'Small', price: 0 },
                { size: 'Medium', price: 0 },
                { size: 'Large', price: 0 }
            ],
            addons: item.addons || [],
            isAvailable: item.isAvailable,
            image: item.image || '',
            tags: item.tags || []
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            category: 'Pizza',
            name: '',
            description: '',
            ingredients: [],
            sizes: [
                { size: 'Small', price: 0 },
                { size: 'Medium', price: 0 },
                { size: 'Large', price: 0 }
            ],
            addons: [],
            isAvailable: true,
            image: '',
            tags: []
        });
    };

    const handleIngredientChange = (index, value) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = value;
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const addIngredient = () => {
        setFormData({ ...formData, ingredients: [...formData.ingredients, ''] });
    };

    const removeIngredient = (index) => {
        const newIngredients = formData.ingredients.filter((_, i) => i !== index);
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const handleSizeChange = (index, field, value) => {
        const newSizes = [...formData.sizes];
        newSizes[index][field] = field === 'price' ? parseFloat(value) || 0 : value;
        setFormData({ ...formData, sizes: newSizes });
    };

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        if (!newAddons[index]) {
            newAddons[index] = { name: '', price: 0 };
        }
        newAddons[index][field] = field === 'price' ? parseFloat(value) || 0 : value;
        setFormData({ ...formData, addons: newAddons });
    };

    const addAddon = () => {
        setFormData({ ...formData, addons: [...formData.addons, { name: '', price: 0 }] });
    };

    const removeAddon = (index) => {
        const newAddons = formData.addons.filter((_, i) => i !== index);
        setFormData({ ...formData, addons: newAddons });
    };

    const handleTagToggle = (tag) => {
        const newTags = formData.tags.includes(tag)
            ? formData.tags.filter(t => t !== tag)
            : [...formData.tags, tag];
        setFormData({ ...formData, tags: newTags });
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const columns = [
        {
            header: 'Image',
            cell: (row) => (
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                    <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
                </div>
            )
        },
        { header: 'Name', accessor: 'name' },
        {
            header: 'Category',
            cell: (row) => (
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    {row.category}
                </span>
            )
        },
        {
            header: 'Price Range',
            cell: (row) => {
                const prices = row.sizes.map(s => s.price);
                return `Rs ${Math.min(...prices)} - Rs ${Math.max(...prices)}`;
            }
        },
        {
            header: 'Tags',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {tag}
                        </span>
                    ))}
                    {row.tags.length > 2 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            +{row.tags.length - 2}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Status',
            cell: (row) => (
                <span className={`px-2 py-1 text-xs rounded-full ${row.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                    {row.isAvailable ? 'Available' : 'Unavailable'}
                </span>
            )
        },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                        onClick={() => handleDelete(row._id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                </div>
            )
        }
    ];

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner size="large" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your pizza menu items</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Menu Item</span>
                </button>
            </div>

            <div className="flex space-x-4">
                {['All', 'Pizza', 'Drinks', 'Deals', 'Sides'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-4 py-2 rounded-lg ${categoryFilter === cat
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <DataTable
                columns={columns}
                data={filteredItems}
                onSearch={setSearchTerm}
                searchPlaceholder="Search menu items..."
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                size="large"
            >
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="Pizza">Pizza</option>
                                <option value="Drinks">Drinks</option>
                                <option value="Deals">Deals</option>
                                <option value="Sides">Sides</option>
                            </select>
                        </div>
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            rows="3"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                placeholder="https://example.com/image.jpg"
                            />
                            <button type="button" className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                                <ImageIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ingredients</label>
                        <div className="space-y-2">
                            {formData.ingredients.map((ingredient, index) => (
                                <div key={index} className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={ingredient}
                                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        placeholder="Ingredient name"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeIngredient(index)}
                                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addIngredient}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                            >
                                + Add Ingredient
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sizes & Prices</label>
                        <div className="space-y-2">
                            {formData.sizes.map((size, index) => (
                                <div key={index} className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={size.size}
                                        onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        placeholder="Size"
                                    />
                                    <input
                                        type="number"
                                        value={size.price}
                                        onChange={(e) => handleSizeChange(index, 'price', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        placeholder="Price"
                                        min="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add-ons</label>
                        <div className="space-y-2">
                            {formData.addons.map((addon, index) => (
                                <div key={index} className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={addon.name}
                                        onChange={(e) => handleAddonChange(index, 'name', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        placeholder="Add-on name"
                                    />
                                    <input
                                        type="number"
                                        value={addon.price}
                                        onChange={(e) => handleAddonChange(index, 'price', e.target.value)}
                                        className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        placeholder="Price"
                                        min="0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAddon(index)}
                                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addAddon}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                            >
                                + Add Add-on
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {['Spicy', 'Special', 'New', 'Bestseller', 'Vegetarian', 'NonVeg'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1 rounded-full text-sm ${formData.tags.includes(tag)
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.isAvailable}
                            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available for Order</label>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                            {editingItem ? 'Update' : 'Create'} Menu Item
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Menu;