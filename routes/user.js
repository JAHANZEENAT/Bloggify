const express = require('express')
const multer  = require('multer')
const router = express.Router();
const path = require('path');


router.get("/signin",(req,res)=>{
    return res.render("signin")
})
router.get("/signup",(req,res)=>{
    return res.render("signup")
})
router.get("/addBlog",(req,res)=>{
    return res.render("addBlog")

})

module.exports=router;