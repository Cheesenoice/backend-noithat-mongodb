module.exports.generateRandomString = (length) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    let result = "";   

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }    // lặp và lấy ra các kí tự bất kì khi nhập độ dài index là bao nhiêu thì nó sẽ tự động random tỏng khoảng  vị trí đó 

    return result;
};

module.exports.generateRandomNumber = (length) => {
    const characters = "0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
};
