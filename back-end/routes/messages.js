router.get('/:conversationId/messages', authenticate, messageController.getMessages);
router.post('/:conversationId/messages', authenticate, messageController.sendMessage);
router.post('/:conversationId/messages/upload', authenticate, uploadFile, messageController.uploadFile);
router.put('/:conversationId/messages/:messageId', authenticate, messageController.editMessage);
router.delete('/:conversationId/messages/:messageId', authenticate, messageController.deleteMessage);


