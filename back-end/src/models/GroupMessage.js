const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema(
      {
            groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', index: true, required: true },
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
            content: { type: String, required: true },
            mediaUrl: { type: String },
            status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
            deliveredAt: { type: Date },
            readAt: { type: Date }
      },
      { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);



