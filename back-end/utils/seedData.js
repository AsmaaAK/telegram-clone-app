const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Group = require('../models/Group');
const { hashPassword } = require('./helpers');

const seedUsers = async () => {
  try {
    console.log('Seeding users...');

    const users = [
      {
        username: 'admin',
        email: 'admin@telegram.com',
        password: await hashPassword('admin123'),
        name: 'System Administrator',
        avatar: '',
        about: 'System administrator account',
        role: 'admin',
        status: 'online'
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: await hashPassword('password123'),
        name: 'John Doe',
        avatar: '',
        about: 'Software developer and tech enthusiast',
        status: 'online'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: await hashPassword('password123'),
        name: 'Jane Smith',
        avatar: '',
        about: 'Digital designer and artist',
        status: 'online'
      },
      {
        username: 'mike_wilson',
        email: 'mike@example.com',
        password: await hashPassword('password123'),
        name: 'Mike Wilson',
        avatar: '',
        about: 'Project manager and team lead',
        status: 'away'
      },
      {
        username: 'sarah_jones',
        email: 'sarah@example.com',
        password: await hashPassword('password123'),
        name: 'Sarah Jones',
        avatar: '',
        about: 'Marketing specialist and content creator',
        status: 'offline'
      },
      {
        username: 'alex_brown',
        email: 'alex@example.com',
        password: await hashPassword('password123'),
        name: 'Alex Brown',
        avatar: '',
        about: 'Student and aspiring developer',
        status: 'online'
      },
      {
        username: 'emma_davis',
        email: 'emma@example.com',
        password: await hashPassword('password123'),
        name: 'Emma Davis',
        avatar: '',
        about: 'Photographer and travel blogger',
        status: 'online'
      },
      {
        username: 'david_miller',
        email: 'david@example.com',
        password: await hashPassword('password123'),
        name: 'David Miller',
        avatar: '',
        about: 'Business consultant and entrepreneur',
        status: 'offline'
      }
    ];

    // Clear existing users (except admin if exists)
    await User.deleteMany({ username: { $ne: 'admin' } });

    // Insert new users
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    return createdUsers;

  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedConversations = async (users) => {
  try {
    console.log('Seeding conversations...');

    // Clear existing conversations
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    const conversations = [
      {
        type: 'private',
        participants: [users[1]._id, users[2]._id], // John and Jane
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        type: 'private',
        participants: [users[1]._id, users[3]._id], // John and Mike
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        type: 'private',
        participants: [users[2]._id, users[4]._id], // Jane and Sarah
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        type: 'private',
        participants: [users[1]._id, users[5]._id], // John and Alex
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ];

    const createdConversations = await Conversation.insertMany(conversations);
    console.log(`Created ${createdConversations.length} conversations`);

    return createdConversations;

  } catch (error) {
    console.error('Error seeding conversations:', error);
    throw error;
  }
};

const seedMessages = async (conversations, users) => {
  try {
    console.log('Seeding messages...');

    const messages = [];

    // Conversation 1: John and Jane
    messages.push(
      {
        conversation: conversations[0]._id,
        sender: users[1]._id,
        receiver: users[2]._id,
        type: 'text',
        content: { text: 'Hey Jane! How are you doing?' },
        createdAt: new Date(Date.now() - 1000 * 60 * 10)
      },
      {
        conversation: conversations[0]._id,
        sender: users[2]._id,
        receiver: users[1]._id,
        type: 'text',
        content: { text: 'Hi John! I\'m doing great, thanks! Working on some new designs.' },
        createdAt: new Date(Date.now() - 1000 * 60 * 9)
      },
      {
        conversation: conversations[0]._id,
        sender: users[1]._id,
        receiver: users[2]._id,
        type: 'text',
        content: { text: 'That sounds awesome! Can\'t wait to see them.' },
        createdAt: new Date(Date.now() - 1000 * 60 * 8)
      },
      {
        conversation: conversations[0]._id,
        sender: users[2]._id,
        receiver: users[1]._id,
        type: 'text',
        content: { text: 'I\'ll send you some previews soon! 😊' },
        createdAt: new Date(Date.now() - 1000 * 60 * 7)
      },
      {
        conversation: conversations[0]._id,
        sender: users[1]._id,
        receiver: users[2]._id,
        type: 'text',
        content: { text: 'Perfect! Looking forward to it.' },
        createdAt: new Date(Date.now() - 1000 * 60 * 5)
      }
    );

    // Conversation 2: John and Mike
    messages.push(
      {
        conversation: conversations[1]._id,
        sender: users[3]._id,
        receiver: users[1]._id,
        type: 'text',
        content: { text: 'John, do you have time for a quick meeting tomorrow?' },
        createdAt: new Date(Date.now() - 1000 * 60 * 45)
      },
      {
        conversation: conversations[1]._id,
        sender: users[1]._id,
        receiver: users[3]._id,
        type: 'text',
        content: { text: 'Sure Mike! What time works for you?' },
        createdAt: new Date(Date.now() - 1000 * 60 * 40)
      },
      {
        conversation: conversations[1]._id,
        sender: users[3]._id,
        receiver: users[1]._id,
        type: 'text',
        content: { text: 'How about 2 PM? We can discuss the new project requirements.' },
        createdAt: new Date(Date.now() - 1000 * 60 * 35)
      },
      {
        conversation: conversations[1]._id,
        sender: users[1]._id,
        receiver: users[3]._id,
        type: 'text',
        content: { text: '2 PM works perfectly. See you then!' },
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      }
    );

    // Conversation 3: Jane and Sarah
    messages.push(
      {
        conversation: conversations[2]._id,
        sender: users[2]._id,
        receiver: users[4]._id,
        type: 'text',
        content: { text: 'Sarah, I loved your latest blog post about digital marketing trends!' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
      },
      {
        conversation: conversations[2]._id,
        sender: users[4]._id,
        receiver: users[2]._id,
        type: 'text',
        content: { text: 'Thank you Jane! I\'m glad you enjoyed it. Your designs were a big inspiration!' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5)
      },
      {
        conversation: conversations[2]._id,
        sender: users[2]._id,
        receiver: users[4]._id,
        type: 'text',
        content: { text: 'We should collaborate on a project together sometime!' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      }
    );

    // Conversation 4: John and Alex
    messages.push(
      {
        conversation: conversations[3]._id,
        sender: users[5]._id,
        receiver: users[1]._id,
        type: 'text',
        content: { text: 'Hi John! I have a question about the React project we discussed.' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25)
      },
      {
        conversation: conversations[3]._id,
        sender: users[1]._id,
        receiver: users[5]._id,
        type: 'text',
        content: { text: 'Hey Alex! Sure, what do you need help with?' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    );

    const createdMessages = await Message.insertMany(messages);
    console.log(`Created ${createdMessages.length} messages`);

    // Update conversations with last messages
    for (const conversation of conversations) {
      const lastMessage = await Message.findOne({ conversation: conversation._id })
        .sort({ createdAt: -1 });
      
      if (lastMessage) {
        conversation.lastMessage = lastMessage._id;
        await conversation.save();
      }
    }

    return createdMessages;

  } catch (error) {
    console.error('Error seeding messages:', error);
    throw error;
  }
};

const seedGroups = async (users) => {
  try {
    console.log('Seeding groups...');

    await Group.deleteMany({});

    const groups = [
      {
        name: 'Developers Hub',
        description: 'A community for developers to share knowledge and collaborate',
        owner: users[1]._id,
        members: [
          { user: users[1]._id, role: 'owner' },
          { user: users[2]._id, role: 'admin' },
          { user: users[5]._id, role: 'member' },
          { user: users[6]._id, role: 'member' }
        ],
        settings: {
          isPublic: true,
          allowInvites: true,
          approvalRequired: false
        }
      },
      {
        name: 'Design Team',
        description: 'Creative discussions and design collaborations',
        owner: users[2]._id,
        members: [
          { user: users[2]._id, role: 'owner' },
          { user: users[4]._id, role: 'admin' },
          { user: users[6]._id, role: 'member' }
        ],
        settings: {
          isPublic: false,
          allowInvites: true,
          approvalRequired: true
        }
      },
      {
        name: 'Project Alpha',
        description: 'Discussion group for Project Alpha team members',
        owner: users[3]._id,
        members: [
          { user: users[3]._id, role: 'owner' },
          { user: users[1]._id, role: 'admin' },
          { user: users[7]._id, role: 'member' }
        ],
        settings: {
          isPublic: false,
          allowInvites: false,
          approvalRequired: true
        }
      }
    ];

    const createdGroups = await Group.insertMany(groups);
    console.log(`Created ${createdGroups.length} groups`);

    // Create conversations for groups
    for (const group of createdGroups) {
      const conversation = await Conversation.create({
        type: 'group',
        participants: group.members.map(m => m.user),
        group: group._id
      });

      group.conversation = conversation._id;
      await group.save();

      // Add some group messages
      const groupMessages = [
        {
          conversation: conversation._id,
          sender: group.owner,
          type: 'text',
          content: { text: `Welcome to ${group.name}! Feel free to introduce yourselves.` },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        },
        {
          conversation: conversation._id,
          sender: group.members[1].user,
          type: 'text',
          content: { text: 'Thanks for creating this group! Looking forward to collaborating with everyone.' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
        }
      ];

      await Message.insertMany(groupMessages);

      // Update group with last message
      const lastMessage = await Message.findOne({ conversation: conversation._id })
        .sort({ createdAt: -1 });
      
      if (lastMessage) {
        group.lastMessage = lastMessage._id;
        group.lastMessageAt = lastMessage.createdAt;
        await group.save();

        conversation.lastMessage = lastMessage._id;
        conversation.lastMessageAt = lastMessage.createdAt;
        await conversation.save();
      }
    }

    return createdGroups;

  } catch (error) {
    console.error('Error seeding groups:', error);
    throw error;
  }
};

const seedAll = async () => {
  try {
    console.log('Starting database seeding...');

    // Seed users first
    const users = await seedUsers();

    // Seed conversations and messages
    const conversations = await seedConversations(users);
    await seedMessages(conversations, users);

    // Seed groups
    await seedGroups(users);

    console.log('Database seeding completed successfully!');
    
    // Print summary
    const userCount = await User.countDocuments();
    const conversationCount = await Conversation.countDocuments();
    const messageCount = await Message.countDocuments();
    const groupCount = await Group.countDocuments();

    console.log('\n=== Seeding Summary ===');
    console.log(`Users: ${userCount}`);
    console.log(`Conversations: ${conversationCount}`);
    console.log(`Messages: ${messageCount}`);
    console.log(`Groups: ${groupCount}`);
    console.log('=====================\n');

    return {
      users: userCount,
      conversations: conversationCount,
      messages: messageCount,
      groups: groupCount
    };

  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
};

const clearDatabase = async () => {
  try {
    console.log('Clearing database...');
    
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Group.deleteMany({});
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

module.exports = {
  seedUsers,
  seedConversations,
  seedMessages,
  seedGroups,
  seedAll,
  clearDatabase
};