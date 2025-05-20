const Article = require("../../../model/article.model");
const srearchHelper = require("../../../helper/search.helper");
const ArticleCategory = require("../../../model/articleCategory.model");
const articleCategoryHelper = require("../../../helper/articleCategory");
const paginationHelper = require("../../../helper/pagination.helper");
const { articleCategory } = require("./articleCategory.controller");

module.exports.article = async (req, res) => {
  const find = {
    deleted: false,
    status: "active",
  };

  // chuc nang phan trang
  let initPagination = {
    currentPage: 1,
    limitItem: 10,
  };
  const countArticle = await Article.countDocuments(find);
  const ojectPanigation = paginationHelper(
    initPagination,
    req.query,
    countArticle
  );

  // tinh nang sap sep theo tieu chi
  const sort = {};
  if (req.query.sortKey && req.query.sortValue) {
    sort[req.query.sortKey] = req.query.sortValue;
  } else {
    sort.position = "desc";
  }

  // chuc nang tim kiem
  const search = srearchHelper(req.query);
  if (search.regex) {
    find.title = search.regex;
  }

  const article = await Article.find(find)
    .sort(sort)
    .limit(ojectPanigation.limitItem)
    .skip(ojectPanigation.skip);

  res.json([
    {
      data: article,
      page: req.query.page,
      limit: req.query.limit,
      code: 200,
      message: "hiện thị thành công",
    },
  ]);
};

module.exports.detail = async (req, res) => {
  try {
    console.log(req.params.slugArticle);

    const find = {
      deleted: false,
      slug: req.params.slugArticle,
      status: "active",
    };

    const article = await Article.findOne(find);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    // Gắn category nếu có

    // Lấy danh sách sản phẩm nổi bật
    const relatedArticle = await Article.find({
      featured: "1",
      deleted: false,
      status: "active",
    });

    // Trả về dữ liệu JSON
    return res.status(200).json({
      success: true,
      data: {
        article: article || null,
        relatedArticle: relatedArticle || [],
      },
    });
  } catch (error) {
    console.error("Error fetching article detail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// module.exports.slugCategory = async (req, res) => {
//     try {
//         const slug = req.params.slug;

//         // Tìm danh mục theo slug
//         const category = await ArticleCategory.findOne({
//             slug: slug,
//             deleted: false
//         });

//         if (!category) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Category not found"
//             });
//         }

//         // Pagination setup
//         let ojectPage = {
//             currentPage: 1,
//             itemPage: 6
//         };

//         if (req.query.page) {
//             ojectPage.currentPage = parseInt(req.query.page);
//         }

//         ojectPage.skip = (ojectPage.currentPage - 1) * ojectPage.itemPage;

//         // Lấy toàn bộ danh mục con
//         const listCategory = await articleCategoryHelper.getSubCategory(category._id);
//         const listCategoryId = listCategory.map(item => item._id.toString());

//         // Gộp danh mục cha + con
//         const allCategoryIds = [category._id.toString(), ...listCategoryId];

//         // Đếm tổng sản phẩm để tính tổng số trang
//         const totalProduct = await Product.countDocuments({
//             product_category_id: { $in: allCategoryIds },
//             deleted: false
//         });

//         ojectPage.totalPage = Math.ceil(totalProduct / ojectPage.itemPage);

//         // Lấy sản phẩm phân trang
//         const article = await Article.find({
//             product_category_id: { $in: allCategoryIds },
//             deleted: false,
//             status: "active"
//         })
//             .sort({ position: "desc" })
//             .limit(ojectPage.itemPage)
//             .skip(ojectPage.skip);

//         // Trả JSON
//         return res.status(200).json({
//             success: true,
//             data: {
//                 category: {
//                     id: category._id,
//                     title: category.title,
//                     slug: category.slug
//                 },
//                 pagination: ojectPage
//             }
//         });

//     } catch (error) {
//         console.error("Error in slugCategory API:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

module.exports.slugCategory = async (req, res) => {
  try {
    const slug = req.params.slug;

    // Tìm danh mục theo slug
    const category = await ArticleCategory.findOne({
      slug: slug,
      deleted: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Pagination setup
    let ojectPage = {
      currentPage: 1,
      itemPage: 6,
    };

    if (req.query.page) {
      ojectPage.currentPage = parseInt(req.query.page);
    }

    ojectPage.skip = (ojectPage.currentPage - 1) * ojectPage.itemPage;

    // Lấy toàn bộ danh mục con
    const listCategory = await articleCategoryHelper.getSubCategory(
      category._id
    );
    const listCategoryId = listCategory.map((item) => item._id.toString());

    // Gộp danh mục cha + con
    const allCategoryIds = [category._id.toString(), ...listCategoryId];

    // Đếm tổng sản phẩm để tính tổng số trang
    const totalProduct = await Article.countDocuments({
      articleCategory: { $in: allCategoryIds },
      deleted: false,
    });

    ojectPage.totalPage = Math.ceil(totalProduct / ojectPage.itemPage);

    // Lấy sản phẩm phân trang
    const article = await Article.find({
      articleCategory: { $in: allCategoryIds },
      deleted: false,
      status: "active",
    })
      .sort({ position: "desc" })
      .limit(ojectPage.itemPage)
      .skip(ojectPage.skip);

    // Trả JSON
    return res.status(200).json({
      success: true,
      data: {
        category: {
          id: category._id,
          title: category.title,
          slug: category.slug,
        },
        article,
        pagination: ojectPage,
      },
    });
  } catch (error) {
    console.error("Error in slugCategory API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
