const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      folder += 'images/';
    } else {
      folder += 'files/';
    }

    // Create folder if it doesn't exist
    const fullPath = path.join(__dirname, '..', folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, folder);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file types
  if (file.mimetype.startsWith('image/')) {
    // Validate image types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
  } else {
    // Validate document types
    const allowedFileTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file upload
  }
});

// Specific upload configurations
const uploadAvatar = upload.single('avatar');
const uploadFile = upload.single('file');
const uploadMultiple = upload.array('files', 5); // Max 5 files

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (err.message.includes('Only JPEG, PNG, GIF, and WebP images are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Only JPEG, PNG, GIF, and WebP images are allowed.'
    });
  }
  
  if (err.message.includes('Unsupported file type')) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported file type. Allowed types: PDF, Word, Excel, PowerPoint, ZIP, RAR, and text files.'
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: 'File upload failed'
  });
};

module.exports = {
  upload,
  uploadAvatar,
  uploadFile,
  uploadMultiple,
  handleUploadError
};