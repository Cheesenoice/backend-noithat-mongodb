const Product = require("../../../model/product.model")

module.exports.home = async (req, res)=>{
    try {
        const find = {
            featured: "0",
            deleted: false
        }
        const product = await Product.find(find);
        res.json({
            code: 200,
            message: "Thanh cong",
            data: product
        })
    } catch (error) {
        res.json({
            code: 400,
            message: "Khong thanh cong",
            data: error
        })
    }
}