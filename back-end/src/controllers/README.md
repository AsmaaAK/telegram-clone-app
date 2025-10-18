# Controllers

This directory contains the controller classes that handle the business logic for the application.

## Structure

### AuthController
Handles authentication-related operations:
- User registration
- User login
- Profile management
- Password changes

### ChannelsController
Handles channel-related operations:
- Channel creation, update, deletion
- Channel subscription/unsubscription
- Channel messaging
- Channel listing

### UsersController
Handles user-related operations:
- User profile management
- User search and listing
- Avatar uploads
- User blocking/unblocking

### MessagesController
Handles message-related operations:
- Sending text and file messages
- Message editing and deletion
- Marking messages as read
- Conversation messaging

## Usage

Each controller exports static methods that can be used in routes. The controllers handle:
- Input validation
- Business logic
- Database operations
- Error handling
- Response formatting

## Example

```javascript
const ChannelsController = require('../controllers/channelsController');

// In routes
router.post('/', authRequired, ChannelsController.createChannel);
```

## Benefits

- **Separation of Concerns**: Routes handle routing, controllers handle logic
- **Reusability**: Controller methods can be reused across different routes
- **Maintainability**: Business logic is centralized and easier to maintain
- **Testability**: Controllers can be easily unit tested
- **Clean Code**: Routes are cleaner and more readable

