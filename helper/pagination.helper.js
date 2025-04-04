module.exports = (ojectPanigation, query, countRecord)=>{
    if(query.page){
        ojectPanigation.curentPage = parseInt(query.page); // truyền vào số trang 
    }

    if(query.limit){
        ojectPanigation.limitItem = parseInt(query.limit); // truyền vào số sản phẩm trong 1 trang nếu fontend có gửi kèm 
    }

    ojectPanigation.skip = (ojectPanigation.curentPage - 1)*ojectPanigation.limitItem;

    ojectPanigation.total = Math.ceil(countRecord/ojectPanigation.limitItem)

    return ojectPanigation;
}