const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5500;

app.use(bodyParser.json());
app.use(express.static('public'));

// Пути к файлам данных
const dataDir = path.join(__dirname, 'data');
const goodsFilePath = path.join(dataDir, 'goods.json');
const usersFilePath = path.join(dataDir, 'users.json');
const ordersFilePath = path.join(dataDir, 'orders.json');
const reviewsFilePath = path.join(dataDir, 'reviews.json');

// Создаем папку data если её нет
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Инициализация файлов если они не существуют
[goodsFilePath, usersFilePath, ordersFilePath, reviewsFilePath].forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '[]');
    }
});

// Простая аутентификация через сессии
const sessions = {};

// Middleware для проверки аутентификации
const authenticateUser = (req, res, next) => {
    const sessionId = req.headers['session-id'];
    if (!sessionId || !sessions[sessionId]) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    req.user = sessions[sessionId];
    next();
};

// Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        console.log(fs.readFile(usersFilePath));
        const users = JSON.parse(fs.readFile(usersFilePath));
        
        if (users.some(user => user.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length + 1,
            email,
            password: hashedPassword,
            name,
            role: 'user',
            cart: []
        };

        users.push(newUser);
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

        // Создаем сессию
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        sessions[sessionId] = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
        };
        
        res.status(201).json({ 
            sessionId,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Аутентификация пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const users = JSON.parse(fs.readFileSync(usersFilePath));
        const user = users.find(user => user.email === email);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Создаем сессию
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        sessions[sessionId] = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };
        
        res.json({ 
            sessionId,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Выход пользователя
app.post('/api/auth/logout', (req, res) => {
    const sessionId = req.headers['session-id'];
    if (sessionId && sessions[sessionId]) {
        delete sessions[sessionId];
    }
    res.json({ message: 'Logged out successfully' });
});

// Получение информации о пользователе
app.get('/api/auth/user', authenticateUser, (req, res) => {
    res.json(req.user);
});

// Получение всех товаров
app.get('/api/goods', (req, res) => {
    fs.readFile(goodsFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Ошибка чтения файла');
        res.json(JSON.parse(data));
    });
});

// Управление корзиной пользователя
app.get('/api/cart', authenticateUser, (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFilePath));
    const user = users.find(u => u.id === req.user.id);
    res.json(user.cart);
});

app.post('/api/cart', authenticateUser, (req, res) => {
    const { productId, quantity = 1 } = req.body;
    
    const users = JSON.parse(fs.readFileSync(usersFilePath));
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    
    // Проверяем есть ли товар в корзине
    const cartItemIndex = users[userIndex].cart.findIndex(item => item.productId === productId);
    
    if (cartItemIndex !== -1) {
        // Увеличиваем количество
        users[userIndex].cart[cartItemIndex].quantity += quantity;
    } else {
        // Добавляем новый товар
        users[userIndex].cart.push({ productId, quantity });
    }
    
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.json(users[userIndex].cart);
});

app.delete('/api/cart/:productId', authenticateUser, (req, res) => {
    const productId = parseInt(req.params.productId);
    
    const users = JSON.parse(fs.readFileSync(usersFilePath));
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
    
    users[userIndex].cart = users[userIndex].cart.filter(item => item.productId !== productId);
    
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    res.json(users[userIndex].cart);
});

// Создание платежа через Stripe
app.post('/api/create-payment-intent', authenticateUser, async (req, res) => {
    const { amount, currency = 'usd' } = req.body;
    
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe использует центы
            currency,
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создание заказа
app.post('/api/orders', authenticateUser, async (req, res) => {
    const { paymentMethodId, shippingAddress } = req.body;
    
    try {
        const users = JSON.parse(fs.readFileSync(usersFilePath));
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const goods = JSON.parse(fs.readFileSync(goodsFilePath));
        const cartItems = user.cart.map(item => {
            const product = goods.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
                name: product.name
            };
        });
        
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // В реальном приложении здесь была бы интеграция с платежной системой
        // Для демонстрации просто создаем заказ
        
        const orders = JSON.parse(fs.readFileSync(ordersFilePath) || '[]');
        const newOrder = {
            id: orders.length + 1,
            userId: user.id,
            items: cartItems,
            totalAmount,
            shippingAddress,
            status: 'paid',
            createdAt: new Date().toISOString()
        };
        
        orders.push(newOrder);
        fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
        
        // Очищаем корзину пользователя
        user.cart = [];
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ message: 'Error creating order' });
    }
});

// Получение заказов пользователя
app.get('/api/orders', authenticateUser, (req, res) => {
    const orders = JSON.parse(fs.readFileSync(ordersFilePath) || '[]');
    const userOrders = orders.filter(order => order.userId === req.user.id);
    res.json(userOrders);
});

// Управление отзывами
app.get('/api/reviews/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    
    const reviews = JSON.parse(fs.readFileSync(reviewsFilePath) || '[]');
    const productReviews = reviews.filter(review => review.productId === productId);
    
    res.json(productReviews);
});

app.post('/api/reviews', authenticateUser, (req, res) => {
    const { productId, rating, comment } = req.body;
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const reviews = JSON.parse(fs.readFileSync(reviewsFilePath) || '[]');
    const newReview = {
        id: reviews.length + 1,
        productId,
        userId: req.user.id,
        rating,
        comment,
        createdAt: new Date().toISOString()
    };
    
    reviews.push(newReview);
    fs.writeFileSync(reviewsFilePath, JSON.stringify(reviews, null, 2));
    
    res.status(201).json(newReview);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});