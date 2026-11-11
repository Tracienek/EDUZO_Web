const mongoose = require('mongoose');
const schema = new mongoose.Schema({
 classId: {type:mongoose.Schema.Types.ObjectId,ref:'Class',required:true,index:true},
 dateKey: {type:String,required:true},
 title: {type:String,required:true,trim:true},
 startTime: {type:String,default:'14:00'},endTime:{type:String,default:'15:30'},
 tuition:{type:Number,default:0,min:0},content:{type:String,default:''},homework:{type:String,default:''},
 assessments:[{studentId:{type:mongoose.Schema.Types.ObjectId,ref:'Student',required:true},rating:{type:String,enum:['good','complete','incomplete'],required:true},note:{type:String,default:''}}]
},{timestamps:true});
schema.index({classId:1,dateKey:1},{unique:true});
module.exports=mongoose.models.DigitalSession||mongoose.model('DigitalSession',schema);
