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
const authenticate = require("./middleware/authenticate")
const client = new OAuth2Client(config.client_id)

const oauth2Client = new OAuth2(config.google_client_id, config.google_secret, `${config.url}/auth_callback`);

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))

const PORT = process.env.PORT || 5001

const partialPath = path.join(__dirname, "./components")
app.set('view engine', 'hbs');
hbs.registerPartials(partialPath)
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
app.use("/robots.txt", express.static(path.join(__dirname, './search_engine/robots.txt')))
app.use("/20210527.jpg", express.static(path.join(__dirname, './search_engine/20210527.jpg')))

app.get("/", authenticate, (req, res) => {
  res.render("index", {
    login: (req.rootUser === false ? 'nope' : req.rootUser)
  })
})

app.get("/contact", authenticate, (req, res) => {
  res.render("contact", {
    login: (req.rootUser === false ? 'nope' : req.rootUser)
  })
})

app.get("/login", authenticate, (req, res) => {
  const loginLink = oauth2Client.generateAuthUrl({
    scope: ["profile", "email"] // Using the access scopes from our config file
  });
  res.render("signin", {
    loginLink, login: (req.rootUser === false ? 'nope' : req.rootUser)
  })
})

app.post("/login", authenticate, async (req, res) => {
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
        errorMsg: "All the fields is required",
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else if (req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === null) {
      res.render("signin", {
        loginLink,
        error: 'true',
        errorMsg: "Invalid Captcha",
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else if (!reg.test(email)) {
      res.render("signin", {
        loginLink,
        error: 'true',
        errorMsg: "Invalid Email",
        login: (req.rootUser === false ? 'nope' : req.rootUser)
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
            login: (req.rootUser === false ? 'nope' : req.rootUser)
          })
        }
      }
      else if (userExist && userExist.type === "Google") {
        res.render("signin", {
          error: "true",
          errorMsg: "Email is associated with google",
          input: { email },
          loginLink,
          login: (req.rootUser === false ? 'nope' : req.rootUser)
        })
      }
      else {
        res.render("signin", {
          error: "true",
          errorMsg: "Email is not registered",
          input: { email },
          loginLink,
          login: (req.rootUser === false ? 'nope' : req.rootUser)
        })
      }
    }
  }
  catch (err) {
    console.log(err)
  }
})

app.get("/register", authenticate, (req, res) => {
  const loginLink = oauth2Client.generateAuthUrl({
    scope: ["profile", "email"] // Using the access scopes from our config file
  });
  res.render("signup", {
    loginLink, login: (req.rootUser === false ? 'nope' : req.rootUser)
  })
})

