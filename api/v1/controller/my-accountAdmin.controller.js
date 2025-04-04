const Account = require("../../../model/account.model");
const bcrypt = require('bcrypt');

module.exports.myAccountAdmin =  async (req, res)=>{
    
    try {
        const token =  req.cookies.token;
        const account = await Account.findOne({
            token: token,
            deleted: false
        }).select("-token -passWord")
        res.json({
            code: 200,
            data: account
        })
    } catch (error) {
        res.json({
            code: 404,
            message: "không thành công"
        })
    }
}

module.exports.edit =  async (req, res)=>{
   try {
           const token = req.cookies.token;

           console.log(req.body);
           
           let passWord = req.body.passWord;
       
           // Kiểm tra nếu đã tồn tại email hoặc số điện thoại (trừ chính user đang sửa)
           const emailExist = await Account.findOne({
            token: { $ne: token },   
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
           const result = await Account.updateOne({ token: token }, req.body);
       
           if (result.modifiedCount === 0) {
               return res.json({
                   code: 400,
                   message: "Không có thay đổi nào được thực hiện hoặc tài khoản không tồn tại."
               });
           }
   
           const account = await Account.findOne({
               token: token,
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