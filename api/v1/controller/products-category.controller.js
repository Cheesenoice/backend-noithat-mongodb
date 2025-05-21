const ProductCategory = require("../../../model/product.category.modle");
const searchHelper = require("../../../helper/search.helper");
const paginationHelper = require("../../../helper/pagination.helper");
const createTreeHelper = require("../../../helper/category");
const Account = require("../../../model/account.model");

module.exports.productsCategory = async (req, res) => {
  try {
    const find = {
      deleted: false,
      // status: "active" // Remove this line to get all statuses
    };

    // Tìm kiếm theo title
    const search = searchHelper(req.query);
    if (search.regex) {
      find.title = search.regex;
    }

    // Remove status filter logic
    // if (req.query.status) {
    //     find.status = req.query.status;
    // }

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
      limitItem: 8,
    };

    const countProductCategory = await ProductCategory.countDocuments(find);
    const pagination = paginationHelper(
      initPagination,
      req.query,
      countProductCategory
    );

    // Truy vấn danh mục theo điều kiện tìm kiếm, sắp xếp, phân trang
    const productCategories = await ProductCategory.find(find).sort(sort);

    const productData = await Promise.all(
      productCategories.map(async (item) => {
        try {
          // Lấy thông tin người tạo
          let accountFullName = "Unknown";
          if (item.createBy && item.createBy.account_id) {
            const user = await Account.findOne({
              _id: item.createBy.account_id,
            });
            accountFullName = user ? user.fullName : "Account Not Found";
          }

          // Lấy thông tin người cập nhật gần nhất
          let lastUpdater = {
            name: "Not updated yet",
            time: item.createdAt, // Mặc định dùng thời gian tạo nếu chưa cập nhật
          };

          if (item.updatedBy && item.updatedBy.length > 0) {
            const lastUpdate = item.updatedBy.slice(-1)[0]; // Lấy bản ghi cập nhật cuối cùng
            if (lastUpdate && lastUpdate.account_id) {
              const userUpdate = await Account.findOne({
                _id: lastUpdate.account_id,
              });
              lastUpdater = {
                name: userUpdate ? userUpdate.fullName : "Account Not Found",
                time: lastUpdate.updatedAt || item.updatedAt,
              };
            }
          }

          return {
            ...item._doc,
            accountFullName: accountFullName,
            productCategoryName: item.title,
            lastUpdater: lastUpdater, // Thông tin người cập nhật gần nhất
          };
        } catch (error) {
          console.error(`Error processing product ${item._id}:`, error);
          return {
            ...item._doc,
            priceNew: item.price.toString(),
            accountFullName: "Error",
            productName: item.title,
            lastUpdater: { name: "Error", time: item.createdAt },
          };
        }
      })
    );

    // Tạo cây danh mục từ danh sách truy vấn
    const categoryTree = createTreeHelper.tree(productData);

    // Trả về dữ liệu theo format chuẩn FE dễ dùng
    res.json([
      {
        data: categoryTree,
        page: req.query.page,
        limit: req.query.limit,
        code: 200,
        message: "Hiển thị thành công",
      },
    ]);
  } catch (error) {
    console.error("Lỗi productsCategory:", error);
    return res.status(500).json({
      status: false,
      message: "Đã có lỗi xảy ra",
      error: error.message,
    });
  }
};

module.exports.create = async (req, res) => {
  try {
    if (req.body.position == "") {
      const count = await ProductCategory.countDocuments();
      req.body.position = count + 1;
    } else {
      req.body.position = parseInt(req.body.position);
    }
    req.body.createBy = {
      account_id: res.locals.user.id,
      createAt: new Date(),
    };
    const record = new ProductCategory(req.body);
    await record.save();
    res.json({
      data: record,
      code: 200,
      message: "tạo mới danh muc thanh cong",
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "tạo mới danh muc Khong thanh cong",
      error: error,
    });
  }
};

module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    const updateBy = {
      account_id: res.locals.user.id,
      updateAt: new Date(),
    };
    req.body.updateBy = updateBy;
    await ProductCategory.updateOne(
      { _id: id },
      {
        ...req.body,
        $push: { updatedBy: updateBy },
      }
    );

    res.json({
      code: 200,
      message: "chỉnh sửa thành công",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: "sửa không thành công",
    });
  }
};

module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const Product = require("../../../model/product.model");
    // Kiểm tra sản phẩm thuộc category này
    const productCount = await Product.countDocuments({
      product_category_id: id,
      deleted: false,
    });
    if (productCount > 0) {
      return res.json({
        code: 400,
        message: "Không thể xóa: vẫn còn sản phẩm thuộc danh mục này!",
      });
    }
    // Kiểm tra subcategory
    const subCategoryCount = await ProductCategory.countDocuments({
      parent_id: id,
      deleted: false,
    });
    if (subCategoryCount > 0) {
      return res.json({
        code: 400,
        message: "Không thể xóa: danh mục này vẫn còn danh mục con!",
      });
    }
    await ProductCategory.updateOne({ _id: id }, { deleted: true });
    res.json({
      code: 200,
      message: "xóa thành công",
    });
  } catch (error) {
    res.json({
      code: 200,
      message: "xóa khong thành công",
    });
  }
};

module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const producCategoryt = await ProductCategory.findOne(
      { _id: id },
      { deleted: false }
    );
    res.json({
      data: producCategoryt,
      code: 200,
      message: "Lấy thông tin chi tiêt thành công",
    });
  } catch (error) {}
};

module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;
    const updateBy = {
      account_id: res.locals.user.id,
      updateAt: new Date(),
    };
    await ProductCategory.updateOne(
      { _id: id },
      { status: status, $push: { updatedBy: updateBy } }
    );
    res.json({
      code: 200,
      message: "thay đổi trạng thái thành công",
    });
  } catch (error) {}
};

module.exports.changeMulti = async (req, res) => {
  try {
    const { ids, key, value } = req.body;
    const updateBy = {
      account_id: res.locals.user.id,
      updateAt: new Date(),
    };

    switch (key) {
      case "status":
        await ProductCategory.updateMany(
          { _id: { $in: ids } },
          {
            status: value,
            $push: { updatedBy: updateBy },
          }
        );
        res.json({
          code: 200,
          message: "cập nhật thành công",
        });
        break;
      case "deleted":
        await ProductCategory.updateMany(
          { _id: { $in: ids } },
          {
            deleted: value,
            deletedAt: new Date(),
          }
        );
        res.json({
          code: 200,
          message: "cập nhật thành công",
        });
        break;
      default:
        res.json({
          code: 404,
          message: "Không thành công",
        });
        break;
    }

    res.json({
      code: 200,
      message: "chỉnh sửa thành công",
    });
  } catch (error) {}
};
