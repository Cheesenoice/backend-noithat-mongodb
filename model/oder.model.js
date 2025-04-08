const moogose = require("mongoose")

const orderSchema = new moogose.Schema({
   cartId: String,
   user_infor: [
    {
        fullName: String,
        phone: Number,
        address: String
    }
   ],
   product: [
     {
        product_id: String,
        price: Number,
        discountPercentage: Number,
        quantity: Number
     }
   ]
}, 
{timestamps: true})

const Order = moogose.model("Order", orderSchema, "order")

module.exports = Order;