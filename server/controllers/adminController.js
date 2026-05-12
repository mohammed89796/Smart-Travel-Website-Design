/**
 * Admin Controller
 * Handles all admin dashboard operations including CRUD for destinations,
 * packages, bookings, users, and reviews with role-based access control.
 */

const bcrypt = require('bcryptjs');
const {
  Destination,
  Booking,
  User,
  Review,
  Itinerary,
  TravelPlan,
  Admin,
  AuditLog,
} = require('../models');
const { auditLog } = require('../middleware');
const TravelPlanModel = TravelPlan || Destination;

// ============================================================================
// DESTINATION MANAGEMENT (AD-FR-04 to AD-FR-08)
// ============================================================================

/**
 * Create a new destination
 * AD-FR-04: Create Destination
 */
const createDestination = async (req, res) => {
  try {
    const {
      name,
      description,
      country,
      region,
      category,
      climate,
      bestSeason,
      image,
      attractions,
    } = req.body;

    // Validation
    if (!name || !description || !country) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and country are required',
      });
    }

    // Check for duplicate
    const existing = await Destination.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Destination with this name already exists',
      });
    }

    const destination = await Destination.create({
      name,
      description,
      country,
      region: region || '',
      category: category || 'cultural',
      climate: climate || 'temperate',
      bestSeason: bestSeason || '',
      image: image || '',
      attractions: attractions || [],
    });

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'create',
      'destination',
      destination._id,
      { action: 'Created destination', name },
      'success',
      req
    );

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: { destination },
    });
  } catch (error) {
    console.error('Create destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create destination',
      error: error.message,
    });
  }
};

/**
 * Get all destinations with pagination and filters
 * AD-FR-05: Read Destinations
 */
const getDestinations = async (req, res) => {
  try {
    const { page = 1, limit = 20, country, category, climate, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { isActive: true };

    if (country) query.country = country;
    if (category) query.category = category;
    if (climate) query.climate = climate;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Destination.countDocuments(query);
    const destinations = await Destination.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Add related packages count for each destination
    const destinationsWithCounts = await Promise.all(
      destinations.map(async (dest) => {
        const packageCount = await TravelPlanModel.countDocuments({
          destinations: { $in: [dest.name] },
        });
        return { ...dest.toObject(), relatedPackagesCount: packageCount };
      })
    );

    res.json({
      success: true,
      message: 'Destinations retrieved successfully',
      data: {
        destinations: destinationsWithCounts,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch destinations',
      error: error.message,
    });
  }
};

/**
 * Get single destination by ID
 * Part of AD-FR-05: Read Destinations
 */
const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;

    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    // Get related packages
    const relatedPackages = await TravelPlanModel.find({
      destinations: { $in: [destination.name] },
    });

    res.json({
      success: true,
      message: 'Destination retrieved successfully',
      data: {
        destination: { ...destination.toObject(), relatedPackages },
      },
    });
  } catch (error) {
    console.error('Get destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch destination',
      error: error.message,
    });
  }
};

/**
 * Update destination by ID
 * AD-FR-06: Update Destination
 */
const updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating _id
    delete updates._id;

    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    // Track changes for audit
    const changes = {};
    Object.keys(updates).forEach((key) => {
      if (destination[key] !== updates[key]) {
        changes[key] = `${destination[key]} → ${updates[key]}`;
      }
    });

    const updatedDestination = await Destination.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'update',
      'destination',
      id,
      changes,
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Destination updated successfully',
      data: { destination: updatedDestination },
    });
  } catch (error) {
    console.error('Update destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update destination',
      error: error.message,
    });
  }
};

/**
 * Delete destination (soft delete)
 * AD-FR-07: Delete Destination
 */
const deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;

    const destination = await Destination.findById(id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    // Check for active packages
    const activePackages = await TravelPlanModel.countDocuments({
      destinations: { $in: [destination.name] },
    });

    if (activePackages > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete destination with ${activePackages} active packages`,
      });
    }

    // Soft delete
    const deletedDestination = await Destination.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'delete',
      'destination',
      id,
      { action: 'Soft deleted destination', name: destination.name },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Destination deleted successfully',
      data: { destination: deletedDestination },
    });
  } catch (error) {
    console.error('Delete destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete destination',
      error: error.message,
    });
  }
};

// ============================================================================
// TRAVEL PACKAGE MANAGEMENT (AD-FR-09 to AD-FR-13)
// ============================================================================

/**
 * Create a new travel package
 * AD-FR-09: Create Travel Package
 */
const createTravelPackage = async (req, res) => {
  try {
    const {
      name,
      description,
      destinations,
      duration,
      price,
      category,
      highlights,
      image,
      included,
    } = req.body;

    // Validation
    if (!name || !description || !destinations || !duration || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, destinations, duration, and price are required',
      });
    }

    if (price < 100) {
      return res.status(400).json({
        success: false,
        message: 'Price must be at least 100',
      });
    }

    const travelPackage = await TravelPlanModel.create({
      name,
      description,
      destinations: Array.isArray(destinations) ? destinations : [destinations],
      duration: parseInt(duration),
      price: parseFloat(price),
      category: category || 'cultural',
      highlights: highlights || [],
      image: image || '',
      included: included || [],
    });

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'create',
      'package',
      travelPackage._id,
      { action: 'Created travel package', name },
      'success',
      req
    );

    res.status(201).json({
      success: true,
      message: 'Travel package created successfully',
      data: { travelPackage },
    });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create travel package',
      error: error.message,
    });
  }
};

/**
 * Get all travel packages with filters and pagination
 * AD-FR-10: Read Travel Packages
 */
const getTravelPackages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      destination,
      category,
      priceMin,
      priceMax,
      durationMin,
      durationMax,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (destination) {
      query.destinations = { $in: [destination] };
    }
    if (category) {
      query.category = category;
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }
    if (durationMin || durationMax) {
      query.duration = {};
      if (durationMin) query.duration.$gte = parseInt(durationMin);
      if (durationMax) query.duration.$lte = parseInt(durationMax);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await TravelPlanModel.countDocuments(query);
    const packages = await TravelPlanModel.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1, price: 1, name: 1 });

    // Add booking count for each package
    const packagesWithCounts = await Promise.all(
      packages.map(async (pkg) => {
        const bookingCount = await Booking.countDocuments({
          packageId: pkg._id,
          status: { $in: ['confirmed', 'completed'] },
        });
        return { ...pkg.toObject(), bookingCount };
      })
    );

    res.json({
      success: true,
      message: 'Travel packages retrieved successfully',
      data: {
        packages: packagesWithCounts,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel packages',
      error: error.message,
    });
  }
};

/**
 * Get single travel package by ID
 * Part of AD-FR-10: Read Travel Packages
 */
const getTravelPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const travelPackage = await TravelPlanModel.findById(id);
    if (!travelPackage) {
      return res.status(404).json({
        success: false,
        message: 'Travel package not found',
      });
    }

    const bookingCount = await Booking.countDocuments({
      packageId: id,
      status: { $in: ['confirmed', 'completed'] },
    });

    res.json({
      success: true,
      message: 'Travel package retrieved successfully',
      data: { travelPackage: { ...travelPackage.toObject(), bookingCount } },
    });
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel package',
      error: error.message,
    });
  }
};

/**
 * Update travel package by ID
 * AD-FR-11: Update Travel Package
 */
const updateTravelPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow certain fields to be updated without restrictions
    delete updates._id;

    const travelPackage = await TravelPlanModel.findById(id);
    if (!travelPackage) {
      return res.status(404).json({
        success: false,
        message: 'Travel package not found',
      });
    }

    // Track changes
    const changes = {};
    Object.keys(updates).forEach((key) => {
      if (JSON.stringify(travelPackage[key]) !== JSON.stringify(updates[key])) {
        changes[key] = `${JSON.stringify(travelPackage[key])} → ${JSON.stringify(
          updates[key]
        )}`;
      }
    });

    const updatedPackage = await TravelPlanModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'update',
      'package',
      id,
      changes,
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Travel package updated successfully',
      data: { travelPackage: updatedPackage },
    });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update travel package',
      error: error.message,
    });
  }
};

/**
 * Delete travel package
 * AD-FR-12: Delete Travel Package
 */
const deleteTravelPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const travelPackage = await TravelPlanModel.findById(id);
    if (!travelPackage) {
      return res.status(404).json({
        success: false,
        message: 'Travel package not found',
      });
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      packageId: id,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBookings > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete package with ${activeBookings} active bookings`,
      });
    }

    // Soft delete
    await TravelPlanModel.findByIdAndRemove(id);

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'delete',
      'package',
      id,
      { action: 'Deleted package', name: travelPackage.name },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Travel package deleted successfully',
    });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete travel package',
      error: error.message,
    });
  }
};

// ============================================================================
// BOOKING MANAGEMENT (AD-FR-14 to AD-FR-17)
// ============================================================================

/**
 * Get all bookings with filters and pagination
 * AD-FR-14: View Bookings
 */
const getBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      packageId,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (packageId) query.packageId = packageId;

    if (dateFrom || dateTo) {
      query.departureDate = {};
      if (dateFrom) query.departureDate.$gte = new Date(dateFrom);
      if (dateTo) query.departureDate.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { packageName: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Enrich with user details
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const user = await User.findById(booking.userId);
        return {
          ...booking.toObject(),
          userEmail: user?.email || 'Unknown',
          userName: user?.name || 'Unknown',
        };
      })
    );

    res.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings: bookingsWithDetails,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

/**
 * Get single booking by ID
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Get user and package details
    const user = await User.findById(booking.userId);
    const travelPackage = await TravelPlanModel.findById(booking.packageId);

    res.json({
      success: true,
      message: 'Booking retrieved successfully',
      data: {
        booking: {
          ...booking.toObject(),
          userDetails: user,
          packageDetails: travelPackage,
        },
      },
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message,
    });
  }
};

/**
 * Update booking status
 * AD-FR-15: Booking Status Management & AD-FR-17: Booking Cancellation
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, refundAmount } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const oldStatus = booking.status;
    const updateData = { status };

    if (status === 'cancelled') {
      updateData.cancellationReason = reason || '';
      updateData.cancelledAt = new Date();
      updateData.refundAmount = refundAmount || booking.totalPrice * 0.8; // Default 80% refund
      updateData.paymentStatus = 'refunded';
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'update',
      'booking',
      id,
      {
        statusChange: `${oldStatus} → ${status}`,
        reason,
        refundAmount: updateData.refundAmount,
      },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message,
    });
  }
};

// ============================================================================
// USER MANAGEMENT (AD-FR-18 to AD-FR-21)
// ============================================================================

/**
 * Get all users with pagination and filtering
 * AD-FR-18: View All Users
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query, { password: 0 })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ [sortBy]: -1 });

    // Add activity metrics
    const usersWithMetrics = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({ userId: user._id });
        const totalSpent = await Booking.aggregate([
          { $match: { userId: user._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);

        return {
          ...user.toObject(),
          bookingCount,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: usersWithMetrics,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

/**
 * Get single user with detailed activity
 * AD-FR-19: User Details & Activity
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id, { password: 0 });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user bookings
    const bookings = await Booking.find({ userId: id }).sort({
      createdAt: -1,
    });

    // Get user reviews
    const reviews = await Review.find({ userId: id }).sort({
      createdAt: -1,
    });

    // Calculate metrics
    const totalSpent = bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: {
        user: user.toObject(),
        bookings,
        reviews,
        metrics: {
          totalBookings: bookings.length,
          totalSpent,
          totalReviews: reviews.length,
          lastLogin: user.createdAt, // Could be enhanced with lastLogin field
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

/**
 * Delete user account and related records
 * AD-FR-21: Delete User
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id, { password: 0 });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove user-owned records first to avoid orphaned data.
    const [deletedBookingsResult, deletedReviewsResult, deletedPlansResult] =
      await Promise.all([
        Booking.deleteMany({ $or: [{ userId: id }, { user_id: id }] }),
        Review.deleteMany({ $or: [{ userId: id }, { user_id: id }] }),
        Itinerary.deleteMany({ user_id: id }),
      ]);

    await User.findByIdAndDelete(id);

    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'delete',
      'user',
      id,
      {
        deletedUserEmail: user.email,
        deletedUserName: user.name,
        deletedBookings: deletedBookingsResult.deletedCount || 0,
        deletedReviews: deletedReviewsResult.deletedCount || 0,
        deletedPlans: deletedPlansResult.deletedCount || 0,
      },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUserId: id,
        deletedBookings: deletedBookingsResult.deletedCount || 0,
        deletedReviews: deletedReviewsResult.deletedCount || 0,
        deletedPlans: deletedPlansResult.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

// ============================================================================
// REVIEW MANAGEMENT (AD-FR-22 to AD-FR-25)
// ============================================================================

/**
 * Get all reviews with filtering and pagination
 * AD-FR-22: View All Reviews
 */
const getReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      packageId,
      rating,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (status) query.status = status;
    if (packageId) query.packageId = packageId;
    if (rating) query.rating = parseInt(rating);

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: {
        reviews,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
  }
};

/**
 * Get single review by ID
 */
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      message: 'Review retrieved successfully',
      data: { review },
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message,
    });
  }
};

