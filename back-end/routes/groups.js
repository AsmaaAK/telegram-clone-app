router.get('/', authenticate, groupController.getGroups);
router.post('/', authenticate, groupController.createGroup);
router.get('/:groupId', authenticate, groupController.getGroup);
router.put('/:groupId', authenticate, authorize(['admin', 'owner']), groupController.updateGroup);
router.post('/:groupId/members', authenticate, authorize(['admin', 'owner']), groupController.addMember);
router.delete('/:groupId/members/:userId', authenticate, authorize(['admin', 'owner']), groupController.removeMember);
router.post('/:groupId/leave', authenticate, groupController.leaveGroup);