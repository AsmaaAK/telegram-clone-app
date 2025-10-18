const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
      {
            language: { type: String, enum: ['ar', 'en'], default: 'en' },
            theme: { type: String, enum: ['dark', 'light'], default: 'light' },
            showLastSeen: { type: Boolean, default: true },
            hideStatus: { type: Boolean, default: false },
      },
      { _id: false }
);

const UserSchema = new mongoose.Schema(
      {
            name: { type: String, required: true, trim: true },
            username: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
            passwordHash: { type: String, required: true },
            avatarUrl: { type: String },
            about: { type: String, default: '' },
            lastSeen: { type: Date },
            status: { type: String, enum: ['online', 'offline'], default: 'offline' },
            typingTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            settings: { type: SettingsSchema, default: () => ({}) },
            blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
      { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


