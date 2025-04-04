const moogose = require("mongoose")

const rolePowerSchema = new moogose.Schema({
    title: String,
    description: String,
    rolePower: {
        type: Array,
        default: []
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date  // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
}, 
{timestamps: true})

const RolePower = moogose.model("Role", rolePowerSchema, "permission")

module.exports = RolePower;