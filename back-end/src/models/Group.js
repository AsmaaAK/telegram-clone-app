const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema(
      {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
            role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
            joinedAt: { type: Date, default: Date.now }
      },
      { _id: false }
);

const GroupSchema = new mongoose.Schema(
      {
            name: { type: String, required: true, trim: true },
            description: { type: String, default: '' },
            avatarUrl: { type: String },
            ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
            members: { type: [GroupMemberSchema], default: [] },
            lastMessagePreview: { type: String, default: '' },
            lastMessageAt: { type: Date },
            unreadCounts: { type: Map, of: Number, default: {} }
      },
      { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('Group', GroupSchema);



