const groupSchema = {
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  settings: {
    isPublic: { type: Boolean, default: false },
    allowInvites: { type: Boolean, default: true },
    approvalRequired: { type: Boolean, default: false }
  },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  }
};