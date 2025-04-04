const Article = require("../../../model/article.model")
const searchHelper = require("../../../helper/search.helper")
const paginationHelper =  require("../../../helper/pagination.helper")
module.exports.article = async (req, res)=>{
    try {
        const find = {
            deleted: false

        }
        const search = searchHelper(req.query);

        if(search.regex){
            find.title = search.regex
        }
        
        if(req.query.status){
            find.status = req.query.status
        }

         // chuc nang phan trang         
        let initPagination = {
            currentPage: 1,
            limitItem: 10
        }
        const countProduct = await Article.countDocuments(find);
        const ojectPanigation = paginationHelper(
            initPagination,
            req.query,
            countProduct
        )

        // tinh nang sap sep theo tieu chi 
        const sort = {};
            if(req.query.sortKey && req.query.sortValue){
                sort[req.query.sortKey] = req.query.sortValue;
            } else {
                sort.position = "desc";
            }
        
        const article = await Article.find(find).sort(sort).limit(ojectPanigation.limitItem).skip(ojectPanigation.skip)
        res.json({
            code: 200,
            data: article,
            message: "success"
        })
    } catch (error) {
        res.json({
            code: 400,
            message: error
        })
    }
}

module.exports.create = async (req, res)=>{
   
    try {        
        console.log(req.body);
        
        if(req.body.position == ""){ 
            const articleCount = await Article.countDocuments();      // check người nếu người dùng không nhập vị trí thì sản phẩm tự tăng lên 1 
            req.body.position = articleCount + 1;            // ngược lại nếu người dùng nhập thì lấy vị trí đó  
        }else {
            req.body.position = parseInt(req.body.position)
        }
        const article = new Article(req.body);
        await article.save()
        res.json({
            data: article,
            code: 200,
            message: "cap nhat thanh cong"
        })
    } catch (error) {
        res.json({
            code: 404,
            message: "khong thanh cong",
        })
        
    }
    
}


module.exports.delete = async (req, res)=>{
    
    try {
        const id = req.params.id;
        await Article.updateOne({_id: id}, {deleted: true})
        res.json({
            code: 200,
            message: "xoa thanh cong"
       })
    } catch (error) {
        res.json({
            code: 400,
            message: "xoa khong thanh cong"
       })
    }
}

module.exports.edit = async (req, res)=>{
    
    try {
        const id = req.params.id;
        
        await Article.updateOne({_id: id}, req.body)
        res.json({
            code:200,
            message: " cap nhat thanh cong"
        })
    } catch (error) {
        res.json({
            code: 400,
            message: "cap nhat khong thanh cong"
       })
    }
    
}

module.exports.detail = async (req, res)=>{
    try {
        const id = req.params.id;
        const article = await Article.findOne({_id: id}, {
            deleted: false
        })
        res.json({
            data: article,
            code: 200
        })
    } catch (error) {
        res.json({
            code: 400,
            error: error
        })
    }
}

module.exports.changeStatus = async (req, res)=>{
    try {
        const id = req.params.id;
        const status = req.body.status;
        await Article.updateOne({_id: id}, {status: status});
        res.json({
            code: 200,
            message: "thay đổi trạng thái thành công"
        }) 
    } catch (error) {
        
    }
}

module.exports.changeMulti = async (req, res)=>{
    
    try {
        const{ids, key, value} = req.body
        switch (key) {
            case "status":
                await Article.updateMany({_id: {$in: ids}}, {
                    status: value
                })
                res.json({
                    code: 200,
                    message: "cập nhật thành công"
                })
                break;
            case "deleted": 
                await Article.updateMany({_id: {$in: ids}}, {
                    deleted: value,
                    deletedAt: new Date()
                })
                res.json({
                    code: 200,
                    message: "cập nhật thành công"
                })
                break;
            default:
                res.json({
                    code: 404,
                    message: "Không thành công"
                })  
                break;
        }
    } catch (error) {
        res.json({
            code: 400,
            message: "chỉnh sửa khong thành công",
        }) 
    }
}