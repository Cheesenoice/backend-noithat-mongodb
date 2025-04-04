const User = require("../model/account.model")
module.exports.authRequire = async (req, res, next)=>{
    if(req.headers.authorization){
        const token = req.headers.authorization.split(" ")[1];
        console.log(token);
        
        const user = await User.findOne({
            token: token,
        }).select("-passWord -token")
        if (!user){
            res.json({
                code: 404,
                message: "Không có quyền truy cập"
            })
        }
        req.user = user;
        next()
    }else {
        res.json({
            code: 404,
            message: "Không có quyền truy cập"
        })
    }
    
}