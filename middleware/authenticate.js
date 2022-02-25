const jwt = require("jsonwebtoken")
const signUp = require("../models/User")
const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        const verifytoken = jwt.verify(token, process.env.SECRET_KEY)

        const rootUser = await signUp.findOne({ _id: verifytoken._id, "tokens.token": token })
        if (!rootUser) {
            req.rootUser = false
        }
        else{
            req.token = token
            req.rootUser = rootUser
            res.status(200)
        }
    }
    catch (err) {
        req.rootUser = false
        res.status(200)
    }
    next()
}

module.exports = authenticate