/**
 * Wishlist Model
 * Tracks user wishlist items
 */

const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  destinationId: {
    type: String,
    required: true,
  },
  destinationName: String,
  destinationImage: String,
  destinationCategory: String,
  estimatedBudget: Number,
  duration: Number,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique constraint - user can only wishlist a destination once
wishlistSchema.index({ userId: 1, destinationId: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
