module.exports.createPost = (req, res, next)=> {
    if(!req.body.fullName){
        res.json({
            code: 404,
            message: "Khong duoc de trong thong tin"
        })
        return;
    }
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
        return;
    }
    if(!req.body.phoneNumber){
        res.json({
            code: 404,
            message: "Khong duoc de trong thong tin"
        })
        return;
    }
    next();
}

module.exports.editPath = (req, res, next)=> {
    if(!req.body.fullName){
        res.json({
            code: 404,
            message: "Khong duoc de trong thong tin"
        })
        return;
    }
    if(!req.body.email){
        res.json({
            code: 404,
            message: "Khong duoc de trong thong tin"
        })
        return;
    }
    next();
}
