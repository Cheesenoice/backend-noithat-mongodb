module.exports = (query)=>{
    // tạo một keywork chứa chuỗi rỗng 
    let ojectSearch = { 
        keyword: ""
    }
    if (query.keyword){   // kiểm tra thông tin người dùng nhập vào
        ojectSearch.keyword = query.keyword;

        const regex = new RegExp(ojectSearch.keyword, "i"); // sử dụng hàm regexp để có thể lọc được khi nhập chữ hoa chữ thường có thể tìm kiếm theo từng chữ cái 

        ojectSearch.regex = regex; // nối chuỗi title và bộ lọc find kiểm tra nếu đúng thì sẽ lấy ra đúng sản phẩm ứng với nội dung người nhập
    }

    return ojectSearch;
}