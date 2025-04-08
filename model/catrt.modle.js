const moogose = require("mongoose")

const cartSchema = new moogose.Schema({
   user_id: String,
   product: [
     {
        product_id: String,
        quantity: Number
     }
   ]
}, 
{timestamps: true})

const Cart = moogose.model("Cart", cartSchema, "cart")

module.exports = Cart;