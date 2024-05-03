require('dotenv').config();

const express =  require('express')
const session = require('express-session')
const app = express()
const path = require('path')
const userModel = require("./models/user.js")
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const {checkForAuth}=require("./middlewares/auth.js")
const multer = require('multer')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URL)
.then(()=>{console.log("Connected to mongodb")})
.catch((err)=>console.log("cannot connect to mongodb",err))

const userRouter = require("./routes/user.js")
const blogModel = require('./models/blog.js')
const commentModel = require('./models/comment.js')

app.set("view engine","ejs")
app.set('views',path.resolve("./views"))

app.use("/",userRouter);

app.use(express.urlencoded({extended:false}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'zeenat1111', // Change this to a random secret key
    resave: false,
    saveUninitialized: true
  }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve("./public/upload/"))
    },
    filename: function (req, file, cb) {
      const filename = `${Date.now()}-${file.originalname}`;
      cb(null,filename);
 }
  })
  
const upload = multer({ storage: storage })

app.post("/signup", async (req,res)=>{

    const {fullname,email,password}=req.body;
    await userModel.create({
        fullname ,
        email ,
        password ,
    })
    return res.redirect("/");
})

app.post("/signin",async(req,res)=>{
        const {email,password}=req.body;
        try{
            const user = await userModel.matchPasswordAndCreateToken(email,password);
            req.session.username = user.fullname;
            req.session.userid=user._id;
            req.session.img = user.profileImg;
            return res.redirect("/");
        }catch(error){
            return res.render("signin",{
                error : "Invalid email or password !"
            })
        }
})
app.use(checkForAuth("token"));


app.get("/logout",(req,res)=>{
    req.session.destroy(err => {
        if (err) {
          console.error('Error destroying session:', err);
          res.status(500).send('Internal Server Error');
        } else {
            res.redirect("/");
        }
      });
})

/*/app.post("/addBlog",async (req,res)=>{
    const {coverImg,title,body}=req.body;
    await blogModel.create({
        coverImg,title,body,
    })
    return res.redirect("/");
})*/
app.post("/addBlog",upload.single('coverImg'),async(req,res)=>{
    const {title,body,coverImg}=req.body;
    const blog = await blogModel.create({
        title,body,
        coverImg : `/upload/${req.file.filename}`,
        createdBy : req.session.userid,
    })
    return res.redirect("/");
})
app.get("/",async(req,res)=>{
    const allBlogs = await blogModel.find({});
    req.session.blogss=allBlogs;
    return res.render("home",{
        user : req.session.username,
        blogs : allBlogs,
    })
})
function findById(jsonList, id) {
    for (let i = 0; i < jsonList.length; i++) {
        if (jsonList[i]._id === id) {
          return jsonList[i];
        }
      }
      // If no object with the given id is found, return null or handle as needed
      return null;
  }
app.get('/viewblogs/:id',async(req,res)=>{ 
    const readBlog = findById(req.session.blogss,req.params.id);
    const comments= await commentModel.find({blogId :req.params.id }).populate("createdBy")
    return res.render("viewBlogs",{
        user : req.session.username,
        img : req.session.img,
         readblog : readBlog,
         comments,
     })  
})

app.post('/comment/:blogId',async(req,res)=>{
    await commentModel.create({
        content : req.body.comment,
        blogId : req.params.blogId,
        createdBy : req.session.userid,
    })
    return res.redirect(`/viewblogs/${req.params.blogId}`);
})

app.use(express.static(path.resolve("./public")));
const PORT = process.env.PORT || 8001;

app.listen(PORT,()=>{
    console.log(`Server started at ${PORT}`)
})
