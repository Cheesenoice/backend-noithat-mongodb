const moongose = require("mongoose");

module.exports.connect = async ()=>{

    try {
        // sự dung asyn await để đợi nó connect 
        await moongose.connect(process.env.MOONGOSE_URL); //đưa file url vào file env để bảo mật tránh bị ăn cắp dữ liệu
        console.log("connect finish");
        
    } catch (error) {
        console.log("khong thanh cong ");
        
    }
}

