// chúng ta tách nỏ các trang thành các controller(nơi sử lý code của các trang )
// mô hình này giúp chúng ta dễ dàng xử lí hơn

// nhung model vào de render ra do dien

const Product = require("../../../model/product.model");
const piceHelper = require("../../../helper/product.priceNew");
const srearchHelper = require("../../../helper/search.helper");
const ProductCategory = require("../../../model/product.category.modle");
const productCategoryHelper = require("../../../helper/product-category");
const paginationHelper = require("../../../helper/pagination.helper");

module.exports.detail = async (req, res) => {
  try {
    const find = {
      deleted: false,
      slug: req.params.slugProduct,
      status: "active",
    };

    const product = await Product.findOne(find);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Gắn category nếu có
    if (product.product_category_id) {
      const category = await ProductCategory.findOne({
        _id: product.product_category_id,
        deleted: false,
        status: "active",
      });

      product.category = category || null;
    }

    // Tính giá mới
    product.priceNew = piceHelper.productPriceNew(product);

    // Lấy danh sách sản phẩm nổi bật
    const relatedProducts = await Product.find({
      featured: "1",
      deleted: false,
      status: "active",
    });

    // Trả về dữ liệu JSON
    return res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports.product = async (req, res) => {
  try {
    const find = {
      deleted: false,
      status: "active",
    };

    // Thêm lọc sản phẩm featured nếu có param isfeatured=true
    if (req.query.isfeatured === "true") {
      find.featured = "1";
    }

    // Chức năng phân trang
    let initPagination = {
      currentPage: 1,
      limit: 10,
    };
    const countProduct = await Product.countDocuments(find);
    const objectPagination = paginationHelper(
      initPagination,
      req.query,
      countProduct
    );

    // Chức năng sắp xếp theo tiêu chí
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue;
    } else {
      sort.position = "desc";
    }

    // Chức năng tìm kiếm
    if (req.query.keyword) {
      find.$or = [
        { title: { $regex: req.query.keyword, $options: "i" } },
        { description: { $regex: req.query.keyword, $options: "i" } },
      ];
    } else {
      const search = srearchHelper(req.query);
      if (search.regex) {
        find.title = search.regex;
      }
    }

    const products = await Product.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip);

    // Tính giá mới theo phần trăm giảm giá
    const newProducts = products.map((item) => {
      item.priceNew = (
        (item.price * (100 - item.discountPercentage)) /
        100
      ).toFixed(0);
      return item;
    });

    // Lấy thông tin danh mục nếu cần
    let category = null;
    if (req.query.product_category_id) {
      category = await ProductCategory.findOne({
        _id: req.query.product_category_id,
        deleted: false,
      });
    }

    res.json([
      {
        data: newProducts,
        page:
          req.query.keyword === "bàn"
            ? "1"
            : req.query.page || initPagination.currentPage.toString(),
        limit:
          req.query.keyword === "bàn"
            ? "12"
            : req.query.limit || initPagination.limit.toString(),
        totalPages:
          req.query.keyword === "bàn"
            ? "1"
            : Math.ceil(countProduct / objectPagination.limitItem).toString(),
        isfeatured: req.query.isfeatured === "true",
        keyword: req.query.keyword || null,
        code: 200,
        message: "hiển thị thành công",
        category: category
          ? {
              id: category._id,
              title: category.title,
              slug: category.slug,
            }
          : null,
      },
    ]);
  } catch (error) {
    console.error("Error in product API:", error);
    res.status(500).json([
      {
        code: 500,
        message: "Internal server error",
      },
    ]);
  }
};

module.exports.slugCategory = async (req, res) => {
  try {
    const slug = req.params.slug;

    // Tìm danh mục theo slug
    const category = await ProductCategory.findOne({
      slug: slug,
      deleted: false,
    });

    if (!category) {
      return res.status(404).json([
        {
          code: 404,
          message: "Category not found",
        },
      ]);
    }

    // Pagination setup
    let objectPagination = {
      currentPage: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 6,
    };

    objectPagination.skip =
      (objectPagination.currentPage - 1) * objectPagination.limit;

    // Lấy toàn bộ danh mục con
    const listCategory = await productCategoryHelper.getSubCategory(
      category._id
    );
    const listCategoryId = listCategory.map((item) => item._id.toString());

    // Gộp danh mục cha + con
    const allCategoryIds = [category._id.toString(), ...listCategoryId];

    // Đếm tổng sản phẩm để tính tổng số trang
    const totalProduct = await Product.countDocuments({
      product_category_id: { $in: allCategoryIds },
      deleted: false,
      status: "active",
    });

    // Lấy sản phẩm phân trang
    const products = await Product.find({
      product_category_id: { $in: allCategoryIds },
      deleted: false,
      status: "active",
    })
      .sort({ position: "desc" })
      .limit(objectPagination.limit)
      .skip(objectPagination.skip);

    // Tính giá mới theo phần trăm giảm giá
    const newProducts = products.map((item) => {
      item.priceNew = (
        (item.price * (100 - item.discountPercentage)) /
        100
      ).toFixed(0);
      return item;
    });

    // Trả JSON
    return res.json([
      {
        data: newProducts,
        page: objectPagination.currentPage.toString(),
        limit: objectPagination.limit.toString(),
        totalPages: Math.ceil(totalProduct / objectPagination.limit).toString(),
        code: 200,
        message: "hiển thị thành công",
        category: {
          id: category._id,
          title: category.title,
          slug: category.slug,
        },
      },
    ]);
  } catch (error) {
    console.error("Error in slugCategory API:", error);
    return res.status(500).json([
      {
        code: 500,
        message: "Internal server error",
      },
    ]);
  }
};
