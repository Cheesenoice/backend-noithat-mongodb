const Product = require("../../../model/product.model");
// const ProductCategory = require("../../../model/product.category.modle")
const searchHelper = require("../../../helper/search.helper");
const paginationHelper = require("../../../helper/pagination.helper");
// const treeHelper = require("../../../helper/category");
const Account = require("../../../model/account.model");
const { connectors } = require("googleapis/build/src/apis/connectors");

module.exports.product = async (req, res) => {
  const find = {
    deleted: false,
    // status: "active", // Remove this line to not filter by status
  };

  // Pagination
  let initPagination = {
    currentPage: 1,
    limitItem: 10,
  };
  const countProduct = await Product.countDocuments(find);
  const ojectPanigation = paginationHelper(
    initPagination,
    req.query,
    countProduct
  );

  // Sorting
  const sort = {};
  if (req.query.sortKey && req.query.sortValue) {
    sort[req.query.sortKey] = req.query.sortValue;
  } else {
    sort.position = "desc";
  }

  // Remove status filter
  // if(req.query.status){
  //     find.status = req.query.status
  // }

  // Search
  const search = searchHelper(req.query);
  if (search.regex) {
    find.title = search.regex;
  }

  // Lấy danh sách sản phẩm
  const products = await Product.find(find)
    .sort(sort)
    .limit(ojectPanigation.limitItem)
    .skip(ojectPanigation.skip);

  // Tính giá mới và thêm thông tin người tạo + người cập nhật gần nhất
  const productData = await Promise.all(
    products.map(async (item) => {
      try {
        // Tính giá mới theo phần trăm giảm giá
        const priceNew = (
          (item.price * (100 - item.discountPercentage)) /
          100
        ).toFixed(0);

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
          priceNew: priceNew,
          accountFullName: accountFullName,
          productName: item.title,
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

  res.json([
    {
      data: productData,
      page: req.query.page,
      limit: req.query.limit,
      code: 200,
      message: "Hiển thị thành công",
    },
  ]);
};

module.exports.create = async (req, res) => {
  try {
    if (req.body.position == "") {
      const productCount = await Product.countDocuments(); // check người nếu người dùng không nhập vị trí thì sản phẩm tự tăng lên 1
      req.body.position = productCount + 1; // ngược lại nếu người dùng nhập thì lấy vị trí đó
    } else {
      req.body.position = parseInt(req.body.position);
    }
    req.body.createBy = {
      account_id: res.locals.user.id,
      createAt: new Date(),
    };
    const product = new Product(req.body);
    await product.save();
    res.json({
      data: product,
      code: 200,
      message: "cap nhat thanh cong",
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "khong thanh cong",
    });
  }
};

module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await Product.updateOne({ _id: id }, { deleted: true });
    // const deletedBy =  {
    //     account_id: res.locals.user.id,  // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
    //     deletedAt: new Date()
    // }
    res.json({
      code: 200,
      message: "xoa thanh cong",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: "xoa khong thanh cong",
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
    await Product.updateOne(
      { _id: id },
      {
        ...req.body, // lấy ra tát cả ác trường đã tồn tại trong database
        $push: { updatedBy: updateBy },
      }
    );
    res.json({
      code: 200,
      message: " cap nhat thanh cong",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: "cap nhat khong thanh cong",
    });
  }
};

module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne(
      { _id: id },
      {
        deleted: false,
      }
    );
    res.json({
      data: product,
      code: 200,
    });
  } catch (error) {
    res.json({
      code: 400,
      error: error,
    });
  }
};

module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;
    const updateBy = {
      account_id: res.locals.user.id,
      updateAt: new Date(),
    };
    await Product.updateOne(
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
        await Product.updateMany(
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
        await Product.updateMany(
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
  } catch (error) {
    res.json({
      code: 400,
      message: "chỉnh sửa khong thành công",
    });
  }
};
