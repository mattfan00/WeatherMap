var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose")

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  favRoutes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FavRoute"
    }
  ]
})

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema)