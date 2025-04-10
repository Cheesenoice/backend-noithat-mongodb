// chúng ta tách nỏ các trang thành các controller(nơi sử lý code của các trang )
// mô hình này giúp chúng ta dễ dàng xử lí hơn

// nhung model vào de render ra do dien

const Product = require("../../../model/product.model");
const piceHelper = require("../../../helper/product.priceNew")
const srearchHelper = require("../../../helper/search.helper")
const ProductCategory = require("../../../model/product.category.modle")
const productCategoryHelper = require("../../../helper/product-category")
const paginationHelper = require("../../../helper/pagination.helper")

module.exports.product = async (req, res) => {  

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
            
    
        // chuc nang tim kiem
        const search = srearchHelper(req.query)
        if(search.regex){
            find.title = search.regex
        }
    
        const product = await Product.find(find).sort(sort).limit(ojectPanigation.limitItem).skip(ojectPanigation.skip)    
        
    
        const newProducts = product.map(item => {  // su dung map de tinh toan gia thep phan tram giam gia discountPercentage: phan tram giam gia
            item.priceNew = (item.price*(100 - item.discountPercentage)/100).toFixed(0); // ham tinh gia theo phan tram giam gia lay ra gia moi 
            item.priceNew = item.priceNew;        
            return item;                                                                            // ham toFixed giup loai bo cac dau sau dau phay      
        })        
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

module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            slug: req.params.slugProduct,
            status: "active"
        };

        const product = await Product.findOne(find);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Gắn category nếu có
        if (product.product_category_id) {
            const category = await ProductCategory.findOne({
                _id: product.product_category_id,
                deleted: false,
                status: 'active'
            });

            product.category = category || null;
        }

        // Tính giá mới
        product.priceNew = piceHelper.productPriceNew(product);

        // Lấy danh sách sản phẩm nổi bật
        const relatedProducts = await Product.find({
            featured: "1",
            deleted: false,
            status: "active"
        });

        // Trả về dữ liệu JSON
        return res.status(200).json({
            success: true,
            data: {
                product,
                relatedProducts
            }
        });

    } catch (error) {
        console.error("Error fetching product detail:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports.slugCategory = async (req, res) => {
    try {
        const slug = req.params.slug;

        // Tìm danh mục theo slug
        const category = await ProductCategory.findOne({
            slug: slug,
            deleted: false
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Pagination setup
        let ojectPage = {
            currentPage: 1,
            itemPage: 6
        };

        if (req.query.page) {
            ojectPage.currentPage = parseInt(req.query.page);
        }

        ojectPage.skip = (ojectPage.currentPage - 1) * ojectPage.itemPage;

        // Lấy toàn bộ danh mục con
        const listCategory = await productCategoryHelper.getSubCategory(category._id);
        const listCategoryId = listCategory.map(item => item._id.toString());

        // Gộp danh mục cha + con
        const allCategoryIds = [category._id.toString(), ...listCategoryId];

        // Đếm tổng sản phẩm để tính tổng số trang
        const totalProduct = await Product.countDocuments({
            product_category_id: { $in: allCategoryIds },
            deleted: false
        });

        ojectPage.totalPage = Math.ceil(totalProduct / ojectPage.itemPage);

        // Lấy sản phẩm phân trang
        const product = await Product.find({
            product_category_id: { $in: allCategoryIds },
            deleted: false,
            status: "active"
        })
            .sort({ position: "desc" })
            .limit(ojectPage.itemPage)
            .skip(ojectPage.skip);

        // Format lại nếu cần (VD: tính giá mới)
        const productFormatted = piceHelper.productFeature(product);

        // Trả JSON
        return res.status(200).json({
            success: true,
            data: {
                category: {
                    id: category._id,
                    title: category.title,
                    slug: category.slug
                },
                products: productFormatted,
                pagination: ojectPage
            }
        });

    } catch (error) {
        console.error("Error in slugCategory API:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
