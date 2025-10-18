const mongoose = require('mongoose');

const channelMessageSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'text' || this.type === 'system';
    }
  },
  fileUrl: {
    type: String,
    required: function() {
      return this.type === 'image' || this.type === 'file';
    }
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
channelMessageSchema.index({ channel: 1, createdAt: -1 });
channelMessageSchema.index({ sender: 1 });

// Virtual for formatted content
channelMessageSchema.virtual('formattedContent').get(function() {
  if (this.type === 'text') {
    return this.content;
  } else if (this.type === 'image') {
    return '[Image]';
  } else if (this.type === 'file') {
    return `[File: ${this.fileName || 'Unknown'}]`;
  } else if (this.type === 'system') {
    return this.content;
  }
  return '';
});

// Method to mark as edited
channelMessageSchema.methods.markAsEdited = function() {
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Static method to find messages by channel
channelMessageSchema.statics.findByChannel = function(channelId, limit = 50, offset = 0) {
  return this.find({ channel: channelId })
    .populate('sender', 'name username avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

// Static method to find latest message for channel
channelMessageSchema.statics.findLatestByChannel = function(channelId) {
  return this.findOne({ channel: channelId })
    .populate('sender', 'name username')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('ChannelMessage', channelMessageSchema);

