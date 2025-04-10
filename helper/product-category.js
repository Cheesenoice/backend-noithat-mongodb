const ProductCategory = require("../model/product.category.modle")
module.exports.getSubCategory = async (parentId) =>{
    const getCategory = async (parentId)=>{
        const sub = await ProductCategory.find({
            parent_id: parentId,
            status: 'active',
            deleted: false
        })           // bóc tách sử lý phẩn chi tiết dang mục sản phẩm khi chon danh mục nào thì hiện thị sản phảm danh mục đó 
        
        let subAll = [...sub]
        for (const subs of sub) {
            const child = await getCategory(subs.id);
            subAll = subAll.concat(child)
        }
        return subAll    
    }
    const result = await getCategory(parentId)
    return result;
}

