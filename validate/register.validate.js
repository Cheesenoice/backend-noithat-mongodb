const { body, validationResult } = require('express-validator');

module.exports.validateAccount = [
  // Kiểm tra email
  body('email')
    .trim()
    .normalizeEmail()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|vn)$/)
    .withMessage('Email không đúng định dạng! Chỉ hỗ trợ tên miền com, net, org, vn.'),

  // Kiểm tra mật khẩu (nếu có nhập)
  body('passWord')
    .optional({ checkFalsy: true }) // Cho phép không nhập (ví dụ khi không muốn đổi mật khẩu)
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự.')
    .matches(/[A-Z]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa.')
    .matches(/[a-z]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ cái viết thường.')
    .matches(/[0-9]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ số.')
    .matches(/[@$!%*?&]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&).')
];

module.exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

  
  // giúp lưu email đúng định dạng 