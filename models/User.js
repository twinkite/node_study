const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String, 
        maxlength: 50
    },
    email: {
        type: String, 
        trim: true, 
        unique:1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String, 
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0 // 일반유저
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

userSchema.pre('save', function(next){
    var user = this; // userschema를 가리킴
    
    if(user.isModified('password')){    //유저가 비밀번호 변경시에만 
        //비밀번호를 암호화 시킨다.
        bcrypt.genSalt(saltRounds, function(err, salt){
            if(err) return next(arr);

            bcrypt.hash(user.password, salt, function(err, hash){
                //Store hash in your password DB
                if(err) return next(err);
                else user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
})

userSchema.methods.comparePassword = function(plainPassword, cb){
    
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err)
        cb(null, isMatch)
    })
}

userSchema.methods.genToken = function(cb){
    var user = this;

    //json webtoken을 이용해서 토큰 생성하기
    var token = jwt.sign(user._id.toHexString(),'secretToken');
    user.token = token;
    user.save(function(err, user){
        if(err) return cb(err)
        cb(null, user)
    })
}

userSchema.statics.findByToken = function(token, cb){
    var user = this;

    // 가져온 토큰을 decode
    jwt.verify(token, 'secretToken', function(err, decoded){
        // 유저 아이디를 이용해서 유저를 찾은 후
        // 클라이언트에서 가져온 토큰과 디비에 보관된 토큰이 일치하는지 확인
        
        user.findOne({"_id":decoded, "token": token}, function(err, user){
            if(err) return cb(err);
            cb(null, user)
        })
    })
}

const User = mongoose.model('User', userSchema);

module.exports = { User }