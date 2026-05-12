/**
 * Wishlist Routes
 * User wishlist management
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Wishlist = require('../models/wishlist');

// Get user's wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.user.id }).sort({ addedAt: -1 });

    res.json({
      success: true,
      data: {
        wishlist,
        count: wishlist.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message,
    });
  }
});

// Check if destination in wishlist
router.get('/check/:destinationId', verifyToken, async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      userId: req.user.id,
      destinationId: req.params.destinationId,
    });

    res.json({
      success: true,
      data: {
        inWishlist: !!item,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: error.message,
    });
  }
});

// Add to wishlist
router.post('/', verifyToken, async (req, res) => {
  try {
    const { destinationId, destinationName, destinationImage, destinationCategory, estimatedBudget, duration } = req.body;

    const existingItem = await Wishlist.findOne({
      userId: req.user.id,
      destinationId,
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Destination already in wishlist',
      });
    }

    const item = await Wishlist.create({
      userId: req.user.id,
      destinationId,
      destinationName,
      destinationImage,
      destinationCategory,
      estimatedBudget,
      duration,
    });

    res.status(201).json({
      success: true,
      message: 'Added to wishlist',
      data: { item },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist',
      error: error.message,
    });
  }
});

// Remove from wishlist
router.delete('/:destinationId', verifyToken, async (req, res) => {
  try {
    const result = await Wishlist.deleteOne({
      userId: req.user.id,
      destinationId: req.params.destinationId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not in wishlist',
      });
    }

    res.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist',
      error: error.message,
    });
  }
});

module.exports = router;
