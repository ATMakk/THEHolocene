const mongoose= require("mongoose")

const adminSchema= new mongoose.Schema({
    firstname:{type:String, required:true},
    lastname:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    tag:{type:String, sparse:true, unique:true},
    password:{type:String, required:true, select:false},
    role:{type:String, default:"admin", enum:["user", "admin", "operator"]},
    
    idNumber:{type:String, sparse:true, unique:true},
   
    profilePicture:{
        secure_url:{type:String},
        public_id:{type:String}
    }
}, {timestamps:true, strict:"throw"})


const adminModel= mongoose.model("admin", adminSchema)

module.exports=adminModel