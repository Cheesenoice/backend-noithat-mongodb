const Account = require("../model/account.model")
const UserClient = require("../model/user.modle")
const Role = require("../model/permission.modle")
// module.exports.authRequire = async (req, res, next)=>{
//     if(req.headers.authorization){
//         const token = req.headers.authorization.split(" ")[1];
//         const user = await User.findOne({
//             token: token,
//         }).select("-passWord -token")
//         if (!user){
//             res.json({
//                 code: 404,
//                 message: "Không có quyền truy cập"
//             })
//         }
//         req.user = user;
//         next()
//     }else {
//         res.json({
//             code: 404,
//             message: "Không có quyền truy cập"
//         })
//     }
    
// }
module.exports.authRequire = async (req, res, next) => {
    try {
        let token = null;
        let user = null;

        // 1. Ưu tiên token từ header (API)
        if (req.headers.authorization) {
            token = req.headers.authorization.split(" ")[1];
            user = await Account.findOne({ token }).select("-passWord -token");

            if (!user) {
                return res.status(403).json({
                    code: 403,
                    message: "Không có quyền truy cập"
                });
            }

            req.user = user; // gán user cho req để dùng tiếp
            return next();
        }

        // 2. Nếu không có trong header → kiểm tra token từ cookies (hệ thống web)
        if (req.cookies.token) {
            token = req.cookies.token;
            user = await Account.findOne({ token }).select("-passWord");

            if (!user) {
                return res.status(403).json({
                    code: 403,
                    message: "Không có quyền truy cập"
                });
            }

            const role = await Role.findOne({ _id: user.roleId }).select("title rolePower");
            res.locals.user = user;
            res.locals.role = role; 
            return next();
        }

        // 3. Nếu không có token ở cả hai → trả về tùy theo loại request
        const isAPI = req.originalUrl.startsWith('/api'); // bạn có thể điều chỉnh theo prefix API của mình

        if (isAPI) {
            return res.status(403).json({
                code: 403,
                message: "Không có quyền truy cập"
            });
        } else {
            return res.status(403).json({
                code: 403,
                message: "Không có quyền truy cập"
            });
        }

    } catch (error) {
        console.error("Auth error:", error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi hệ thống"
        });
    }
};


module.exports.authRequireClient = async (req, res, next)=>{
    if(req.headers.authorization){
        const token = req.headers.authorization.split(" ")[1];
        console.log(token);
        
        const user = await UserClient.findOne({
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