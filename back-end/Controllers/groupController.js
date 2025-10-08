const Group = require('../models/Group');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Create new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members = [], settings = {} } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    // Create group
    const group = await Group.create({
      name,
      description,
      owner: req.user.userId,
      members: [
        {
          user: req.user.userId,
          role: 'owner'
        },
        ...members.map(memberId => ({
          user: memberId,
          role: 'member'
        }))
      ],
      settings: {
        isPublic: settings.isPublic || false,
        allowInvites: settings.allowInvites !== undefined ? settings.allowInvites : true,
        approvalRequired: settings.approvalRequired || false
      }
    });

    // Create conversation for the group
    const conversation = await Conversation.create({
      type: 'group',
      participants: [req.user.userId, ...members],
      group: group._id
    });

    // Link conversation to group
    group.conversation = conversation._id;
    await group.save();

    await group.populate('members.user', 'name username avatar');
    await group.populate('owner', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user.userId
    })
    .populate('members.user', 'name username avatar')
    .populate('owner', 'name username avatar')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

    // Calculate unread counts for current user
    const groupsWithUnread = groups.map(group => {
      const unreadCount = group.unreadCounts.get(req.user.userId.toString()) || 0;
      return {
        ...group.toObject(),
        unreadCounts: {
          [req.user.userId]: unreadCount
        }
      };
    });

    res.json({
      success: true,
      groups: groupsWithUnread
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get specific group
exports.getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': req.user.userId
    })
    .populate('members.user', 'name username avatar status lastSeen')
    .populate('owner', 'name username avatar')
    .populate('lastMessage');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or access denied'
      });
    }

    res.json({
      success: true,
      group
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, settings } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      $or: [
        { owner: req.user.userId },
        { 'members': { $elemMatch: { user: req.user.userId, role: 'admin' } } }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or insufficient permissions'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings) updateData.settings = { ...group.settings, ...settings };

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('members.user', 'name username avatar')
    .populate('owner', 'name username avatar');

    res.json({
      success: true,
      message: 'Group updated successfully',
      group: updatedGroup
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      $or: [
        { owner: req.user.userId },
        { 'members': { $elemMatch: { user: req.user.userId, role: 'admin' } } }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or insufficient permissions'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(
      member => member.user.toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to group
    group.members.push({
      user: userId,
      role: 'member'
    });

    await group.save();
    await group.populate('members.user', 'name username avatar');

    // Add user to group conversation
    await Conversation.findOneAndUpdate(
      { group: groupId },
      { $addToSet: { participants: userId } }
    );

    res.json({
      success: true,
      message: 'Member added successfully',
      group
    });

  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findOne({
      _id: groupId,
      $or: [
        { owner: req.user.userId },
        { 'members': { $elemMatch: { user: req.user.userId, role: 'admin' } } }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or insufficient permissions'
      });
    }

    // Cannot remove owner
    if (group.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group owner'
      });
    }

    // Cannot remove yourself if you're an admin
    if (userId === req.user.userId) {
      const currentMember = group.members.find(
        m => m.user.toString() === req.user.userId
      );
      if (currentMember.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Admins cannot remove themselves. Use leave group instead.'
        });
      }
    }

    // Remove user from group
    group.members = group.members.filter(
      member => member.user.toString() !== userId
    );

    await group.save();
    await group.populate('members.user', 'name username avatar');

    // Remove user from group conversation
    await Conversation.findOneAndUpdate(
      { group: groupId },
      { $pull: { participants: userId } }
    );

    res.json({
      success: true,
      message: 'Member removed successfully',
      group
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({
      _id: groupId,
      'members.user': req.user.userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you are not a member'
      });
    }

    // Owner cannot leave, must transfer ownership or delete group
    if (group.owner.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Group owner cannot leave. Transfer ownership or delete group instead.'
      });
    }

    // Remove user from group
    group.members = group.members.filter(
      member => member.user.toString() !== req.user.userId
    );

    await group.save();

    // Remove user from group conversation
    await Conversation.findOneAndUpdate(
      { group: groupId },
      { $pull: { participants: req.user.userId } }
    );

    res.json({
      success: true,
      message: 'Left group successfully'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send message to group
exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, type = 'text', replyTo } = req.body;

    // Verify user is member of group
    const group = await Group.findOne({
      _id: groupId,
      'members.user': req.user.userId
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or access denied'
      });
    }

    // Get group conversation
    const conversation = await Conversation.findOne({ group: groupId });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found for this group'
      });
    }

    // Create message
    const messageData = {
      conversation: conversation._id,
      sender: req.user.userId,
      type,
      content: { text: content }
    };

    // Add reply reference if provided
    if (replyTo) {
      const repliedMessage = await Message.findOne({
        _id: replyTo,
        conversation: conversation._id
      });
      
      if (repliedMessage) {
        messageData.replyTo = replyTo;
      }
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'name username avatar');
    await message.populate('replyTo', 'content sender type');

    // Update group and conversation
    group.lastMessage = message._id;
    group.lastMessageAt = new Date();

    // Increment unread counts for all members except sender
    group.members.forEach(member => {
      if (member.user.toString() !== req.user.userId) {
        const currentCount = group.unreadCounts.get(member.user.toString()) || 0;
        group.unreadCounts.set(member.user.toString(), currentCount + 1);
      }
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    await Promise.all([group.save(), conversation.save()]);

    // Emit real-time event
    req.app.get('io').to(groupId).emit('group:message:new', message);

    res.status(201).json({
      success: true,
      message: 'Message sent to group successfully',
      data: message
    });

  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};