app.post("/register", authenticate, async (req, res) => {
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
        errorMsg: "All the fields is required",
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else if (req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === null) {
      res.render("signup", {
        loginLink,
        error: 'true',
        input: { email, name, phone },
        errorMsg: "Invalid Captcha",
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else if (!reg.test(email)) {
      res.render("signup", {
        loginLink,
        error: 'true',
        input: { email, name, phone },
        errorMsg: "Invalid Email",
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else if (!regex.test(phone) || String(phone).length !== 10) {
      res.render("signup", {
        loginLink,
        error: 'true',
        input: { email, name, phone },
        errorMsg: "Invalid Phone",
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else {
      const findUser = await Users.findOne({ email })
      if (findUser) {
        res.render("signup", {
          loginLink,
          error: 'true',
          input: { email, name, phone },
          errorMsg: "Email is already registered",
          login: (req.rootUser === false ? 'nope' : req.rootUser)
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
            errorMsg: "An error occured",
            login: (req.rootUser === false ? 'nope' : req.rootUser)
          })
        })
      }
    }
  }
  catch {

  }
})

app.get('/auth_callback', authenticate, (req, res) => {
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

app.get("/shop/:cate/:id", authenticate, (req, res) => {
  const { cate, id } = req.params
  products.find({ category: cate, id }).then((e) => {
    if (e.length === 0) {
      res.render("404", {
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else {
      let html = e.map((val) => {
        let details = val.details.map((vals) => {
          return `<tr>
          <td class="border-l border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
            ${vals.name}</td>
          <td class="border-r border-slate-100 dark:border-slate-700 p-4 text-slate-600 dark:text-slate-400">
            ${vals.value}</td>
        </tr>`
        })
        details = details.join('')
        const Stock = () => {
          if (val.stock >= 50) {
            return `<span class='dark:text-green-400 text-md text-green-500'>${val.stock} left in stock</span>`
          }
          else if (val.stock <= 49 && val.stock >= 15) {
            return `<span class='dark:text-green-400 text-md text-green-500'>Hurry up! Only ${val.stock} left in stock</span>`
          }
          else if (val.stock <= 14 && val.stock >= 1) {
            return `<span class='dark:text-red-400 text-md text-red-500'>Hurry up! Only ${val.stock} left in stock</span>`
          }
          else if (val.stock <= 0) {
            return `<span class='dark:text-red-400 text-md text-red-500'>You missed it! All stocks are sold out</span>`
          }
        }
        return `<section class="text-gray-600 body-font">
        <div id="modal" class="items-center fixed inset-0 overflow-y-auto" style="display: none; z-index: 10000000;">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div onclick="document.getElementById('modal').style.display='none'" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div><span
              class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
            <div
              class="inline-block align-bottom dark:bg-gray-800 bg-white rounded text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle preview-width">
              <div class="dark:bg-gray-800 bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse"><button type="button"
                  class="w-auto inline-flex justify-center rounded border border-transparent shadow-sm px-4 py-2 dark:bg-gray-700 bg-red-600 text-base font-medium text-white hover:bg-red-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-gray-500 focus:ring-red-500 sm:ml-3 sm:text-sm" onclick="document.getElementById('modal').style.display='none'">Close</button>
                <div class="w-full text-left flex place-items-center">
                  <p class="text-xl flex dark:text-slate-300">Preview</p>
                </div>
              </div>
              <div class="bg-white">
                <div class="flex justify-center">
                  <div><img
                      src="${val.image}"
                      alt=".."></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="container mx-auto flex px-5 py-4 lg:flex-row flex-col">
          <div class="lg:max-w-lg lg:w-full md:w-full justify-center md:block w-5/6 mb-10 md:mb-0 products-img"
            style="width: 100%;">
            <div class="border-2 border-gray-200 dark:border-gray-700 border-opacity-60"><img onclick="document.getElementById('modal').style.display='inline'"
                class="cursor-pointer object-cover object-center rounded" alt="hero"
                src="${val.image}"
                style="position: relative; left: 50%; transform: translate(-50%);"></div>
            <div class="flex flex-row mt-2 md:w-full pb-10"><button
                class="mt-1 mr-1 rounded shadow hover:shadow-md transition-shadow w-1/2 text-white bg-blue-500 border-0 py-2 px-6 focus:outline-none hover:opacity-90 text-lg">ADD
                TO CART</button><a
                class="text-center mt-1 ml-1 rounded shadow hover:shadow-md transition-shadow w-1/2 text-white bg-green-500 border-0 py-2 px-6 focus:outline-none hover:opacity-90 text-lg"
                href="/order?id=fortune-everyday-basmati-rice-long-grain-2kg&amp;quantity=1">BUY NOW</a></div>
          </div>
          <div class="lg:flex-grow sm:mt-0 md:w-full md:block lg:pl-24 flex flex-col md:items-start text-left">
            <p class="font-medium text-gray-600 dark:text-slate-400 uppercase"><a
                class="dark:hover:text-white hover:text-blue-700" href="/">Home</a> &gt; <a
                class="dark:hover:text-white hover:text-blue-700" href="/shop/${val.category}">${val.category}</a> &gt; <span
                title="${val.name}">${val.name.length >= 15 ? (val.name.substring(0, 13) + '...') : val.name}</span></p>
            <h1 class="title-font sm:text-4xl text-3xl mb-1 font-medium dark:text-slate-200 text-gray-900 mt-2">${val.name}</h1>
            ${Stock()}
            <p class="title-font text-3xl text-md dark:text-white text-gray-800 mb-3">₹${Number(val.price).toLocaleString('hi-IN')} <span
                class="dark:text-gray-300 text-lg line-through">₹${Number(val.cut).toLocaleString('hi-IN')}</span> <span
                class="text-sm rounded bg-green-600 text-white p-1">${Math.trunc(100 - ((val.price / val.cut) * 100))}% off</span></p>
            <div class="flex mb-2">
              <div
                class="1/4 p-1 hover:bg-slate-100 px-4 cursor-pointer border-r border-l border-t border-b border-gray-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-gray-600 select-none">
                -</div>
              <div class="2/4 p-1 px-8 border-t border-b border-gray-300 dark:border-slate-600 dark:text-slate-200">1
              </div>
              <div
                class="1/4 p-1 hover:bg-slate-100 px-4 cursor-pointer border-r border-t border -b border-gray-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-gray-600 select-none">
                +</div>
            </div>
            <div class="relative overflow-auto">
              <div class="shadow-sm overflow-hidden mb-2">
                <div
                  class="flex w-full border dark:border-slate-600 text-lg p-4 pl-8 pt-3 text-black dark:text-slate-200 text-left">
                  <p class="text-left" style="flex: 0 0 90%;">Product Details</p>
                  <!-- <p class="text-right" style="flex: 0 0 10%;">-</p> -->
                </div>
                <table class="w-full">
                  <tbody class=" border-collapse table-auto w-full text-sm">
                    <tr>
                      <td class="border-l border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-500 dark:text-slate-400">
                        Description</td>
                      <td class="border-r border-slate-100 dark:border-slate-700 p-4 text-slate-600 dark:text-slate-400">
                        ${val.desc}</td>
                    </tr>
                    ${val.details.length === 0 ? `` : details}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>`
      })
      html = html.join('')
      let name = e.map((val) => {
        return `${val.name}`
      })
      name.join('')
      res.render("product", {
        login: (req.rootUser === false ? 'nope' : req.rootUser),
        html, name
      })
    }
  })
})

app.get("/shop", authenticate, (req, res) => {
  res.render("shop", {
    login: (req.rootUser === false ? 'nope' : req.rootUser)
  })
})

app.get("/shop/:id", authenticate, async (req, res) => {
  try {
    let items = await products.find({ category: req.params.id })
    if (items.length === 0) {
      res.render("404", {
        login: (req.rootUser === false ? 'nope' : req.rootUser)
      })
    }
    else {
      res.render("show", {
        items, login: (req.rootUser === false ? 'nope' : req.rootUser), name:items[0].category.toUpperCase()
      })
    }
  }
  catch (err) {
    console.log(err)
  }
})

app.post("*", authenticate, (req, res) => {
  res.render("404", {
    login: (req.rootUser === false ? 'nope' : req.rootUser)
  })
})

app.get("*", authenticate, (req, res) => {
  res.render("404", {
    login: (req.rootUser === false ? 'nope' : req.rootUser)
  })
})

app.listen(PORT)