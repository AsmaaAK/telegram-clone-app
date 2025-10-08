const messageSchema = {
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // للمحادثات الخاصة
  type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  content: { 
    text: String,
    media: {
      url: String,
      filename: String,
      size: Number,
      mimeType: String
    }
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
};