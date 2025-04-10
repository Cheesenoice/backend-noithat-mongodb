const { cookie } = require("express-validator");
const Account = require("../../../model/account.model")
const bcrypt = require('bcrypt');

module.exports.login = async (req, res)=>{
    
    const email = req.body.email;
    const passWord = req.body.passWord;
    const exisEmail = await Account.findOne({
        email: email,
        deleted: false,
        status: "active"
    })
    if(!exisEmail){
        res.json({
            code: 400,
            message: "Tài khoản không tồn tại, hoặc đã bị khóa"
        })
        return;
    }    
    

    const isMatch = await bcrypt.compare(passWord, exisEmail.passWord);    
        
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Sai mật khẩu!' });
        }
    if (exisEmail.status != "active"){
        res.json({
            code: 400,
            message: "Tài khoản hiện tại bị khóa"
        })
        return;
    }
    
    const token = exisEmail.token;
    res.cookie("token", token)
    res.json({
        code: 200,
        message: "Đăng nhập thành công",
        token: token
    })
}

module.exports.logout = (req, res)=>{
    res.clearCookie("token")
    res.json({
        code: 200,
        message: 'Dang xuat thanh cong'
    })
}