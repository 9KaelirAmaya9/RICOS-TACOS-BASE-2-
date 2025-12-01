const {
    getCategories,
    getMenuItems,
    getFullMenu,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createCategory,
    updateCategory
} = require('../../../controllers/menuController');
const { query } = require('../../../config/database');

jest.mock('../../../config/database');

describe('Menu Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getCategories', () => {
        test('should return all categories', async () => {
            const mockCategories = [{ id: 1, name: 'Tacos' }];
            query.mockResolvedValue({ rows: mockCategories });

            await getCategories(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM menu_categories'));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockCategories
            }));
        });

        test('should handle errors', async () => {
            query.mockRejectedValue(new Error('DB Error'));

            await getCategories(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMenuItems', () => {
        test('should return all menu items', async () => {
            const mockItems = [{ id: 1, name: 'Taco' }];
            query.mockResolvedValue({ rows: mockItems });

            await getMenuItems(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT mi.*'), []);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockItems
            }));
        });

        test('should filter by category', async () => {
            req.query = { category_id: 1 };
            query.mockResolvedValue({ rows: [] });

            await getMenuItems(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('AND mi.category_id = $1'), [1]);
        });

        test('should filter by availability', async () => {
            req.query = { available_only: 'true' };
            query.mockResolvedValue({ rows: [] });

            await getMenuItems(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('AND mi.is_available = true'), []);
        });

        test('should return 500 on server error', async () => {
            query.mockRejectedValue(new Error('DB Error'));

            await getMenuItems(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getFullMenu', () => {
        test('should return full menu structure', async () => {
            const mockCategories = [{ id: 1, name: 'Tacos' }];
            const mockItems = [{ id: 101, name: 'Beef Taco', category_id: 1 }];

            query
                .mockResolvedValueOnce({ rows: mockCategories }) // Categories
                .mockResolvedValueOnce({ rows: mockItems }); // Items

            await getFullMenu(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [{
                    id: 1,
                    name: 'Tacos',
                    items: mockItems
                }]
            }));
        });

        test('should return 500 on server error', async () => {
            query.mockRejectedValue(new Error('DB Error'));

            await getFullMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMenuItem', () => {
        test('should return single menu item', async () => {
            req.params = { id: 1 };
            const mockItem = { id: 1, name: 'Taco' };
            query.mockResolvedValue({ rows: [mockItem] });

            await getMenuItem(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockItem
            }));
        });

        test('should return 404 if item not found', async () => {
            req.params = { id: 999 };
            query.mockResolvedValue({ rows: [] });

            await getMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            query.mockRejectedValue(new Error('DB Error'));

            await getMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('createMenuItem', () => {
        test('should create menu item', async () => {
            req.body = { name: 'New Taco', price: 10, category_id: 1 };
            const mockItem = { id: 1, ...req.body };
            query.mockResolvedValue({ rows: [mockItem] });

            await createMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockItem
            }));
        });

        test('should return 400 for missing fields', async () => {
            req.body = { name: 'Taco' }; // Missing price and category

            await createMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 500 on server error', async () => {
            req.body = { name: 'New Taco', price: 10, category_id: 1 };
            query.mockRejectedValue(new Error('DB Error'));

            await createMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateMenuItem', () => {
        test('should update menu item', async () => {
            req.params = { id: 1 };
            req.body = { name: 'Updated Taco' };
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Check exists
            query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated Taco' }] }); // Update

            await updateMenuItem(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE menu_items SET'), expect.any(Array));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Menu item updated successfully'
            }));
        });

        test('should update all fields', async () => {
            req.params = { id: 1 };
            req.body = {
                name: 'Taco',
                description: 'Desc',
                price: 10,
                category_id: 2,
                is_available: false,
                is_special: true,
                image_url: 'http://img.com'
            };
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            query.mockResolvedValueOnce({ rows: [{ id: 1, ...req.body }] });

            await updateMenuItem(req, res);

            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('name = $1, description = $2, price = $3, category_id = $4, is_available = $5, is_special = $6, image_url = $7'),
                expect.any(Array)
            );
        });

        test('should return 404 if item not found', async () => {
            req.params = { id: 999 };
            req.body = { name: 'Updated Taco' };
            query.mockResolvedValueOnce({ rows: [] });

            await updateMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 400 if no fields to update', async () => {
            req.params = { id: 1 };
            req.body = {}; // No fields
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            await updateMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            req.body = { name: 'Updated Taco' };
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            query.mockRejectedValue(new Error('DB Error'));

            await updateMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteMenuItem', () => {
        test('should delete menu item', async () => {
            req.params = { id: 1 };
            query.mockResolvedValue({ rows: [{ id: 1 }] });

            await deleteMenuItem(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Menu item deleted successfully'
            }));
        });

        test('should return 404 if item not found', async () => {
            req.params = { id: 999 };
            query.mockResolvedValue({ rows: [] });

            await deleteMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            query.mockRejectedValue(new Error('DB Error'));

            await deleteMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('createCategory', () => {
        test('should create category', async () => {
            req.body = { name: 'New Category' };
            const mockCategory = { id: 1, name: 'New Category' };
            query.mockResolvedValue({ rows: [mockCategory] });

            await createCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockCategory
            }));
        });

        test('should return 400 if name is missing', async () => {
            req.body = {};

            await createCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 500 on server error', async () => {
            req.body = { name: 'New Category' };
            query.mockRejectedValue(new Error('DB Error'));

            await createCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateCategory', () => {
        test('should update category', async () => {
            req.params = { id: 1 };
            req.body = { name: 'Updated Category' };
            query.mockResolvedValue({ rows: [{ id: 1, name: 'Updated Category' }] });

            await updateCategory(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Category updated successfully'
            }));
        });

        test('should update sort_order', async () => {
            req.params = { id: 1 };
            req.body = { sort_order: 5 };
            query.mockResolvedValue({ rows: [{ id: 1, sort_order: 5 }] });

            await updateCategory(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('sort_order = $1'), expect.any(Array));
        });

        test('should return 400 if no fields to update', async () => {
            req.params = { id: 1 };
            req.body = {};

            await updateCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 404 if category not found', async () => {
            req.params = { id: 999 };
            req.body = { name: 'Updated Category' };
            query.mockResolvedValue({ rows: [] });

            await updateCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 500 on server error', async () => {
            req.params = { id: 1 };
            req.body = { name: 'Updated Category' };
            query.mockRejectedValue(new Error('DB Error'));

            await updateCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
