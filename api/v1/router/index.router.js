const productRouter = require("./product.router")
const productsCategoryRouter = require("./products-category.router")
const userRouter = require("./user.router")
const authAdminRuter = require("./auth.router")
const accountRouter = require('./account.router')
const permissionRouter = require('./permission.router')
const articleRouter = require("./article.router")
const myaccountAdmin =  require("./myAccountAdmin.router")
const searchAiRouter = require("./searchAi.router")
const myaccountClient = require("./myAccountClient.router")
const authAdmin = require("../../../middleware/authAdmin.middleware copy")
const authClient = require("../../../middleware/authClient.middleware")
const homeRouter = require("./home.router")
const blogFeatured = require("./blogFeatured.router")
const loginGoogle = require("./authGoogle.router")
const loginFacebook = require("./loginFacebook.router")
const logoutRouter = require("./logout.router")

module.exports = (app)=>{

    try {
        const version = '/api/v1';
        app.use(version + '/product', productRouter)
        app.use(version + '/product-category', productsCategoryRouter)
        app.use(version + '/auth', userRouter)
        app.use(version + '/authAdmin', authAdminRuter)
        app.use(version + '/account', accountRouter)
        app.use(version + '/permission', permissionRouter)
        app.use(version + '/article', articleRouter)
        app.use(version + '/searchAi', searchAiRouter)
        app.use(version + '/my-accountAdmin', authAdmin.authRequire, myaccountAdmin)
        app.use(version + '/my-accountClient', authClient.authRequire, myaccountClient)
        app.use(version + '/home', homeRouter)
        app.use(version + '/blog', blogFeatured)
        app.use(version + '/',loginGoogle )
        app.use(version + '/', loginFacebook)
        app.use(version + '/logout', logoutRouter)

    } catch (error) {
        console.log(error);
        
    }
}