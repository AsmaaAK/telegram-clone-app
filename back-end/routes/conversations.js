router.get('/', authenticate, chatController.getConversations);
router.post('/', authenticate, chatController.createConversation);
router.get('/:conversationId', authenticate, chatController.getConversation);
router.post('/:conversationId/read', authenticate, chatController.markAsRead);
router.delete('/:conversationId', authenticate, chatController.deleteConversation);