/**
 * Update review status and add admin response
 * AD-FR-23: Review Moderation & AD-FR-24: Review Response
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
      updateData.respondedBy = req.admin.adminId;
      updateData.respondedAt = new Date();
    }

    const updatedReview = await Review.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'update',
      'review',
      id,
      { status, hasAdminResponse: !!adminResponse },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview },
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

/**
 * Delete review
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    await Review.findByIdAndRemove(id);

    // Audit log
    await auditLog(
      req.admin.adminId,
      req.admin.email,
      'delete',
      'review',
      id,
      { reviewTitle: review.title },
      'success',
      req
    );

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

// ============================================================================
// DASHBOARD STATISTICS (AD-FR-26 to AD-FR-29)
// ============================================================================

/**
 * Get dashboard statistics
 * AD-FR-26: Dashboard Statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDestinations = await Destination.countDocuments({ isActive: true });
    const totalPackages = await TravelPlanModel.countDocuments();

    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    // Calculate revenue
    const revenueData = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Get pending bookings
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Get pending reviews
    const pendingReviews = await Review.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        statistics: {
          totalUsers,
          totalDestinations,
          totalPackages,
          totalBookings,
          completedBookings,
          pendingBookings,
          totalRevenue,
          pendingReviews,
          systemUptime: '99.9%', // Can be calculated from server uptime
        },
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

/**
 * Get revenue analytics
 * AD-FR-27: Revenue Analytics
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query; // daily, monthly, yearly

    let groupBy;
    if (period === 'daily') {
      groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (period === 'monthly') {
      groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else {
      groupBy = { $dateToString: { format: '%Y', date: '$createdAt' } };
    }

    const revenueByPeriod = await Booking.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Refunds
    const refundData = await Booking.aggregate([
      { $match: { status: 'cancelled' } },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: '$refundAmount' },
          refundCount: { $sum: 1 },
        },
      },
    ]);

    // Revenue by package
    const revenueByPackage = await Booking.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$packageName',
          revenue: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      message: 'Revenue analytics retrieved successfully',
      data: {
        revenueByPeriod,
        refunds: refundData[0] || { totalRefunds: 0, refundCount: 0 },
        topPackagesByRevenue: revenueByPackage,
      },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message,
    });
  }
};

/**
 * Get booking analytics
 * AD-FR-28: Booking Analytics
 */
const getBookingAnalytics = async (req, res) => {
  try {
    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Most popular packages
    const mostPopularPackages = await Booking.aggregate([
      {
        $group: {
          _id: '$packageName',
          bookingCount: { $sum: 1 },
          destination: { $first: '$destination' },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
    ]);

    // Cancellation rate
    const totalBookings = await Booking.countDocuments();
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const cancellationRate =
      totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(2) : 0;

    // Average booking value
    const avgData = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$totalPrice' },
        },
      },
    ]);
    const avgBookingValue = avgData[0]?.avgValue || 0;

    res.json({
      success: true,
      message: 'Booking analytics retrieved successfully',
      data: {
        bookingsByStatus,
        mostPopularPackages,
        cancellationRate: `${cancellationRate}%`,
        averageBookingValue: avgBookingValue.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking analytics',
      error: error.message,
    });
  }
};

/**
 * Get user analytics
 * AD-FR-29: User Analytics
 */
const getUserAnalytics = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // New users by month
    const newUsersByMonth = await User.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Most active users
    const mostActiveUsers = await Booking.aggregate([
      {
        $group: {
          _id: '$userId',
          bookingCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
    ]);

    // Enrich user data
    const enrichedActiveUsers = await Promise.all(
      mostActiveUsers.map(async (record) => {
        const user = await User.findById(record._id, { name: 1, email: 1 });
        return {
          userId: record._id,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'Unknown',
          bookingCount: record.bookingCount,
          totalSpent: record.totalSpent.toFixed(2),
        };
      })
    );

    // Total users
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      message: 'User analytics retrieved successfully',
      data: {
        newUsersByMonth,
        mostActiveUsers: enrichedActiveUsers,
        totalUsers,
      },
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message,
    });
  }
};

// ============================================================================
// AUDIT LOG MANAGEMENT
// ============================================================================

/**
 * Get audit logs with filtering
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      resourceType,
      dateFrom,
      dateTo,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message,
    });
  }
};

module.exports = {
  // Destination management
  createDestination,
  getDestinations,
  getDestinationById,
  updateDestination,
  deleteDestination,
  // Travel package management
  createTravelPackage,
  getTravelPackages,
  getTravelPackageById,
  updateTravelPackage,
  deleteTravelPackage,
  // Booking management
  getBookings,
  getBookingById,
  updateBookingStatus,
  // User management
  getUsers,
  getUserById,
  deleteUser,
  // Review management
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  // Analytics
  getDashboardStats,
  getRevenueAnalytics,
  getBookingAnalytics,
  getUserAnalytics,
  // Audit logs
  getAuditLogs,
};
