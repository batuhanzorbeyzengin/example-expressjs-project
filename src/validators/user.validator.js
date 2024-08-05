const { body } = require('express-validator');

const rateValidation = [
  body('type').notEmpty().withMessage('Type is required').isIn(['LIKE', 'DISLIKE']).withMessage('Type must be either LIKE or DISLIKE'),
];

module.exports = {
    rateValidation
};
