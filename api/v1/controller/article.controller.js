const Article = require("../../../model/article.model");
const searchHelper = require("../../../helper/search.helper");
const paginationHelper = require("../../../helper/pagination.helper");
const Account = require("../../../model/account.model");
// module.exports.article = async (req, res)=>{
//     try {
//         const find = {
//             deleted: false

//         }
//         const search = searchHelper(req.query);

//         if(search.regex){
//             find.title = search.regex
//         }

//         if(req.query.status){
//             find.status = req.query.status
//         }

//         // chuc nang phan trang
//         let initPagination = {
//             currentPage: 1,
//             limitItem: 10
//         }
//         const countProduct = await Article.countDocuments(find);
//         const ojectPanigation = paginationHelper(
//             initPagination,
//             req.query,
//             countProduct
//         )

//         // tinh nang sap sep theo tieu chi
//         const sort = {};
//             if(req.query.sortKey && req.query.sortValue){
//                 sort[req.query.sortKey] = req.query.sortValue;
//             } else {
//                 sort.position = "desc";
//             }

//         const article = await Article.find(find).sort(sort).limit(ojectPanigation.limitItem).skip(ojectPanigation.skip)
//         const articalData = await Promise.all(article.map(async (item) => {
//                 try {
//                     // Lấy thông tin người tạo
//                     let accountFullName = "Unknown";
//                     if (item.createBy && item.createBy.account_id) {
//                         const user = await Account.findOne({
//                             _id: item.createBy.account_id
//                         });
//                         accountFullName = user ? user.fullName : "Account Not Found";
//                     }

//                     // Lấy thông tin người cập nhật gần nhất
//                     let lastUpdater = {
//                         name: "Not updated yet",
//                         time: item.createdAt // Mặc định dùng thời gian tạo nếu chưa cập nhật
//                     };

//                     if (item.updatedBy && item.updatedBy.length > 0) {
//                         const lastUpdate = item.updatedBy.slice(-1)[0]; // Lấy bản ghi cập nhật cuối cùng
//                         if (lastUpdate && lastUpdate.account_id) {
//                             const userUpdate = await Account.findOne({
//                                 _id: lastUpdate.account_id
//                             });
//                             lastUpdater = {
//                                 name: userUpdate ? userUpdate.fullName : "Account Not Found",
//                                 time: lastUpdate.updatedAt || item.updatedAt
//                             };
//                         }
//                     }

//                     return {
//                         ...item._doc,
//                         accountFullName: accountFullName,
//                         articalName: item.title,
//                         lastUpdater: lastUpdater // Thông tin người cập nhật gần nhất
//                     };
//                 } catch (error) {
//                     console.error(`Error processing product ${item._id}:`, error);
//                     return {
//                         ...item._doc,
//                         accountFullName: "Error",
//                         articalName: item.title,
//                         lastUpdater: { name: "Error", time: item.createdAt }
//                     };
//                 }
//             }));

