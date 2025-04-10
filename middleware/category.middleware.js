const ProductCategory = require("../model/product-category.model")
const create_tree =  require("../helper/category")
module.exports.categoryMiddleware = async (req, res, next)=>{
    const productCategory = await ProductCategory.find({
        deleted: false,
        status: 'active'
    })
    const newRecord = create_tree.tree(productCategory)

    res.locals.productCategory =  newRecord  // biến phần danh mục thành biến local để nó có thể dùng ở mọi nơi 
    // router nào cần dùng thì mình nhúng vào 

    next()
}