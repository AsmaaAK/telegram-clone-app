const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  avatarUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
channelSchema.index({ owner: 1 });
channelSchema.index({ subscribers: 1 });
channelSchema.index({ isActive: 1 });

// Virtual for subscriber count
channelSchema.virtual('subscriberCount').get(function() {
  return this.subscribers.length;
});

// Method to add subscriber
channelSchema.methods.addSubscriber = function(userId) {
  if (!this.subscribers.includes(userId)) {
    this.subscribers.push(userId);
  }
  return this.save();
};

// Method to remove subscriber
channelSchema.methods.removeSubscriber = function(userId) {
  this.subscribers = this.subscribers.filter(id => !id.equals(userId));
  return this.save();
};

// Method to check if user is subscriber
channelSchema.methods.isSubscriber = function(userId) {
  return this.subscribers.some(id => id.equals(userId));
};

// Static method to find channels by owner
channelSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId, isActive: true }).populate('owner', 'name username avatarUrl');
};

// Static method to find channels user is subscribed to
channelSchema.statics.findBySubscriber = function(userId) {
  return this.find({ subscribers: userId, isActive: true }).populate('owner', 'name username avatarUrl');
};

module.exports = mongoose.model('Channel', channelSchema);

