const Account = require("../../../model/account.model");
const Role = require("../../../model/permission.modle")
const searchHelper = require("../../../helper/search.helper")
const bcrypt = require('bcrypt');
const paginationHelper = require("../../../helper/pagination.helper");


module.exports.account = async (req, res) => {
    try {
        const find = {
            deleted: false,
            status: "active"
        };

        // Lọc theo trạng thái nếu có
        if (req.query.status) {
            find.status = req.query.status;
        }

        // Tìm kiếm theo title
        const search = searchHelper(req.query);
        if (search.regex) {
            find.title = search.regex;
        }

        // Phân trang
        let initPagination = {
            currentPage: 1,
            limitItem: 8
        };

        const countProduct = await Account.countDocuments(find);
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

        // Truy vấn account
        const accountList = await Account.find(find)
            .sort(sort)
            .limit(ojectPanigation.limitItem)
            .skip(ojectPanigation.skip)
            .select("-passWord -token");

        // Gắn role name vào mỗi account
        const finalAccountList = await Promise.all(accountList.map(async (record) => {
            const role = await Role.findOne({
                _id: record.roleId,
                deleted: false
            });

             // Lấy thông tin người tạo
             let accountFullName = "Unknown";
             if (record.createBy && record.createBy.account_id) {
                 const user = await Account.findOne({
                     _id: record.createBy.account_id
                 });
                 accountFullName = user ? user.fullName : "Account Not Found";
             }
            
             // Lấy thông tin người cập nhật gần nhất
            let lastUpdater = {
                name: "Not updated yet",
                time: record.createdAt // Mặc định dùng thời gian tạo nếu chưa cập nhật
            };
            
            if (record.updatedBy && record.updatedBy.length > 0) {
                const lastUpdate = record.updatedBy.slice(-1)[0]; // Lấy bản ghi cập nhật cuối cùng
                if (lastUpdate && lastUpdate.account_id) {
                    const userUpdate = await Account.findOne({
                        _id: lastUpdate.account_id
                    });
                    lastUpdater = {
                        name: userUpdate ? userUpdate.fullName : "Account Not Found",
                        time: lastUpdate.updatedAt || record.updatedAt
                    };
                }
            }
            return {
                ...record._doc,
                roleName: role ? role.title : "Không xác định",
                accountFullName: accountFullName,
                fullName: record.fullName,
                lastUpdater: lastUpdater 
            };
        }));

        // Trả kết quả
        res.json({
            data: finalAccountList,
            code: 200,
            message: "Thành công"
        });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách tài khoản:", error);
        res.status(500).json({
            code: 500,
            message: "Đã xảy ra lỗi",
            error: error.message
        });
    }
};




module.exports.create = async (req, res) => {
    console.log(req.body);

    try {
        const email = req.body.email;
        const passWord = req.body.passWord;
        const hashedPassword = await bcrypt.hash(passWord, 10);

        if (req.body.position == "") {
            const count = await Account.countDocuments({ deleted: false }); // thiếu await và điều kiện deleted
            req.body.position = count + 1; // gán đúng vào req.body
        } else {
            req.body.position = parseInt(req.body.position);
        }

        const exisEmail = await Account.findOne({
            email: email,
            deleted: false
        });

        if (exisEmail) {
            res.json({
                code: 404,
                message: "Tạo tài khoản không thành công, email đã tồn tại"
            });
            return;
        }  
        const exisPhone = await Account.findOne({
            email: req.body.phoneNumber,
            deleted: false
        }); 
        if (exisPhone) {
            res.json({
                code: 404,
                message: "Tạo tài khoản không thành công, số điện thoại đã tồn tại"
            });
            return;
        }      
        // Thêm thông tin người tạo
        req.user.createBy = {
            account_id: req.user.id,
            createAt: new Date()
        };

        const account = new Account({
            fullName: req.body.fullName,
            email: email,
            passWord: hashedPassword,
            phoneNumber: req.body.phoneNumber,
            avatar: req.body.avatar,
            status: req.body.status,
            position: req.body.position,
            createBy: req.user.createBy
        });

        await account.save();

        res.json({
            code: 200,
            data: account,
            message: "Thành công"
        });

    } catch (error) {
        console.error("Lỗi tạo tài khoản:", error);
        res.json({
            code: 500,
            message: "Đã xảy ra lỗi",
            error: error.message
        });
    }
};





