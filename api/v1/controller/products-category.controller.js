const ProductCategory = require("../../../model/product.category.modle");
const searchHelper = require("../../../helper/search.helper")
const paginationHelper = require("../../../helper/pagination.helper")
const createTreeHelper = require("../../../helper/category")
// module.exports.productsCategory = async (req, res)=>{
    
//     const find = {
//         deleted: false,
//         status: "active"
//     }

//     // tìm kiếm
//     const search = searchHelper(req.query);
//     if(search.regex){
//         find.title = search.regex
//     }

//     // lọc theo trạng thái 
//     if(req.query.status){
//         find.status = req.query.status;
//     }

//     // tính năng lọc theo tiêu chí
//     const sort = {};
//     if(req.query.sortKey&&req.query.sortValue){
//         sort[req.query.sortKey] = req.query.sortValue;
//     }else {
//         sort.position = "desc"
//     }

//     // tính năng phân trang 
//     let initPagination = {
//         currentPage: 1,
//         limitItem: 8
//     }

//     const countProductCategory = await ProductCategory.countDocuments(find);
//     const ojectPanigation = paginationHelper(
//         initPagination,
//         req.query,
//         countProductCategory
//     )

//     const producCategoryt = await ProductCategory.find(find).sort(sort).limit(ojectPanigation.limitItem).skip(ojectPanigation.skip)

//     const newrecord = createTreeHelper.tree(producCategoryt)

//     const childrenCategory = [];
//     const parentCategory = [];

//     producCategoryt.forEach(category=>{
//         if(!category.parent_id){
//             parentCategory.push(category)
//         }else {
//             childrenCategory.push(category)
//         }
//     })

//     res.json({
//         record: newrecord,
//         parentCategory: parentCategory,
//         childrenCategory: childrenCategory,
//         code: 200,
//         message: "success"
//     })
// }
module.exports.productsCategory = async (req, res) => {
    try {
        const find = {
            deleted: false,
            status: "active"
        };

        // Tìm kiếm theo title
        const search = searchHelper(req.query);
        if (search.regex) {
            find.title = search.regex;
        }

        // Lọc theo status nếu có
        if (req.query.status) {
            find.status = req.query.status;
        }

        // Sắp xếp
        const sort = {};
        if (req.query.sortKey && req.query.sortValue) {
            sort[req.query.sortKey] = req.query.sortValue;
        } else {
            sort.position = "desc";
        }

        // Phân trang
        let initPagination = {
            currentPage: 1,
            limitItem: 8
        };

        const countProductCategory = await ProductCategory.countDocuments(find);
        const pagination = paginationHelper(
            initPagination,
            req.query,
            countProductCategory
        );

        // Truy vấn danh mục theo điều kiện tìm kiếm, sắp xếp, phân trang
        const productCategories = await ProductCategory.find(find)
            .sort(sort)
            .limit(pagination.limitItem)
            .skip(pagination.skip);

        // Tạo cây danh mục từ danh sách truy vấn
        const categoryTree = createTreeHelper.tree(productCategories);

        // Trả về dữ liệu theo format chuẩn FE dễ dùng
        return res.json({
            status: true,
            message: "Lấy danh sách danh mục thành công",
            data: categoryTree
        });
        
    } catch (error) {
        console.error("Lỗi productsCategory:", error);
        return res.status(500).json({
            status: false,
            message: "Đã có lỗi xảy ra",
            error: error.message
        });
    }
};


module.exports.create = async (req, res)=>{

    try {
        if(req.body.position == ""){
            const count = await ProductCategory.countDocuments()
            req.body.position = count + 1;
        }else {
            req.body.position = parseInt(req.body.position);
        }
        const record = new ProductCategory(req.body);
        await record.save()
        res.json({
            code: 200,
            message: "tạo mới danh muc thanh cong"
        })
    
    } catch (error) {
        res.json({
            code: 404,
            message: "tạo mới danh muc Khong thanh cong",
            error: error
        })
    }
}

module.exports.edit = async (req, res)=>{
    
    try {
        const id = req.params.id;

        await ProductCategory.updateOne({_id: id}, req.body);
     
        res.json({
            code: 200,
            message: "chỉnh sửa thành công"
        }) 
    } catch (error) {
        res.json({
            code: 400,
            message: "sửa không thành công"
        }) 
    }   
}

module.exports.delete = async (req, res)=>{

    try {
        const id = req.params.id;
        await ProductCategory.updateOne({_id: id}, {deleted: true})
        res.json({
            code: 200,
            message: "xóa thành công"
        }) 
    } catch (error) {
        res.json({
            code: 200,
            message: "xóa khong thành công"
        }) 
    }
}

module.exports.detail = async (req, res)=>{
    
    try {
        const id = req.params.id
        const producCategoryt = await ProductCategory.findOne({_id: id}, {deleted: false});
        res.json({
            data: producCategoryt,
            code: 200,
            message: "Lấy thông tin chi tiêt thành công"
        }) 
    } catch (error) {
        
    }
}

module.exports.changeStatus = async (req, res)=>{
    try {
        const id = req.params.id;
        const status = req.body.status;
        await ProductCategory.updateOne({_id: id}, {status: status});
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
        console.log(ids);
        console.log(key);
        console.log(value);
        
        switch (key) {
            case "status":
                await ProductCategory.updateMany({_id: {$in: ids}}, {
                    status: value
                })
                res.json({
                    code: 200,
                    message: "cập nhật thành công"
                })
                break;
            case "deleted": 
                await ProductCategory.updateMany({_id: {$in: ids}}, {
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
        
        res.json({
            code: 200,
            message: "chỉnh sửa thành công"
        }) 
    } catch (error) {
        
    }
}