const { socketAuth } = require('./middlewares/auth');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Group = require('./models/Group');
const GroupMessage = require('./models/GroupMessage');
const Channel = require('./models/Channel');
const ChannelMessage = require('./models/ChannelMessage');

function setupSocket(io) {
      console.log('🔌 Setting up Socket.io server...');

      io.use(socketAuth);

      io.on('connection', async (socket) => {
            const userId = socket.user.id;
            const user = await User.findById(userId).select('name username');
            const userName = user?.name || user?.username || userId;
            console.log(`\n User connected: ${userName} (${userId}) (Socket ID: ${socket.id})`);

            // Join user's own room
            socket.join(userId);
            console.log(` User ${userName} joined room: ${userId}`);

            // Update user status to online
            await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: null });
            console.log(` Updated user ${userName} status to online`);

            // Broadcast to ALL other connected clients
            socket.broadcast.emit('user:online', { userId });
            console.log(` Broadcasted user:online to all clients`);

            // Get all currently connected users and send to this user
            const allUsers = await User.find({ status: 'online' }).select('_id name username status');
            console.log(` Currently online users: ${allUsers.length}`);
            allUsers.forEach(u => {
                  if (u._id.toString() !== userId) {
                        const otherUserName = u.name || u.username || u._id.toString();
                        socket.emit('user:online', { userId: u._id.toString() });
                        console.log(` Sent user:online for ${otherUserName} to new user ${userName}`);
                  }
            });

            socket.on('presence:subscribe', (targetId) => {
                  socket.join(`presence:${targetId}`);
            });

            socket.on('conversation:join', (conversationId) => {
                  socket.join(`conversation:${conversationId}`);
                  console.log(` User ${userName} joined conversation room: ${conversationId}`);
            });

            socket.on('conversation:leave', (conversationId) => {
                  socket.leave(`conversation:${conversationId}`);
                  console.log(` User ${userName} left conversation room: ${conversationId}`);
            });

            socket.on('typing', ({ to, isTyping }) => {
                  io.to(to).emit('user:typing', { from: userId, isTyping: !!isTyping });
                  User.findByIdAndUpdate(userId, { typingTo: isTyping ? to : null }).catch(() => { });
            });

            // ===== Groups Realtime =====
            socket.on('join_group', async ({ groupId }) => {
                  try {
                        const group = await Group.findById(groupId).select('members');
                        if (!group) return;
                        const isMember = group.members.some((m) => m.userId.toString() === userId);
                        if (!isMember) return;
                        socket.join(`group:${groupId}`);
                        console.log(` User ${userName} joined group room: ${groupId}`);
                  } catch (_) { }
            });

            socket.on('leave_group', ({ groupId }) => {
                  socket.leave(`group:${groupId}`);
                  console.log(` User ${userName} left group room: ${groupId}`);
            });

            socket.on('group_message', async ({ groupId, content, type = 'text', tempId }) => {
                  try {
                        if (!groupId || !content) return;
                        const group = await Group.findById(groupId);
                        if (!group) return;
                        const isMember = group.members.some((m) => m.userId.toString() === userId);
                        if (!isMember) return;

                        const msg = await GroupMessage.create({ groupId, senderId: userId, type, content });

                        // Update group activity and unread
                        group.lastMessagePreview = type === 'text' ? content.slice(0, 100) : `[${type}]`;
                        group.lastMessageAt = msg.createdAt;
                        group.members.forEach((m) => {
                              const key = m.userId.toString();
                              if (key !== userId) group.unreadCounts.set(key, (group.unreadCounts.get(key) || 0) + 1);
                        });
                        await group.save();

                        // Emit message to group room and ack to sender
                        io.to(`group:${groupId}`).emit('group_message', { message: msg });
                        if (tempId) io.to(userId).emit('group_message_status', { messageId: msg._id, status: 'sent', userId, timestamp: new Date().toISOString(), tempId });
                  } catch (e) {
                        // noop
                  }
            });

            socket.on('group_message_delivered', async ({ messageId }) => {
                  try {
                        const msg = await GroupMessage.findByIdAndUpdate(messageId, { status: 'delivered', deliveredAt: new Date() }, { new: true });
                        if (!msg) return;
                        io.to(`group:${msg.groupId}`).emit('group_message_status', { messageId, status: 'delivered', userId, timestamp: new Date().toISOString() });
                  } catch (_) { }
            });

            socket.on('group_message_read', async ({ groupId, messageId }) => {
                  try {
                        const msg = await GroupMessage.findByIdAndUpdate(messageId, { status: 'read', readAt: new Date() }, { new: true });
                        if (!msg) return;
                        io.to(`group:${groupId}`).emit('group_message_status', { messageId, status: 'read', userId, timestamp: new Date().toISOString() });
                  } catch (_) { }
            });

            // Mark entire group as read for this user (clear unread counter)
            socket.on('group:markRead', async ({ groupId }) => {
                  try {
                        const group = await Group.findById(groupId);
                        if (!group) return;
                        const isMember = group.members.some((m) => m.userId.toString() === userId);
                        if (!isMember) return;
                        const key = userId.toString();
                        group.unreadCounts.set(key, 0);
                        await group.save();
                        // Emit unread update only to this user
                        io.to(userId).emit('group:unreadUpdate', { groupId, unreadCount: 0 });
                  } catch (_) { }
            });

            socket.on('message:send', async ({ conversationId, to, type = 'text', content }) => {
                  const fromUser = await User.findById(userId).select('name username');
                  const toUser = await User.findById(to).select('name username');
                  const fromUserName = fromUser?.name || fromUser?.username || userId;
                  const toUserName = toUser?.name || toUser?.username || to;
                  console.log(` message:send received from ${fromUserName} to ${toUserName}`);
                  if (!conversationId || !to || !content) {
                        console.log(' Missing required fields');
                        return;
                  }
                  const convo = await Conversation.findById(conversationId);
                  if (!convo) {
                        console.log(' Conversation not found');
                        return;
                  }

                  // Check if sender is blocked by recipient
                  if (toUser.blocked?.some((id) => id.toString() === userId)) {
                        console.log(` User ${fromUserName} is blocked by ${toUserName}`);
                        socket.emit('message:error', { message: 'You are blocked', code: 'BLOCKED' });
                        return;
                  }
                  const msg = await Message.create({ conversationId, from: userId, to, type, content });
                  console.log(` Message created: ${msg._id} from ${fromUserName} to ${toUserName}`);

                  // Update conversation lastMessage and unread counts
                  convo.lastMessagePreview = type === 'text' ? content.slice(0, 100) : `[${type}]`;
                  convo.lastMessage = msg._id;
                  convo.lastMessageAt = msg.createdAt;

                  // Increment unread count for the recipient (not the sender)
                  const recipientKey = to.toString();
                  convo.unreadCounts.set(recipientKey, (convo.unreadCounts.get(recipientKey) || 0) + 1);
                  await convo.save();

                  console.log(` Updated unread count for ${toUserName}: ${convo.unreadCounts.get(recipientKey)}`);

                  // Emit to receiver
                  io.to(to).emit('message:new', msg);
                  console.log(` Emitted message:new to receiver (${toUserName})`);

                  // Emit to sender so they see their own message
                  io.to(userId).emit('message:new', msg);
                  console.log(` Emitted message:new to sender (${fromUserName})`);

                  // Also emit to conversation room if it exists
                  io.to(`conversation:${conversationId}`).emit('message:new', msg);
                  console.log(` Emitted message:new to conversation room (${conversationId})`);

                  // Emit unread count update to recipient
                  io.to(to).emit('conversation:unreadUpdate', {
                        conversationId,
                        unreadCount: convo.unreadCounts.get(recipientKey)
                  });
                  console.log(` Emitted unread count update to ${toUserName}: ${convo.unreadCounts.get(recipientKey)}`);
            });

            socket.on('message:delivered', async ({ messageId }) => {
                  await Message.findByIdAndUpdate(messageId, { status: 'delivered', deliveredAt: new Date() });
            });

            socket.on('message:read', async ({ messageId }) => {
                  await Message.findByIdAndUpdate(messageId, { status: 'read', readAt: new Date() });
            });

            socket.on('conversation:markRead', async ({ conversationId }) => {
                  try {
                        const convo = await Conversation.findById(conversationId);
                        if (!convo) {
                              console.log(' Conversation not found for markRead');
                              return;
                        }
                        if (!convo.participants.find((p) => p.toString() === userId)) {
                              console.log(' User not a participant in conversation');
                              return;
                        }

                        // Clear unread count for this user
                        convo.unreadCounts.set(userId, 0);
                        await convo.save();

                        console.log(` User ${userName} marked conversation ${conversationId} as read`);

                        // Emit unread count update to user
                        socket.emit('conversation:unreadUpdate', {
                              conversationId,
                              unreadCount: 0
                        });
                  } catch (error) {
                        console.error('Error marking conversation as read:', error);
                  }
            });

            socket.on('user:update', async (payload) => {
                  io.emit('user:update', { userId, ...payload });
            });

            // ===== 1-1 Audio Call Signaling (WebRTC) =====
            async function hasDirectConversationWith(targetUserId) {
                  try {
                        const mongoose = require('mongoose');
                        const a = new mongoose.Types.ObjectId(userId);
                        const b = new mongoose.Types.ObjectId(targetUserId);
                        const conv = await Conversation.findOne({ participants: { $all: [a, b] } }).select('participants');
                        const ok = !!(conv && Array.isArray(conv.participants) && conv.participants.length === 2);
                        if (!ok) console.log(' call blocked: no direct conversation between', userId, 'and', targetUserId);
                        return ok;
                  } catch (e) { console.log(' call check error', e?.message); return false; }
            }

            socket.on('call_user', async ({ toUserId, offer }) => {
                  if (!toUserId || !offer) return;
                  const allowed = await hasDirectConversationWith(toUserId);
                  console.log(' call_user from', userId, 'to', toUserId, 'allowed?', allowed);
                  if (!allowed) return;
                  io.to(toUserId).emit('incoming_call', { fromUserId: userId, offer });
            });

            socket.on('answer_call', async ({ toUserId, answer }) => {
                  if (!toUserId || !answer) return;
                  const allowed = await hasDirectConversationWith(toUserId);
                  console.log(' answer_call from', userId, 'to', toUserId, 'allowed?', allowed);
                  if (!allowed) return;
                  io.to(toUserId).emit('call_answered', { fromUserId: userId, answer });
            });

            socket.on('ice_candidate', async ({ toUserId, candidate }) => {
                  if (!toUserId || !candidate) return;
                  const allowed = await hasDirectConversationWith(toUserId);
                  if (!allowed) return;
                  io.to(toUserId).emit('ice_candidate', { fromUserId: userId, candidate });
            });

            socket.on('end_call', async ({ toUserId }) => {
                  if (!toUserId) return;
                  const allowed = await hasDirectConversationWith(toUserId);
                  if (!allowed) return;
                  io.to(toUserId).emit('call_ended', { fromUserId: userId });
            });

            // Channel events
            socket.on('channel:join', async (channelId) => {
                  const channel = await Channel.findOne({ _id: channelId, isActive: true });
                  if (channel) {
                        // Allow anyone to join channel rooms to receive messages (public channels)
                        socket.join(`channel:${channelId}`);
                        console.log(` User ${userName} joined channel room: ${channelId}`);
                  }
            });

            socket.on('channel:leave', (channelId) => {
                  socket.leave(`channel:${channelId}`);
                  console.log(` User ${userName} left channel room: ${channelId}`);
            });

            // Channel creation event
            socket.on('channel:create', async (channelData) => {
                  try {
                        console.log(` User ${userName} created channel: ${channelData.name}`);

                        // Emit to all connected users
                        io.emit('channel:created', channelData);
                  } catch (error) {
                        console.error('Error broadcasting channel creation:', error);
                  }
            });

            // Channel update event
            socket.on('channel:update', async (channelData) => {
                  try {
                        console.log(` User ${userName} updated channel: ${channelData.name}`);

                        // Emit to all connected users
                        io.emit('channel:updated', channelData);
                  } catch (error) {
                        console.error('Error broadcasting channel update:', error);
                  }
            });

            // Channel deletion event
            socket.on('channel:delete', async (channelId) => {
                  try {
                        console.log(` User ${userName} deleted channel: ${channelId}`);

                        // Emit to all connected users
                        io.emit('channel:deleted', channelId);
                  } catch (error) {
                        console.error('Error broadcasting channel deletion:', error);
                  }
            });

            socket.on('disconnect', async () => {
                  const user = await User.findById(userId).select('name username');
                  const userName = user?.name || user?.username || userId;
                  console.log(` User disconnected: ${userName} (${userId})`);
                  const now = new Date();
                  await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: now, typingTo: null });
                  // Emit offline status with lastSeen timestamp to all connected clients
                  socket.broadcast.emit('user:offline', { userId, lastSeen: now.toISOString() });
                  console.log(` Broadcasted user:offline for ${userName}`);
            });
      });

      // Make io accessible in routes via app
      io.engine.on('connection_error', (err) => {
            // eslint-disable-next-line no-console
            console.error('Socket connection error', err.message);
      });
}

module.exports = { setupSocket };


