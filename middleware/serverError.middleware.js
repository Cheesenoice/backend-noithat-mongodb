module.exports = (app)=>{
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            success: false, 
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    });
}