module.exports.edit = async (req, res)=>{
    try {
        const id = req.params.id;
        let passWord = req.body.passWord;
    
        // Kiểm tra nếu đã tồn tại email hoặc số điện thoại (trừ chính user đang sửa)
        const emailExist = await Account.findOne({
            _id: { $ne: id },   
            $or: [
                { email: req.body.email },
                { phoneNumber: req.body.phoneNumber }
            ],
            deleted: false
        });
    
        if (emailExist) {
            return res.json({
                code: 400,
                message: "Email hoặc số điện thoại đã tồn tại."
            });
        }
        
        // Xử lý mật khẩu nếu có nhập mới
        if (passWord && passWord.trim() !== "") {
            req.body.passWord = await bcrypt.hash(passWord, 10);
        } else {
            delete req.body.passWord; // Không cập nhật trường passWord
        }
        const updateBy = {
            account_id: req.user.id,
            updateAt: new Date()
        };
        req.body.updateBy = updateBy
        // Cập nhật tài khoản
        const result = await Account.updateOne({ _id: id }, {
            ...req.body,
            $push: {updatedBy: updateBy}
        });
    
        if (result.modifiedCount === 0) {
            return res.json({
                code: 400,
                message: "Không có thay đổi nào được thực hiện hoặc tài khoản không tồn tại."
            });
        }

        const account = await Account.findOne({
            _id: id,
            deleted: false
        }).select("-passWord -token")
    
        res.json({
            data: account,
            code: 200,
            message: "Thay đổi thông tin tài khoản thành công."
        });
    
    } catch (error) {
        console.error("Lỗi cập nhật tài khoản:", error);
        res.json({
            code: 500,
            message: "Đã xảy ra lỗi trong quá trình cập nhật tài khoản."
        });
    }
    
}

module.exports.delete = async (req, res)=>{
    try {
        const id = req.params.id 
        await Account.updateOne({_id: id}, {
            deleted: true,
            deletedAt: Date.now()
        })
        const account = await Account.findOne({_id: id}, {
            deleted: true
        }).select("-passWord -token")
        res.json({
            data: account,
            code: 200,
            message: "Xóa thông tin tài khoản thành công."
        });

    } catch (error) {
        console.error("Lỗi cập nhật tài khoản:", error);
        res.json({
            code: 500,
            message: "Đã xảy ra lỗi trong quá trình xóa tài khoản."
        });
    }
}

module.exports.changeStatus = async (req, res)=>{
    try {
        const id = req.params.id;
        const status = req.body.status;
        const updateBy = {
            account_id: req.user.id,
            updateAt: new Date()
        };
        await Account.updateOne({_id: id}, {
            status: status,
            deleted: false,
            $push: {updatedBy: updateBy}
        })
        const account =  await Account.findOne({
            _id: id,
            deleted: false
        }).select("-passWord -token")
        res.json({
            data: account,
            code: 200,
            message: "change status success"
        })
    } catch (error) {
        
    }
}

module.exports.changeMulti = async (req, res)=>{
    try {
        const{ids, key, value} = req.body
        const updateBy = {
            account_id: req.user.id,
            updateAt: new Date()
        };
        switch (key) {
            case "status":
                await Account.updateMany({_id: {$in: ids}}, {
                    status: value,
                    $push: {updatedBy: updateBy}
                })
                res.json({
                    code: 200,
                    message: "cập nhật thành công"
                })
                break;
            case "deleted": 
                await Account.updateMany({_id: {$in: ids}}, {
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
    } catch (error) {
        res.json({

            code: 400,
            message: "chỉnh sửa khong thành công",
        }) 
    }
}