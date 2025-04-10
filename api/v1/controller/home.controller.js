const Product = require("../../../model/product.model")
const Article = require("../../../model/article.model")
module.exports.home = async (req, res)=>{
    try {
        const find = {
            featured: "0",
            deleted: false,
            status: "active"
        }

        
        const product = await Product.find(find);
        const article = await Article.find(find);
        res.json({
            code: 200,
            message: "Thanh cong",
            productFeated: product,
            articleFeated: article,
        })

        
    } catch (error) {
        res.json({
            code: 400,
            message: "Khong thanh cong",
            data: error
        })
    }
}

