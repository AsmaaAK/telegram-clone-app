router.get('/', authenticate, userController.getUsers);
router.get('/search', authenticate, userController.searchUsers);
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);
router.post('/me/avatar', authenticate, uploadAvatar, userController.uploadAvatar);
router.post('/:userId/block', authenticate, userController.blockUser);
router.post('/:userId/unblock', authenticate, userController.unblockUser);