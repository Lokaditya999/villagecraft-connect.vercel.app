require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key';

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend files
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/villagecraft',
        ttl: 24 * 60 * 60 // 24 hours
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
    }
}));

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/villagecraft';

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    type: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Product Schema (if not already defined)
const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    description: String,
    price: Number,
    image: String,
    stock: Number
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true },
        name: String,
        image: String
    }],
    total: { type: Number, default: 0 }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');

    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('No products found. Seeding...');
      try {
        const seedData = require('./seed/seedproduct');
        await Product.insertMany(seedData.products);
        console.log('24 products seeded successfully!');
      } catch (err) {
        console.error('Seed failed:', err);
      }
    }
  })
  .catch(err => console.error('DB Error:', err));

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Not authenticated. Please login again.'
        });
    }
};

// Check session endpoint
app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            success: true,
            user: {
                id: req.session.userId,
                name: req.session.name,
                email: req.session.email,
                type: req.session.type
            }
        });
    } else {
        res.json({
            success: false,
            message: 'No active session'
        });
    }
});

// Register Route - Saves to Database
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, type } = req.body;

        console.log('📝 Registration attempt:', { name, email, type });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            type
        });

        // Save to database
        await newUser.save();

        // Generate token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ User saved to database:', newUser._id);

        res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                type: newUser.type
            }
        });

    } catch (error) {
        console.error('💥 Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Login Route with Session
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user in database
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Create session
        req.session.userId = user._id;
        req.session.name = user.name;
        req.session.email = user.email;
        req.session.type = user.type;
        req.session.loggedIn = true;

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ User logged in:', user.email, 'Session ID:', req.sessionID);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                type: user.type
            }
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Logout Route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
        
        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
});

// Auto-logout endpoint (for session timeout)
app.post('/api/auto-logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Auto-logout error:', err);
        }
        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'Auto-logged out due to browser closure'
        });
    });
});

// Cart Routes

// Add to cart route
app.post('/api/cart/add', requireAuth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find user's cart or create new one
        let cart = await Cart.findOne({ userId: req.session.userId });
        
        if (!cart) {
            cart = new Cart({
                userId: req.session.userId,
                items: [],
                total: 0
            });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity if product exists
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.items.push({
                productId: product._id,
                quantity: quantity,
                price: product.price,
                name: product.name,
                image: product.image
            });
        }

        // Calculate total
        cart.total = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        res.json({
            success: true,
            message: 'Product added to cart',
            cart: cart
        });

    } catch (error) {
        console.error('💥 Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update cart item quantity
app.put('/api/cart/update', requireAuth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                cart.items.splice(itemIndex, 1);
            } else {
                // Update quantity
                cart.items[itemIndex].quantity = quantity;
            }

            // Recalculate total
            cart.total = cart.items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            await cart.save();

            res.json({
                success: true,
                message: 'Cart updated',
                cart: cart
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

    } catch (error) {
        console.error('💥 Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Remove item from cart
app.delete('/api/cart/remove', requireAuth, async (req, res) => {
    try {
        const { productId } = req.body;
        
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(item => 
            item.productId.toString() !== productId
        );

        // Recalculate total
        cart.total = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart: cart
        });

    } catch (error) {
        console.error('💥 Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get cart items
app.get('/api/cart', requireAuth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate('items.productId');
        
        if (!cart) {
            return res.json({
                success: true,
                cart: { items: [], total: 0 }
            });
        }

        res.json({
            success: true,
            cart: cart
        });

    } catch (error) {
        console.error('💥 Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Clear cart
app.delete('/api/cart/clear', requireAuth, async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.session.userId });
        
        res.json({
            success: true,
            message: 'Cart cleared'
        });

    } catch (error) {
        console.error('💥 Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error('💥 Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'cart.html'));
});

app.get('/products/:category', async (req, res) => {
  try {
    const prods = await Product.find({ category: req.params.category });
    res.json({ products: prods });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/index1.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index1.html'));
});

app.get('/index2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
});

app.get('/index3.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index3.html'));
});

app.get('/index4.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index4.html'));
});

// Dashboard route with session check
app.get('/dashboard', (req, res) => {
    if (req.session && req.session.userId) {
        res.sendFile(path.join(__dirname, 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API Routes:`);
    console.log(`   POST /register - Save user to database`);
    console.log(`   POST /login - Login user`);
    console.log(`   POST /logout - Logout user`);
    console.log(`   GET /api/check-session - Check user session`);
    console.log(`   POST /api/auto-logout - Auto logout endpoint`);
    console.log(`   POST /api/cart/add - Add to cart`);
    console.log(`   PUT /api/cart/update - Update cart quantity`);
    console.log(`   DELETE /api/cart/remove - Remove from cart`);
    console.log(`   GET /api/cart - Get cart items`);
    console.log(`   GET /cart - Cart page`);
});