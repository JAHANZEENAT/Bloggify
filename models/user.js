const mongoose = require('mongoose')
const {createHmac, randomBytes} =  require("crypto");
const { createTokenForUser } = require('../service/auth');

const userSchema = new mongoose.Schema({
    fullname : {
        type : String,
        required : true,
    },
    email :{
        type : String,
        required : true,
        unique : true,
    },
    salt:{
        type : String,
    },
    password:{
        type : String,
        required : true,
    },
    profileImg : {
        type :String,
        default : "./images/default.png"
    },
    role :{
        type : String,
        enum : ["USER","ADMIN"],
        default:"USER",

    }
},{timestamps : true })

//to hash passwords
userSchema.pre('save',function(next){
    const user = this;

    if(!user.isModified("password")) return;
    const salt = randomBytes(16).toString(); //random string of 16 bytes
    const hashpassword = createHmac("sha256",salt)
    .update(user.password)
    .digest("hex")

    this.salt=salt;
    this.password = hashpassword;

    next();
})

//to check for valid user (signin)
userSchema.static('matchPasswordAndCreateToken',async function(email,password){
    const user =  await this.findOne({email});
    if(!user) throw new Error('User not found!')

    const salt = user.salt;
    const hashpassword= user.password;
    const providedPassword = createHmac("sha256",salt)
    .update(password)
    .digest("hex")

    if(hashpassword != providedPassword) throw new Error('Invalid Password!');
    //return {...user,password:undefined,salt : undefined};
    return user;
    next();
})

const userModel = mongoose.model("user",userSchema);
module.exports = userModel;