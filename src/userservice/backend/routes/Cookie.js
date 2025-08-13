const express=require("express");
const { getCookie } = require("../controller/Getcookie");
const router=express.Router();
router.post("/getcookie",getCookie);
module.exports=router