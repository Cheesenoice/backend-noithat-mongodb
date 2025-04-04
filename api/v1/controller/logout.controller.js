module.exports.logout = (req, res)=>{
    res.clearCookie("token")
    res.json({
        code: 200,
        message: 'Dang xuat thanh cong'
    })
}