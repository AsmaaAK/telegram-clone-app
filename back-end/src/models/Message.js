const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
      {
            conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true, required: true },
            from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
            content: { type: String, required: true },
            status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
            deliveredAt: { type: Date },
            readAt: { type: Date },
      },
      { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Message', MessageSchema);


