const mongoose=require('mongoose');
const schema=new mongoose.Schema({classId:{type:mongoose.Schema.Types.ObjectId,ref:'Class',required:true,index:true},studentId:{type:mongoose.Schema.Types.ObjectId,ref:'Student',required:true},subject:{type:String,default:'Chung'},performance:{type:String,enum:['good','complete','incomplete'],default:'complete'},character:{type:String,enum:['good','pass','improve'],default:'pass'},comment:{type:String,default:''}},{timestamps:true});
schema.index({classId:1,studentId:1,subject:1},{unique:true});
module.exports=mongoose.models.DigitalRemark||mongoose.model('DigitalRemark',schema);
