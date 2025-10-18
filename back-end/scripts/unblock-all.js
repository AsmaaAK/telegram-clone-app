const mongoose = require('mongoose');
const User = require('../src/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/whatsapp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
});

async function unblockAllUsers() {
      try {
            console.log('🔄 Starting to unblock all users...');

            // Get all users
            const users = await User.find({});
            console.log(`📊 Found ${users.length} users`);

            let unblockedCount = 0;

            for (const user of users) {
                  if (user.blocked && user.blocked.length > 0) {
                        console.log(`🚫 User ${user.name || user.username} has blocked ${user.blocked.length} users:`, user.blocked);
                        user.blocked = []; // Clear blocked list
                        await user.save();
                        unblockedCount++;
                        console.log(`✅ Cleared blocked list for ${user.name || user.username}`);
                  }
            }

            console.log(`\n🎉 Unblocking completed!`);
            console.log(`📊 Users processed: ${users.length}`);
            console.log(`🚫 Users with blocked lists cleared: ${unblockedCount}`);

      } catch (error) {
            console.error('❌ Error unblocking users:', error);
      } finally {
            mongoose.disconnect();
            console.log('🔌 Disconnected from MongoDB');
      }
}

// Run the script
unblockAllUsers();


