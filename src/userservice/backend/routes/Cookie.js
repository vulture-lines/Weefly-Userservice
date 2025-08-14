const express=require("express");
const { getCookie, deleteCookie } = require("../controller/Cookie");
const router=express.Router();
router.post("/getcookie",getCookie);
router.post("/deletecookie",deleteCookie)
module.exports=router