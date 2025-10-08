const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Basic cache operations
  async set(key, value, expireInSeconds = 3600) {
    if (!this.isConnected) return null;
    
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      if (expireInSeconds > 0) {
        await this.client.setEx(key, expireInSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      
      // Try to parse as JSON, return as string if it fails
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async delete(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Hash operations for user sessions
  async setUserSession(userId, sessionData, expireInSeconds = 86400) {
    const key = `user:session:${userId}`;
    return await this.set(key, sessionData, expireInSeconds);
  }

  async getUserSession(userId) {
    const key = `user:session:${userId}`;
    return await this.get(key);
  }

  async deleteUserSession(userId) {
    const key = `user:session:${userId}`;
    return await this.delete(key);
  }

  // Online users management
  async setUserOnline(userId, userData) {
    const key = `user:online:${userId}`;
    const onlineData = {
      ...userData,
      lastSeen: new Date().toISOString(),
      isOnline: true
    };
    return await this.set(key, onlineData, 300); // 5 minutes TTL
  }

  async getUserOnlineStatus(userId) {
    const key = `user:online:${userId}`;
    return await this.get(key);
  }

  async setUserOffline(userId) {
    const key = `user:online:${userId}`;
    return await this.delete(key);
  }

  // Conversation caching
  async cacheConversation(conversationId, conversationData, expireInSeconds = 1800) {
    const key = `conversation:${conversationId}`;
    return await this.set(key, conversationData, expireInSeconds);
  }

  async getCachedConversation(conversationId) {
    const key = `conversation:${conversationId}`;
    return await this.get(key);
  }

  async deleteCachedConversation(conversationId) {
    const key = `conversation:${conversationId}`;
    return await this.delete(key);
  }

  // Message caching for frequently accessed conversations
  async cacheMessages(conversationId, messages, expireInSeconds = 900) {
    const key = `messages:${conversationId}`;
    return await this.set(key, messages, expireInSeconds);
  }

  async getCachedMessages(conversationId) {
    const key = `messages:${conversationId}`;
    return await this.get(key);
  }

  async deleteCachedMessages(conversationId) {
    const key = `messages:${conversationId}`;
    return await this.delete(key);
  }

  // User search results caching
  async cacheUserSearch(query, results, expireInSeconds = 300) {
    const key = `search:users:${Buffer.from(query).toString('base64')}`;
    return await this.set(key, results, expireInSeconds);
  }

  async getCachedUserSearch(query) {
    const key = `search:users:${Buffer.from(query).toString('base64')}`;
    return await this.get(key);
  }

  // Rate limiting
  async checkRateLimit(identifier, limit, windowInSeconds) {
    if (!this.isConnected) return { allowed: true, remaining: limit };
    
    const key = `rate_limit:${identifier}`;
    
    try {
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, windowInSeconds);
      }
      
      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;
      
      return {
        allowed,
        remaining,
        reset: windowInSeconds
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: limit };
    }
  }

  // Cache statistics
  async getStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info();
      const keys = await this.client.keys('*');
      
      return {
        connected: this.isConnected,
        totalKeys: keys.length,
        info: info
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return null;
    }
  }

  // Cache cleanup
  async clearPattern(pattern) {
    if (!this.isConnected) return 0;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.client.del(keys);
      return result;
    } catch (error) {
      console.error('Redis clear pattern error:', error);
      return 0;
    }
  }

  // Bulk operations
  async setMultiple(keyValuePairs, expireInSeconds = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const pipeline = this.client.multi();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
        if (expireInSeconds > 0) {
          pipeline.setEx(key, expireInSeconds, stringValue);
        } else {
          pipeline.set(key, stringValue);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis set multiple error:', error);
      return false;
    }
  }

  async getMultiple(keys) {
    if (!this.isConnected) return {};
    
    try {
      const values = await this.client.mGet(keys);
      const result = {};
      
      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch {
            result[key] = values[index];
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Redis get multiple error:', error);
      return {};
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;