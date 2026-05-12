const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '../data');

const schemaOptions = {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
};

async function readJsonFile(fileName) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// User Collection Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Legacy field kept for backward compatibility with existing unique indexes.
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    travel_interests: {
      type: [String],
      default: [],
    },
    eco_focus: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false },
);

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: normalizeString(email).toLowerCase() }).select('+password');
};

// Itinerary Item Schema (Embedded in Itinerary)
const itineraryItemSchema = new mongoose.Schema(
  {
    destination_id: {
      type: String,
      default: '',
    },
    day_number: {
      type: Number,
      required: true,
    },
    activity: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: false },
);

// Itinerary Collection Schema
const itinerarySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    total_cost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'draft', 'cancelled'],
      default: 'draft',
    },
    image: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    travelers: {
      type: Number,
      default: 2,
    },
    notes: {
      type: String,
      default: '',
    },
    bookingReference: {
      type: String,
      default: '',
    },
    days: {
      type: [Boolean],
      default: [],
    },
    start_city: {
      type: String,
      default: '',
    },
    itinerary_items: [itineraryItemSchema],
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false },
);

// Add indexes after schema definition
itinerarySchema.index({ user_id: 1 });

// Add static methods for backward compatibility with SavedPlan
itinerarySchema.statics.findByUserId = function findByUserId(userId) {
  return this.find({ user_id: userId }).sort({ updatedAt: -1, createdAt: -1 });
};

itinerarySchema.statics.update = function update(id, updateData) {
  return this.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

itinerarySchema.statics.delete = async function deleteById(id) {
  const result = await this.findByIdAndDelete(id);
  return !!result;
};

// Destination Collection Schema
const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    is_eco_friendly: {
      type: Boolean,
      default: false,
    },
    average_cost: {
      type: Number,
      default: 0,
    },
    average_rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false },
);

// Create geospatial index for location
destinationSchema.index({ location: '2dsphere' });

// Booking Collection Schema
const bookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itinerary_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      required: true,
    },
    booking_type: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    payment_info: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    total_cost: {
      type: Number,
      required: true,
    },
    books_for: {
      type: Date,
      default: Date.now,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false },
);

// Add indexes after schema definition
bookingSchema.index({ user_id: 1, created_at: -1 });
bookingSchema.index({ itinerary_id: 1 });
bookingSchema.index({ status: 1 });

// Review Collection Schema
const reviewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false },
);

// Add indexes after schema definition
reviewSchema.index({ destination_id: 1 });
reviewSchema.index({ user_id: 1 });

// Admin Collection Schema
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin', 'moderator'],
      default: 'admin',
    },
    permissions: {
      type: [String],
      default: ['read:all', 'write:all'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

// Admin static methods
adminSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: normalizeString(email).toLowerCase() }).select('+password');
};

// Audit Log Schema
const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      default: 'success',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true, versionKey: false },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminEmail: 1, createdAt: -1 });

// Create Models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Itinerary = mongoose.models.Itinerary || mongoose.model('Itinerary', itinerarySchema);
const Destination = mongoose.models.Destination || mongoose.model('Destination', destinationSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

// Backward compatibility aliases
const SavedPlan = Itinerary;
const TravelPlan = Destination;

// Seed Database with default admin user
async function seedDatabase() {
  try {
    const bcrypt = require('bcryptjs');
    
    // Check if default admin exists
    const existingAdmin = await Admin.findOne({ email: 'admin@smarttravel.com' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('SecurePassword123', 10);
      
      const defaultAdmin = new Admin({
        name: 'Admin User',
        email: 'admin@smarttravel.com',
        password: hashedPassword,
        role: 'super_admin',
        permissions: ['read:all', 'write:all', 'admin:all'],
        isActive: true,
      });
      
      await defaultAdmin.save();
      console.log('✓ Default admin user created');
    } else {
      console.log('✓ Default admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}

// Export Models
module.exports = {
  User,
  Itinerary,
  SavedPlan, // Backward compatibility
  TravelPlan,
  Destination,
  Booking,
  Review,
  Admin,
  AuditLog,
  seedDatabase,
  readJsonFile,
  normalizeString,
};