const mongoose = require('mongoose')
const config = require("../config")

mongoose.connect(config.db_key, {
    useNewUrlParser: true, useUnifiedTopology: true,
    // useCreateIndex:true,useFindAndModify:false
}).then(() => console.log('connection succes')).catch((err) => console.log(err))