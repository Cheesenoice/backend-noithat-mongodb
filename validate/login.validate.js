module.exports.loginValidate = (req, res, next)=> {
    if(!req.body.email){
        res.json({
            code: 404,
            message: "Khong duoc de trong thong tin"
        })
        return;
    }
    if(!req.body.passWord){ 
        res.json({
            code: 404,
            message: "Khong duoc de trong thong tin"
        })
    }
    next();
}