//             res.json([{
//                 data: articalData,
//                 page: req.query.page,
//                 limit: req.query.limit,
//                 code: 200,
//                 message: "Hiển thị thành công"
//             }]);
//     } catch (error) {
//         res.json({
//             code: 400,
//             message: error
//         })
//     }
// }
module.exports.article = async (req, res) => {
  try {
    const find = { deleted: false };

    // Xử lý tìm kiếm theo tiêu đề
    const search = searchHelper(req.query);
    if (search.regex) {
      find.title = search.regex;
    }

    // Lọc theo trạng thái
    if (req.query.status) {
      find.status = req.query.status;
    }

    // Cấu hình phân trang
    const initPagination = {
      currentPage: 1,
      limitItem: 10,
    };

    const countArticle = await Article.countDocuments(find);
    const pagination = paginationHelper(
      initPagination,
      req.query,
      countArticle
    );

    // Xử lý sắp xếp
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue === "desc" ? -1 : 1;
    } else {
      sort.position = -1;
    }

    // Lấy danh sách bài viết
    const articles = await Article.find(find)
      .sort(sort)
      .limit(pagination.limitItem)
      .skip(pagination.skip);

    // Gắn thêm thông tin người tạo và người cập nhật gần nhất
    const articleData = await Promise.all(
      articles.map(async (item) => {
        try {
          // Lấy thông tin người tạo
          let accountFullName = "Unknown";
          if (item.createBy?.account_id) {
            const user = await Account.findById(item.createBy.account_id);
            accountFullName = user ? user.fullName : "Account Not Found";
          }

          // Lấy thông tin người cập nhật gần nhất
          let lastUpdater = {
            name: "Not updated yet",
            time: item.createdAt,
          };

          if (Array.isArray(item.updatedBy) && item.updatedBy.length > 0) {
            const lastUpdate = item.updatedBy[item.updatedBy.length - 1];
            if (lastUpdate?.account_id) {
              const userUpdate = await Account.findById(lastUpdate.account_id);
              lastUpdater = {
                name: userUpdate ? userUpdate.fullName : "Account Not Found",
                time: lastUpdate.updatedAt || item.updatedAt || item.createdAt,
              };
            }
          }

          return {
            ...item._doc,
            accountFullName,
            lastUpdater,
          };
        } catch (innerErr) {
          console.error(`Error processing article ${item._id}:`, innerErr);
          return {
            ...item._doc,
            accountFullName: "Error",
            lastUpdater: {
              name: "Error",
              time: item.createdAt,
            },
          };
        }
      })
    );
    return res.json({
      data: articleData,
      page: pagination.currentPage,
      limit: pagination.limitItem,
      code: 200,
      message: "Hiển thị thành công",
    });
  } catch (error) {
    console.error("Error in article list:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports.create = async (req, res) => {
  try {
    console.log(req.body);

    // Kiểm tra user tồn tại không
    if (!req.user || !req.user.id) {
      return res.json({
        code: 401,
        message: "Không xác định được người dùng",
      });
    }

    // Xử lý vị trí nếu không có
    if (
      req.body.position === "" ||
      req.body.position === undefined ||
      req.body.position === null
    ) {
      const articleCount = await Article.countDocuments();
      req.body.position = articleCount + 1;
    } else {
      req.body.position = parseInt(req.body.position);
      if (isNaN(req.body.position)) {
        return res.json({
          code: 400,
          message: "Giá trị position không hợp lệ",
        });
      }
    }

    // Gán thông tin người tạo
    req.body.createBy = {
      account_id: req.user.id, // bạn ghi nhầm `res.user.id` => phải là `req.user.id`
      createAt: new Date(),
    };

    const article = new Article(req.body);
    await article.save();

    res.json({
      data: article,
      code: 200,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.json({
      code: 500, // sửa lại mã lỗi hợp lý hơn (500 = internal server error)
      message: "Không thành công",
      error: error.message, // nên chỉ trả về `message` thay vì toàn bộ object error
    });
  }
};

module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await Article.updateOne({ _id: id }, { deleted: true });
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
    const updatedBy = {
      account_id: req.user.id, // bạn ghi nhầm `res.user.id` => phải là `req.user.id`
      createAt: new Date(),
    };

    await Article.updateOne(
      { _id: id },
      {
        ...req.body,
        $push: { updatedBy: updatedBy },
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

    const article = await Article.findOne(
      { _id: id },
      {
        deleted: false,
      }
    );
    res.json({
      data: article,
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
    const updatedBy = {
      account_id: req.user.id, // bạn ghi nhầm `res.user.id` => phải là `req.user.id`
      createAt: new Date(),
    };
    await Article.updateOne(
      { _id: id },
      { status: status, $push: { updatedBy: updatedBy } }
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
    const updatedBy = {
      account_id: req.user.id, // bạn ghi nhầm `res.user.id` => phải là `req.user.id`
      createAt: new Date(),
    };
    switch (key) {
      case "status":
        await Article.updateMany(
          { _id: { $in: ids } },
          {
            status: value,
            $push: { updatedBy: updatedBy },
          }
        );
        res.json({
          code: 200,
          message: "cập nhật thành công",
        });
        break;
      case "deleted":
        await Article.updateMany(
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
