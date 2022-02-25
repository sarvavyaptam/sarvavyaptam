const express = require("express")
const app = express()
const path = require("path")
const hbs = require("hbs")
const cookieParser = require('cookie-parser')
require("./db/conn")
const products = require('./models/Products')

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))

const PORT = process.env.PORT || 3001

const partialPath = path.join(__dirname, "./components")
app.set('view engine', 'hbs');
hbs.registerPartials(partialPath)
hbs.registerHelper({ loud: function (value) { return value.toLowerCase().replace(/ /g, "-") } })
hbs.registerHelper({
  json: function (obj) {
    return JSON.stringify(obj);
  }
})
hbs.registerHelper({
  if_eq: function (cond1, cond2, options) {
    return (cond1 == cond2) ? options.fn(this) : options.inverse(this);
  }
});
hbs.registerHelper({
  first: function (cond1) {
    return cond1.charAt(0)
  }
});

app.use("/css", express.static(path.join(__dirname, './views/css')))
app.use("/js", express.static(path.join(__dirname, './views/js')))
app.use("/image", express.static(path.join(__dirname, './public/SarvamVyaptam.png')))
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.resolve(__dirname, `search_engine/robots.txt`))
})

app.get("/", (req, res) => {
  res.render("index")
})

app.post("*", (req, res) => {
  res.render("404")
})

app.get("*", (req, res) => {
  res.render("404")
})

app.listen(PORT, () => {

})