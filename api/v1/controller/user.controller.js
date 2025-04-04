const User = require("../../../model/user.modle");
const randomString = require("../../../helper/randomString")
const md5 = require('md5');
const sendMail = require("../../../helper/sendMail.helper")
const ForgotPassword = require("../../../model/sendOtp.model")
module.exports.register = async (req, res)=>{
    
    try {
        const exisEmail = await User.findOne({
            email: req.body.email,
            deleted: false
        })
        if(exisEmail){
            res.json({
                code: 404,
                message: "Email đã bị trùng"
            })
        }else {
            const user = new User({
                fullName: req.body.fullName,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber,
                passWord: md5(req.body.passWord),
                token: randomString.generateRandomString(20)
    
            })
    
            await user.save()
    
            const token = user.token;
            res.cookie("token", token)
    
            res.json({
                code: 200,
                message: " Đăng Kí tài khoản thành công thành công",
            })
        }
    } catch (error) {
        res.json({
            code: 200,
            message: " Đăng Kí tài khoản không thành công thành công"
        })
    }
    
}

module.exports.login = async (req, res)=>{
   try {
    const{fullName, email, passWord, phoneNumber} = req.body;
    const user = await User.findOne({
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        deleted: false

    })
    
    if(!user){
        res.json({
            code: 404,
            message: "Sai thông tin đăng nhập khong thành công"
        })

        return;
    }

    if (fullName != user.fullName){
        res.json({
            code: 404,
            message: "Sai tên đăng nhập đăng nhập khong thành công"
        })

        return;
    }

    if (phoneNumber != user.phoneNumber){
        res.json({
            code: 404,
            message: "Sai số điện thoại đăng nhập khong thành công"
        })
        return;
    }

    if (md5(passWord) != user.passWord){
        res.json({
            code: 404,
            message: "Sai mật khẩu đăng nhập khong thành công"
        })
        return;
    }

    const token = user.token;
    res.cookie("token", token)

    res.json({
        code: 200,
        message: " Đăng nhập thành công",
        token: token
    })
   } catch (error) {
    res.json({
        code: 404,
        message: " Đăng nhập Không thành công",
        error: error
    })
   }
}

module.exports.forgotPassword = async (req, res)=>{
   
    try {
        console.log(req.body);
        const email = req.body.email;
        const user = await User.findOne({
            email: email,
            deleted: false
        })
        if(!user){
            res.json({
                code: 404,
                message: "Email không tồn tại"
            })
        }
        
        // xử lý tạo ra mã otp 
        const otp = randomString.generateRandomNumber(8)
    
        const timeExprice = 2; // thời gian hết hạn
        const ojectForgotPassword = {
            email,
            otp,
            ExpriceAt: Date.now() + timeExprice*60
        }
        
        const newPassword = new ForgotPassword(ojectForgotPassword);
        await newPassword.save()
    
        //gửi OTP qua email
        const subiect = "Mã OTP xác minh lấy lại mật khẩu"
        const html = `<spa>vui lòng không chi sẽ mã với bất kì ai, mã của ban là: ${otp}, thời gian hết hạn ${timeExprice} phút</spa>`
        
        sendMail.sendMail(email, subiect, html)
        res.json({
            code: 200, 
            message: "Đã gửi OTP qua mail"
        })
    } catch (error) {
        res.json({
            code: 404
        })
    }
    
}

module.exports.sendOtp = async (req, res)=>{
   try {
    const email = req.body.email;
    const otp = req.body.otp;
    const result = await ForgotPassword.findOne({
        email: email,
        otp: otp
    })

    if(!result){
        res.joson({
            code: 404,
            message: "Mã xác thực không dúng "
        })
    }

    const user = await User.findOne({
        email: email
    })

    const token = user.token
    res.cookie("token", token)

    res.json({
        code: 200,
        message: "Xác thực thành công",
        token
    })
   } catch (error) {
    res.json({
        code: 404
    })
   }
}

module.exports.resetPassword = async (req, res)=>{
   try {
    const token = req.body.token;
    const passWord = req.body.passWord

    const user = await User.findOne({
        token: token, 
        deleted: false
    })
    if (md5(passWord) === user.passWord){
        res.json({
            code: 404,
            message: "Mật khẩu bị trùng với mật khẩu hiện tại"
        })
        return;
    }

    await User.updateOne({token: token}, {passWord: md5(passWord)});
    res.json({
        code: 200,
        message: "thay đổi mật khẩu thành công",
        token: token
    })
   } catch (error) {
    res.json({
        code: 404,
        error: error
    })
   }
}

module.exports.list = async(req, res)=>{

    try {
        const user = await User.find({
            deleted: false
        }).select("-token -passWord")
        res.json({
            data: user,
            code:200
        })
    } catch (error) {
        res.json({
            code: 404,
            error: error
        })
    }
}
