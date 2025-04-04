const Article = require("../../../model/article.model");

module.exports.blog = async(req, res)=>{
    try {
        const find = {
            featured: "0",
            deleted: false
        }
        const article = await Article.find(find)
        res.json({
            code: 200,
            message: "thanh cong",
            data: article
        })
    } catch (error) {
        res.json({
            code:400,
            message: "Khong thanh cong",
            data: error
        })
    }
}