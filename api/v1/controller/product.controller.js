const Product = require("../../../model/product.model");
const ProductCategory = require("../../../model/product.category.modle")
const searchHelper = require("../../../helper/search.helper")
const paginationHelper = require("../../../helper/pagination.helper")
const treeHelper = require("../../../helper/category");
module.exports.product = async (req, res)=>{

    const find = {
        deleted: false,
        status: "active"
    }

    // chuc nang phan trang         
        let initPagination = {
            currentPage: 1,
            limitItem: 10
        }
        const countProduct = await Product.countDocuments(find);
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

    // loc trang thai
    if(req.query.status){
        find.status = req.query.status
     }        

    // chuc nang tim kiem
    const search = searchHelper(req.query)
    if(search.regex){
        find.title = search.regex
    }

    const product = await Product.find(find).sort(sort).limit(ojectPanigation.limitItem).skip(ojectPanigation.skip)    
    const record = await ProductCategory.find({
        deleted: false
    })

    const newProducts = product.map(item => {  // su dung map de tinh toan gia thep phan tram giam gia discountPercentage: phan tram giam gia
        item.priceNew = (item.price*(100 - item.discountPercentage)/100).toFixed(0); // ham tinh gia theo phan tram giam gia lay ra gia moi 
        item.priceNew = item.priceNew;        
        return item;                                                                            // ham toFixed giup loai bo cac dau sau dau phay      
    })
    
    // const newProduct = treeHelper.tree(record)
    res.json([
        {
            data: newProducts,
            page: req.query.page,
            limit: req.query.limit,
            code:200,
            message: "hiện thị thành công"  
        },
        
    ])
}

module.exports.create = async (req, res)=>{
   
    try {        
        if(req.body.position == ""){ 
            const productCount = await Product.countDocuments();      // check người nếu người dùng không nhập vị trí thì sản phẩm tự tăng lên 1 
            req.body.position = productCount + 1;            // ngược lại nếu người dùng nhập thì lấy vị trí đó  
        }else {
            req.body.position = parseInt(req.body.position)
        }
        const product = new Product(req.body);
        await product.save()
        res.json({
            data: product,
            code: 200,
            message: "cap nhat thanh cong"
        })
    } catch (error) {
        res.json({
            code: 404,
            message: "khong thanh cong"
        })
    }
    
}


module.exports.delete = async (req, res)=>{
    
    try {
        const id = req.params.id;
        await Product.updateOne({_id: id}, {deleted: true})
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
        
        await Product.updateOne({_id: id}, req.body)
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
        const product = await Product.findOne({_id: id}, {
            deleted: false
        })
        res.json({
            data: product,
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
        await Product.updateOne({_id: id}, {status: status});
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
                await Product.updateMany({_id: {$in: ids}}, {
                    status: value
                })
                res.json({
                    code: 200,
                    message: "cập nhật thành công"
                })
                break;
            case "deleted": 
                await Product.updateMany({_id: {$in: ids}}, {
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