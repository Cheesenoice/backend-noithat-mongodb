const User = require("../../../model/user.model");
const searchHelper = require("../../../helper/search.helper");
const paginationHelper = require("../../../helper/pagination.helper");
const Account = require("../../../model/account.model");
module.exports.listUser = async (req, res) => {
  try {
    const find = {
      deleted: false,
      // status: "active", // Remove this line to not filter by status
    };

    // Lọc theo trạng thái nếu có
    // if (req.query.status) {
    //   find.status = req.query.status;
    // }

    // Tìm kiếm theo title
    const search = searchHelper(req.query);
    if (search.regex) {
      find.title = search.regex;
    }

    // Phân trang
    let initPagination = {
      currentPage: 1,
      limitItem: 8,
    };

    const countProduct = await User.countDocuments(find);
    const ojectPanigation = paginationHelper(
      initPagination,
      req.query,
      countProduct
    );

    // Sắp xếp
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue;
    } else {
      sort.position = "desc";
    }

    const users = await User.find(find)
      .sort(sort)
      .limit(ojectPanigation.limitItem)
      .skip(ojectPanigation.skip)
      .select("-token -passWord");

    // Lấy thông tin cập nhật gần nhất cho mỗi user
    const finalUserList = await Promise.all(
      users.map(async (record) => {
        let lastUpdater = {
          name: "Not updated yet",
          time: record.createdAt,
        };

        if (record.updatedBy && record.updatedBy.length > 0) {
          const lastUpdate = record.updatedBy.slice(-1)[0];
          if (lastUpdate && lastUpdate.account_id) {
            const userUpdate = await Account.findOne({
              _id: lastUpdate.account_id,
            });
            lastUpdater = {
              name: userUpdate ? userUpdate.fullName : "Account Not Found",
              time: lastUpdate.updatedAt || record.updatedAt,
            };
          }
        }

        return {
          ...record._doc,
          lastUpdater: lastUpdater,
        };
      })
    );

    // Trả kết quả duy nhất ở đây
    res.json({
      data: finalUserList,
      code: 200,
      message: "Thành công",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      error: error.message || "Internal Server Error",
    });
  }
};

module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;
    const updateBy = {
      account_id: req.user.id,
      updateAt: new Date(),
    };
    await User.updateOne(
      { _id: id },
      {
        status: status,
        deleted: false,
        $push: { updatedBy: updateBy },
      }
    );
    const account = await User.findOne({
      _id: id,
      deleted: false,
    }).select("-passWord -token");
    res.json({
      data: account,
      code: 200,
      message: "change status success",
    });
  } catch (error) {}
};

module.exports.changeMulti = async (req, res) => {
  try {
    const { ids, key, value } = req.body;
    const updateBy = {
      account_id: req.user.id,
      updateAt: new Date(),
    };
    switch (key) {
      case "status":
        await User.updateMany(
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
        await User.updateMany(
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
