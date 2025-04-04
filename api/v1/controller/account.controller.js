const Account = require("../../../model/account.model");
const Role = require("../../../model/permission.modle")
const searchHelper = require("../../../helper/search.helper")
const bcrypt = require('bcrypt');
const paginationHelper = require("../../../helper/pagination.helper");
module.exports.account = async (req, res)=>{
    const find = {
        deleted: false
    }

    // chức năng lọc theo trạng thái 
    if(req.query.status){
        find.status = req.query.status
    }

    // chức năng tìm kiếm 
    const search = searchHelper(req.query);
    if(search.regex){
        find.title = search.regex;
    }

    // chuc nang phan trang         
    let initPagination = {
        currentPage: 1,
        limitItem: 8
    }
    const countProduct = await Account.countDocuments(find);
    const ojectPanigation = paginationHelper(
        initPagination,
        req.query,
        countProduct
    )
    
    // tính năng sắp xếp theo tiêu chí 
    const sort = {};
    if(req.query.sortKey&&req.query.sortValue){
        sort[req.query.sortKey] = req.query.sortValue;
    }else {
        sort.position = "desc"
    }

    const account = await Account.find(find).sort(sort).limit(ojectPanigation.limitItem).skip(ojectPanigation.skip).select("-passWord -token")

    for (const record of account) {
        const role = await Role.findOne({
            _id: record.roleId, 
            deleted: false
        })
        record.role = role
    }

    res.json({
        data: account,
        code: 200,
        message: "Thành công"
    })
}

module.exports.create =  async (req, res)=>{
    console.log(req.body);
    
    try {
        const email = req.body.email;
        const passWord = req.body.passWord;
        const hashedPassword = await bcrypt.hash(passWord, 10);
        if (req.body.position == ""){
            const count =  new Account.countDocuments();
            req.position = count + 1;
        }else {
            req.body.position = parseInt(req.body.position)
        }

        const exisEmail = await Account.findOne({
            email: email,
            deleted: false
        })

        if(exisEmail){
            res.json({
                code: 404,
                message: "tạo tài khoản không thành công email đã tồn tại"
            })        
            return;
        }
        // const isMatch = await bcrypt.compare(passWord, hashedPassword);
        
        // if (!isMatch) {
        //     return res.status(401).json({ success: false, message: 'Sai mật khẩu!' });
        // }
        const account = new Account({
            fullName: req.body.fullName,
            email: email,
            passWord: hashedPassword,
            phoneNumber: req.body.phoneNumber,
            avatar: req.body.avatar,
            status: req.body.status,
            position: req.body.position
          
    });
        await account.save()
        
        res.json({
            code: 200,
            message: "thành công"
        })
        
    } catch (error) {
     res.json({
        code: 404,
        error: error
     })   
    }

}

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
    
        // Cập nhật tài khoản
        const result = await Account.updateOne({ _id: id }, req.body);
    
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
        await Account.updateOne({_id: id}, {
            status: status,
            deleted: false
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
        switch (key) {
            case "status":
                await Account.updateMany({_id: {$in: ids}}, {
                    status: value
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