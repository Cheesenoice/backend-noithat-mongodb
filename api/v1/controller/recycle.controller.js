module.exports.product = async (req, res) => {
    const find = {
        deleted: false,
        status: "active",
    }

    // Phân trang
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

    // Sắp xếp
    const sort = {};
    if(req.query.sortKey && req.query.sortValue){
        sort[req.query.sortKey] = req.query.sortValue;
    } else {
        sort.position = "desc";
    }

    // Lọc trạng thái
    if(req.query.status){
        find.status = req.query.status
    }        

    // Tìm kiếm
    const search = searchHelper(req.query)
    if(search.regex){
        find.title = search.regex
    }

    // Lấy danh sách sản phẩm
    const products = await Product.find(find)
        .sort(sort)
        .limit(ojectPanigation.limitItem)
        .skip(ojectPanigation.skip);

    // Tính giá mới và thêm thông tin người tạo
    const productData = await Promise.all(products.map(async (item) => {
        try {
            // Tính giá mới theo phần trăm giảm giá
            const priceNew = (item.price * (100 - item.discountPercentage) / 100).toFixed(0);
            
            // Lấy thông tin người tạo
            let accountFullName = "Unknown";
            if (item.createBy && item.createBy.account_id) {
                const user = await Account.findOne({
                    _id: item.createBy.account_id
                });
                accountFullName = user ? user.fullName : "Account Not Found";
            } else {
                console.log(`Product ${item._id} has no valid createBy data`);
            }

            return {
                ...item._doc,
                priceNew: priceNew,
                accountFullName: accountFullName,
                productName: item.title
            };
        } catch (error) {
            console.error(`Error processing product ${item._id}:`, error);
            return {
                ...item._doc,
                priceNew: item.price.toString(),
                accountFullName: "Error",
                productName: item.title
            };
        }
    }));

    // Kiểm tra và log các sản phẩm thiếu thông tin
    productData.forEach(product => {
        if (!product.accountFullName || product.accountFullName === "Unknown" || product.accountFullName === "Account Not Found") {
            console.log(`Warning: Product ${product._id} missing account name`);
        }
    });

    res.json([{
        data: productData,
        page: req.query.page,
        limit: req.query.limit,
        code: 200,
        message: "Hiển thị thành công"
    }]);
}