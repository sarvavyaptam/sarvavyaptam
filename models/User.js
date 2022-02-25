const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const Users = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: Number
  },
  email: {
    type: String
  },
  password: {
    type: String
  },
  type: {
    type: String
  },
  order: [
    {
      type: Object
    }
  ],
  cart: [
    {
      type: Object
    }
  ]
})

Users.pre("save", async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

const users = mongoose.model("user", Users)

module.exports = users