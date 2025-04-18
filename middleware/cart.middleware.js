// const Cart = require("../model/cart.modle")
// module.exports.cart = async (req, res, next)=>{
//     if(!req.cookies.cartId){
//         const cart = new Cart();
//         await cart.save()                  // sử lý tạo ra 1 id của giỏ hàng tồn tại trên cookie
//         const expiresTime = 1000 * 60 * 60 * 24 * 365;
//         res.cookie("cartId", cart.id, {expires: new Date(Date.now() + expiresTime )})
//     }else {
//         const cart = await Cart.findOne({
//             _id: req.cookies.cartId
//         })

//         cart.totalQuantity = cart.product.reduce((sum, item)=> sum + item.quantity, 0)
//         res.locals.minicart = cart
//     }
//     next()
// }

const Cart = require("../model/cart.model");

module.exports.cart = async (req, res, next) => {
  try {
    let cart;

    // Nếu không có cartId trong cookie => tạo mới cart + set cookie
    if (!req.cookies.cartId) {
      cart = new Cart();
      await cart.save();

      const expiresTime = 1000 * 60 * 60 * 24 * 365; // 1 năm
      res.cookie("cartId", cart._id.toString(), {
        expires: new Date(Date.now() + expiresTime),
        httpOnly: false,
      });
    } else {
      // Nếu có cartId, tìm giỏ hàng trong database
      cart = await Cart.findById(req.cookies.cartId);

      // Trường hợp cartId sai hoặc không tồn tại trong DB (có thể bị xóa)
      if (!cart) {
        cart = new Cart();
        await cart.save();

        const expiresTime = 1000 * 60 * 60 * 24 * 365;
        res.cookie("cartId", cart._id.toString(), {
          expires: new Date(Date.now() + expiresTime),
          httpOnly: false,
        });
      }
    }

    // Tính tổng số lượng sản phẩm
    cart.totalQuantity = cart.product.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Gán giỏ hàng vào biến toàn cục để view hoặc middleware sau có thể dùng
    res.locals.minicart = cart;

    next();
  } catch (error) {
    console.error("Cart middleware error:", error);
    next(error); // đẩy lỗi về error handler nếu có
  }
};
