// src/middlewares/uploadMiddleware.js

const multer = require('multer');
const { BadRequestError } = require('../errors/AppError');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new BadRequestError('Apenas arquivos CSV são aceitos'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload };
