const conversationSchema = {
  type: { type: String, enum: ['private', 'group'], required: true, default: 'private' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  // للمحادثات الخاصة فقط
  isBlocked: { type: Boolean, default: false },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
};