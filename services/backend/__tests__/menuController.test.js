const menuController = require('../controllers/menuController');
const { query } = require('../config/database');

jest.mock('../config/database', () => ({
    query: jest.fn(),
    pool: { connect: jest.fn() }
}));

describe('Menu Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        query.mockReset();
        query.mockResolvedValue({ rows: [] }); // Default

        req = {
            body: {},
            params: {},
            query: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getFullMenu', () => {
        test('should return all menu items grouped by category', async () => {
            const mockCategories = [{ id: 1, name: 'Tacos' }, { id: 2, name: 'Burritos' }];
            const mockItems = [
                { id: 1, name: 'Taco', category_id: 1, price: 5 },
                { id: 2, name: 'Burrito', category_id: 2, price: 10 }
            ];

            // Mock categories query
            query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Tacos' }] });
            // Mock items query
            query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Taco', category_id: 1 }] });

            await menuController.getFullMenu(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Tacos',
                        items: expect.arrayContaining([expect.objectContaining({ name: 'Taco' })])
                    })
                ])
            }));
        });

        test('should handle database error', async () => {
            query.mockRejectedValue(new Error('DB Error'));
            await menuController.getFullMenu(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMenuItem', () => {
        test('should return a single menu item', async () => {
            req.params.id = 1;
            const mockItem = { id: 1, name: 'Taco' };
            query.mockResolvedValue({ rows: [mockItem] });

            await menuController.getMenuItem(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockItem }));
        });

        test('should return 404 if item not found', async () => {
            req.params.id = 999;
            query.mockResolvedValue({ rows: [] });

            await menuController.getMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('createMenuItem', () => {
        test('should create a new menu item', async () => {
            req.body = { name: 'New Taco', category_id: 1, price: 6, description: 'Tasty' };
            const newItem = { id: 1, ...req.body };
            query.mockResolvedValue({ rows: [newItem] });

            await menuController.createMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: newItem }));
        });
    });

    describe('updateMenuItem', () => {
        test('should update an existing menu item', async () => {
            req.params.id = 1;
            req.body = { name: 'Updated Taco' };
            const updatedItem = { id: 1, name: 'Updated Taco' };
            query.mockResolvedValue({ rows: [updatedItem] });

            await menuController.updateMenuItem(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: updatedItem }));
        });

        test('should return 404 if item to update not found', async () => {
            req.params.id = 999;
            req.body = { name: 'Updated Taco' };
            query.mockResolvedValue({ rows: [] });

            await menuController.updateMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteMenuItem', () => {
        test('should delete a menu item', async () => {
            req.params.id = 1;
            query.mockResolvedValue({ rows: [{ id: 1 }] });

            await menuController.deleteMenuItem(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        test('should return 404 if item to delete not found', async () => {
            req.params.id = 999;
            query.mockResolvedValue({ rows: [] });

            await menuController.deleteMenuItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('createCategory', () => {
        test('should create a new category', async () => {
            req.body = { name: 'New Category', sort_order: 1 };
            const newCategory = { id: 1, ...req.body };
            query.mockResolvedValue({ rows: [newCategory] });

            await menuController.createCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: newCategory }));
        });

        test('should return 400 if name is missing', async () => {
            req.body = {};
            await menuController.createCategory(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('updateCategory', () => {
        test('should update an existing category', async () => {
            req.params.id = 1;
            req.body = { name: 'Updated Category' };
            const updatedCategory = { id: 1, name: 'Updated Category' };
            query.mockResolvedValue({ rows: [updatedCategory] });

            await menuController.updateCategory(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: updatedCategory }));
        });

        test('should return 404 if category to update not found', async () => {
            req.params.id = 999;
            req.body = { name: 'Updated Category' };
            query.mockResolvedValue({ rows: [] });

            await menuController.updateCategory(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getMenuItems', () => {
        test('should return all menu items', async () => {
            const mockItems = [{ id: 1, name: 'Taco' }];
            query.mockResolvedValue({ rows: mockItems });

            await menuController.getMenuItems(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockItems }));
        });

        test('should filter menu items by category', async () => {
            req.query.category_id = 1;
            const mockItems = [{ id: 1, name: 'Taco', category_id: 1 }];
            query.mockResolvedValue({ rows: mockItems });

            await menuController.getMenuItems(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockItems }));
        });

        test('should filter available menu items', async () => {
            req.query.available_only = 'true';
            const mockItems = [{ id: 1, name: 'Taco', is_available: true }];
            query.mockResolvedValue({ rows: mockItems });

            await menuController.getMenuItems(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockItems }));
        });
    });

    describe('getCategories', () => {
        test('should return all categories', async () => {
            const mockCategories = [{ id: 1, name: 'Tacos' }];
            query.mockResolvedValue({ rows: mockCategories });

            await menuController.getCategories(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockCategories }));
        });
    });
});
