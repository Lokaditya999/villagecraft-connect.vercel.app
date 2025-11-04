const express = require('express');
const router = express.Router();
const Product = require('./models/Product');

router.get('/products/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json({ products });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;