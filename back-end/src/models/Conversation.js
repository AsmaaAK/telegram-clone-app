const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
      {
            participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
            lastMessagePreview: { type: String, default: '' },
            unreadCounts: { type: Map, of: Number, default: {} },
      },
      { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('Conversation', ConversationSchema);


