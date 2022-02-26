const jwt = require("jsonwebtoken")
const Users = require("../models/User")
const config = require("../config")

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const verifytoken = jwt.verify(token, config.secret_key)

    const rootUser = await Users.findOne({ _id: verifytoken._id, "tokens.token": token })
    if (!rootUser) {
      req.rootUser = false
    }
    else {
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