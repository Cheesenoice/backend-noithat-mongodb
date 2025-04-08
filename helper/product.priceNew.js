module.exports.productFeature = (product)=>{
    const newProducts = product.map(item => {  // su dung map de tinh toan gia thep phan tram giam gia discountPercentage: phan tram giam gia
        item.priceNew = (item.price*(100 - item.discountPercentage)/100).toFixed(0); // ham tinh gia theo phan tram giam gia lay ra gia moi  
        return item;                                                                            // ham toFixed giup loai bo cac dau sau dau phay      
    })
    return newProducts;
}

module.exports.productPriceNew = (product)=>{
    const priceNew = (
        product.price*(100 - product.discountPercentage)/100
    ).toFixed(0); // ham tinh gia theo phan tram giam gia lay ra gia moi  

    return priceNew;
}