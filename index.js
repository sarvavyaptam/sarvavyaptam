const express = require("express")
const app = express()
const path = require("path")
const hbs = require("hbs")
const cookieParser = require('cookie-parser')
require("./db/conn")
const products = require('./models/Products')
const Users = require('./models/User')
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const google = require('googleapis').google;
const OAuth2 = google.auth.OAuth2;
const { OAuth2Client } = require('google-auth-library')
const config = require("./config")
const client = new OAuth2Client(config.client_id)

const oauth2Client = new OAuth2(config.google_client_id, config.google_secret, `${config.url}/auth_callback`);

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))

const PORT = process.env.PORT || 5001

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
  off: function (cond1, cond2) {
    return Math.trunc(100 - ((cond1 / cond2) * 100))
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
app.use("/logo192.png", express.static(path.join(__dirname, './public/logo192.png')))
app.use("/manifest.json", express.static(path.join(__dirname, './public/manifest.json')))
app.get("/robots.txt", (req, res) => {
  res.sendFile(path.resolve(__dirname, `search_engine/robots.txt`))
})

app.get("/", (req, res) => {
  res.render("index")
})

app.get("/contact", (req, res) => {
  res.render("contact")
})

app.get("/login", (req, res) => {
  const loginLink = oauth2Client.generateAuthUrl({
    scope: ["profile", "email"] // Using the access scopes from our config file
  });
  res.render("signin", {
    loginLink
  })
})

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginLink = oauth2Client.generateAuthUrl({
      scope: ["profile", "email"] // Using the access scopes from our config file
    });
    const reg = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/
    if (!email || !password) {
      res.render("signin", {
        loginLink,
        error: 'true',
        errorMsg: "All the fields is required"
      })
    }
    else if (req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === null) {
      res.render("signin", {
        loginLink,
        error: 'true',
        errorMsg: "Invalid Captcha"
      })
    }
    else if (!reg.test(email)) {
      res.render("signin", {
        loginLink,
        error: 'true',
        errorMsg: "Invalid Email"
      })
    }
    else {
      const userExist = await Users.findOne({ email })
      if (userExist && userExist.type !== "Google") {
        const isMatch = await bcrypt.compare(password, userExist.password)
        if (isMatch) {
          const token = jwt.sign({ _id: userExist._id }, config.secret_key)
          res.cookie("token", token, {
            expires: new Date(Date.now() + 10000000000)
          })
          res.status(201).redirect("/")
        }
        else {
          res.render("signin", {
            error: "true",
            errorMsg: "Invalid Crenditials",
            input: { email },
            loginLink,
            // login: (req.rootUser === false ? 'nope' : req.rootUser)
          })
        }
      }
      else if (userExist && userExist.type === "Google") {
        res.render("signin", {
          error: "true",
          errorMsg: "Email is associated with google",
          input: { email },
          loginLink,
          // login: (req.rootUser === false ? 'nope' : req.rootUser)
        })
      }
      else {
        res.render("signin", {
          error: "true",
          errorMsg: "Email is not registered",
          input: { email },
          loginLink,
          // login: (req.rootUser === false ? 'nope' : req.rootUser)
        })
      }
    }
  }
  catch (err) {
    console.log(err)
  }
})

app.get("/register", (req, res) => {
  const loginLink = oauth2Client.generateAuthUrl({
    scope: ["profile", "email"] // Using the access scopes from our config file
  });
  res.render("signup", {
    loginLink
  })
})

app.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const loginLink = oauth2Client.generateAuthUrl({
      scope: ["profile", "email"] // Using the access scopes from our config file
    });
    const reg = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/
    let regex = /^\d+$/;
    if (!name || !phone || !email || !password) {
      res.render("signup", {
        loginLink,
        error: 'true',
        input: { email, name, phone },
        errorMsg: "All the fields is required"
      })
    }
    else if (req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === null) {
      res.render("signup", {
        loginLink,
        error: 'true',
        input: { email, name, phone },
        errorMsg: "Invalid Captcha"
      })
    }
    else if (!reg.test(email)) {
      res.render("signup", {
        loginLink,
        error: 'true',
        input: { email, name, phone },
        errorMsg: "Invalid Email"
      })
    }
    else if (!regex.test(phone) || String(phone).length !== 10) {
      res.render("signup", {
        loginLink,
        error: 'true',
        input: { email, name, phone },
        errorMsg: "Invalid Phone"
      })
    }
    else {
      const findUser = await Users.findOne({ email })
      if (findUser) {
        res.render("signup", {
          loginLink,
          error: 'true',
          input: { email, name, phone },
          errorMsg: "Email is already registered"
        })
      }
      else {
        const user = new Users({ name, password, email, phone, type: "Local" })
        user.save().then((e) => {
          const token = jwt.sign({ _id: e._id }, config.secret_key)
          res.cookie("token", token, {
            expires: new Date(Date.now() + 10000000000)
          })
          res.status(200).redirect("/")
        }).catch(() => {
          res.render("signup", {
            loginLink,
            error: 'true',
            input: { email, name, phone },
            errorMsg: "An error occured"
          })
        })
      }
    }
  }
  catch {

  }
})

app.get('/auth_callback', (req, res) => {
  // Create an OAuth2 client object from the credentials in our config file
  const oauth2Client = new OAuth2(config.google_client_id, config.google_secret, `${config.url}/auth_callback`);
  const loginLink = oauth2Client.generateAuthUrl({
    scope: ["profile", "email"] // Using the access scopes from our config file
  });
  if (req.query.error) {
    // The user did not give us permission.
    return res.redirect('/');
  } else {
    oauth2Client.getToken(req.query.code, function (err, token) {
      if (err) {
        return res.status(400).render("signup", {
          error: `true`,
          errorMsg: `${err}`,
          input: {},
          loginLink
        })
      }
      else {
        client.verifyIdToken({
          idToken: token.id_token,
          audience: config.google_client_id
        }).then((e) => {
          const { email_verified, email, name } = e.payload
          if (email_verified) {
            Users.findOne({ email }).then((get) => {
              if (get) {
                if (get.type === "Local") {
                  return res.status(400).render("signup", {
                    error: `true`,
                    errorMsg: `User is registered as a local account`,
                    input: {},
                    loginLink,
                  })
                }
                else {
                  const token = jwt.sign({ _id: get._id }, config.secret_key)
                  res.cookie("token", token, {
                    expires: new Date(Date.now() + 10000000000)
                  })
                  res.status(201).redirect("/")
                }
              }
              else {
                const user = new Users({ name, password: email, email: email, type: "Google" })
                user.save().then(() => {
                  res.redirect("/")
                })
              }
            })
          }
        })
      }
    });
  }
});

app.get("/shop", (req, res) => {
  res.render("shop")
})

app.get("/shop/:id", async (req, res) => {
  try {
    let items = await products.find({ category: req.params.id })
    if (items.length === 0) {
      res.render("404")
    }
    else {
      res.render("show", {
        items
      })
    }
  }
  catch (err) {
    console.log(err)
  }
})

app.post("*", (req, res) => {
  res.render("404")
})

app.get("*", (req, res) => {
  res.render("404")
})

app.listen(PORT, () => {

})