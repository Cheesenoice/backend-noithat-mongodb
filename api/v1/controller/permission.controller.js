const Role = require('../../../model/permission.modle');
const searchHelper = require('../../../helper/search.helper')
module.exports.permission = async (req, res)=>{
    try {
        const find =  {
            deleted: false
        }

        const search = searchHelper(req.query);
        if(search.regex){
            find.title = search.regex
        }

        const role = await Role.find(find)
        res.json({
            data: role,
            code: 200
        })
    } catch (error) {
        res.json({
            code: 400,
            error: error
        })   
    }
}

module.exports.createPermission = async (req, res)=>{
    console.log(req.body);
    try {
        const addRole = await Role.findOne({
            title: req.body.title,
            deleted: false
        })
        if(addRole){
            res.json({
                code: 400,
                error: "Đã tồn tại quyền này"
            })
        }
        const permission = new Role(req.body);
        await permission.save();
        const role = await Role.find({
            deleted: false
        })
        res.json({
            code: 200,
            data: role,
            message: "Thêm quyền thành công"
        })
    } catch (error) {
        res.json({
            code: 400,
            error: "không thành công"
        })
    }
    
}

module.exports.updatePermission = async (req, res)=>{
    try {    
        let permissions;
    
        // Kiểm tra nếu dữ liệu là string, thì parse sang JSON
        if (typeof req.body.permission === 'string') {
            try {
                permissions = JSON.parse(req.body.permission);
            } catch (parseError) {
                return res.status(400).json({
                    code: 400,
                    message: "Dữ liệu permission không hợp lệ, không thể parse JSON",
                    error: parseError.message
                });
            }
        } else if (typeof req.body.permission === 'object') {
            permissions = req.body.permission;
        } else {
            return res.status(400).json({
                code: 400,
                message: "Kiểu dữ liệu permission không hợp lệ"
            });
        }
    
        // Kiểm tra mảng có dữ liệu hay không
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                code: 400,
                message: "Danh sách quyền không hợp lệ hoặc rỗng"
            });
        }
    
        const updatedRoles = [];
    
        // Lặp và cập nhật từng quyền
        for (const item of permissions) {
            if (!item.id || !item.permissions) {
                console.warn("Thiếu thông tin id hoặc permissions ở item:", item);
                continue; // Bỏ qua item sai
            }
    
            // Cập nhật rolePower trong DB
            await Role.updateOne(
                { _id: item.id },
                { rolePower: item.permissions }
            );
    
            const role = await Role.findOne({
                _id: item.id,
                deleted: false
            });
    
            if (role) {
                updatedRoles.push(role);
            }
        }
    
        // Trả về danh sách các quyền đã cập nhật
        return res.status(200).json({
            code: 200,
            data: updatedRoles,
            message: "Cập nhật quyền thành công"
        });
    
    } catch (error) {
        console.error("Lỗi cập nhật quyền:", error);
    
        return res.status(500).json({
            code: 500,
            message: "Đã xảy ra lỗi khi cập nhật quyền",
            error: error.message
        });
    }
    
}
