const express = require('express');
const router = express.Router();
const { authRequired } = require('../middlewares/auth');
const ChannelsController = require('../controllers/channelsController');

// Create a new channel
router.post('/',
  authRequired,
  ChannelsController.getUploadMiddleware().single('avatar'),
  ChannelsController.createChannel
);

// Get all channels
router.get('/', authRequired, ChannelsController.getAllChannels);

// Get channel by ID
router.get('/:id', authRequired, ChannelsController.getChannelById);

// Update channel
router.put('/:id',
  authRequired,
  ChannelsController.getUploadMiddleware().single('avatar'),
  ChannelsController.updateChannel
);

// Delete channel
router.delete('/:id', authRequired, ChannelsController.deleteChannel);

// Subscribe to channel
router.post('/:id/subscribe', authRequired, ChannelsController.subscribeToChannel);

// Unsubscribe from channel
router.post('/:id/unsubscribe', authRequired, ChannelsController.unsubscribeFromChannel);

// Send message to channel
router.post('/:id/messages',
  authRequired,
  ChannelsController.getUploadMiddleware().single('file'),
  ChannelsController.sendChannelMessage
);

// Get channel messages
router.get('/:id/messages', authRequired, ChannelsController.getChannelMessages);

module.exports = router;