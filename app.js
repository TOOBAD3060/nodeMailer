require("dotenv").config()
const express= require("express")
const bodyParser= require("body-parser")
const mongoose=require("mongoose") 
const ejs=require("ejs")
const session=require("express-session")
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose")
const bcrypt= require("bcrypt")
const saltRounds= 10;
const nodeMailer= require("nodemailer")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { response } = require("express")

mongoose.connect(process.env.CONNECT_KEY,{useNewUrlParser : true},(err)=>{
  if(!err) {

  console.log("connected to db")
  }
  else{
    console.log(err)

  }
})

const app= express()
app.set("view engine","ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))


const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String,
    isVerified:{
        type: Boolean
    },
    emailToken:{
        type:String
    },
    date:{
        type: Date,
        default:Date.now()
    },
})

const User = mongoose.model("User",userSchema)


// EMAIL SENDER DETAILS

var transporter = nodeMailer.createTransport({
    service : 'gmail',
    auth: {
        user: process.env.user,
        pass: process.env.password
    },
    tls:{
        rejectUnauthorized : false
    }
})



app.get("/",(req,res)=>{
    res.render("index", {name:"Alaye"})
})

app.get("/verify-email", async(req,res)=>{

    const token = req.query.token;
    User.findOne({emailToken:token},(err,foundUser)=>{
        if(err){
            console.log(err)
        }
        else if(foundUser){
            foundUser.emailToken = null;
            foundUser.isVerified = true;

            foundUser.save((err)=>{
                if(err){
                    console.log(err)
                }
                else{
                    res.redirect("/login")
                }
            })
        }
        else{
            res.redirect("/register")
        }
    })
    // try{
    //     const token =req.query.token;
    //     const user= await User.findOne({emailToken: token})
    //     if (user) {
    //         user.emailToken = null;
    //         user.isVerified = true;

    //         await user.save()
    //         res.redirect("/login")
    //     }
    //     else{
    //         res.redirect("/register")
    //         console.log("email is not verified")
    //     }
    // }
    // catch(err){
    //     console.log(err)
    // }

})

app.get("/login",(req,res)=>{
    res.render("login")
})
app.post("/login",(req,res)=>{
const mail = req.body.email
const dpassword = req.body.password

    User.findOne({email:mail},(err,foundItem)=>{
      
if(err){
    console.log(err)
}

        else{

            if(foundItem){

           bcrypt.compare(dpassword,foundItem.password,(err,result)=>{
            
            if(result===true){
                res.send("Login Successful")
            }

           })
                // if(foundItem.password === dpassword) {
                    // res.send("Login Successful")
                // }
                // else{
                    // res.send("Kindly fill in correct  password")
                // }

            }
            
            

            else{
                res.send("Email not registered")
            }
        }

    })
})

app.get("/register",(req,res)=>{
    res.render("register")
})

app.post("/register",(req,res)=>{
  
bcrypt.hash(req.body.password, saltRounds,(err,hash)=>{
    
    

    const ourUsers = new User({
        name : req.body.name,
        email : req.body.email,
        password : hash,
        emailToken: crypto.randomBytes(64).toString("hex"),
        isVerified: false
    })

    ourUsers.save((err)=>{
        if(!err)
        {console.log("New User Saved")
       
    //    const transporter = nodeMailer.createTransport({
    //     service: "gmail",
    //     auth: {
    //         user: "olalerebabatunde2000@gmail.com",
    //         pass: process.env.password
    //     }
    //    })

    //    const mailOptions={
    //     from: "olalerebabatunde2000@gmail.com",
    //     to: `${req.body.email}`,
    //     subject: `${req.body.name}`,
    //     text: "Special message from Admin",
    //     replyTo: "olalerebabatunde2000@gmail.com"
    //    }

    //    transporter.sendMail(mailOptions,(err,response)=>{
    //     if(err){
    //         console.error('there was an error: ',err)
    //     }
    //     else{
    //         console.log('here is the response: ',response)
    //     }
    //    })

    var mailOptions = {
        from : ` "Verify your email" <olalerebabatunde2000@gmail.com>` ,
         to : ourUsers.email,
         subject : 'TOOBAD Technologies - Verify your email' ,
         html: ` <h2> ${ourUsers.name}! Thanks for registering on our site </h2>
                 <h4>Please verify your email to continue ...</h4>
                 <a href= "http://${req.headers.host}/verify-email?token=${ourUsers.emailToken}">
                 Verify Your Email </a>       
         `
    }
    //  sending mail
    transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
            console.log(error)
        }
        else{
            console.log("Verification email is sent to your gmail account")
        }
    })
        
        res.redirect("/login")
    }
    else {
        console.log(err)
        res.render("register")
    }
    })

} )

   
})







app.listen( process.env.PORT || 3000,()=>{
    console.log("server is up and running on port 3000")
})