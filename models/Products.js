const mongoose = require('mongoose')

const Products = new mongoose.Schema({
  name: {
    type: String
  },
  desc: {
    type: String
  },
  id: {
    unique: true,
    type: String
  },
  category: {
    type: String
  },
  image: {
    type: String
  },
  price: {
    type: Number
  },
  cut: {
    type: Number
  },
  stock: {
    type: Number
  },
  details: [
    {
      type: Object
    }
  ]
})

const products = mongoose.model("product", Products)

module.exports = products