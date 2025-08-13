exports.getCookie=async(req,res)=>{
    const cookie=req.cookies;
    return res.status(200).json({cookies:cookie});
}