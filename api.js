//add the new serving size amount from userFood
//assign the date 
const user = require('./models/user.js');
const Token = require("./models/Token.js");
const { JsonWebTokenError } = require('jsonwebtoken');
const sendEmail = require("./sendEmail");
const sendCode = require("./sendCode");
const sendVerification = require("./sendVerification");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

require('express');
require('mongodb');

exports.setApp = function(app, client) {

  app.post('/api/resetCalorieGoal',  async (req, res, next) => {
    const token = require('./createJWT.js');
    const {jwtToken, newGoal} = req.body;

    try{
      if(token.isExpired(jwtToken))
      {
        console.log('token expired')
        var r = {error: 'The JWT is no longer valid', jwtToken: ''};
        res.status(200).json(r); 
        return
      }
    }
    catch(e)
    {
      console.log(e.message);
    }
    email = token.getData(jwtToken);

    const db = client.db("database");
    const users = db.collection("Users");
    theEmail = await users.findOne({"Email" : email});

          query = {Email : theEmail.Email};
          newPass = {$set: {calorieGoal : newGoal}};
          const result = await users.updateOne(query, newPass);
          res.status(200).json({error: 'worked'});       
  });

  app.post('/api/resetPassword',  async (req, res, next) => {
    const {email, newPassword, code} = req.body;
    const db = client.db("database");
    const users = db.collection("Users");
    theEmail = await users.find({"Email" : email}).toArray();

    let token = await db.collection('Tokens').find({"userId": email}).toArray();
      if (token.length > 0)
      {
        const isValid = await bcrypt.compare(code, token[0].token);
        if (isValid)
        {
          console.log('there\'s a token');
          query = {Email : theEmail[0].Email};
          const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT));
          newPass = {$set: {Password : hash}};
          const result = await users.updateOne(query, newPass);
          res.status(200).json({error: 'worked'});
        }
        else {
          res.status(200).json({error: 'token invalid'});  
        }
      }
      else{
        res.status(200).json({error: 'token expired'});  
      
      }
  });

  app.post('/api/verifyEmail',  async (req, res, next) => {
    const {email, code} = req.body;
    const db = client.db("database");
    const users = db.collection("Users");
    theEmail = await users.find({"Email" : email}).toArray();


    let token = await db.collection('Tokens').find({"userId": email}).toArray();
      if (token.length > 0)
      {
        const isValid = await bcrypt.compare(code, token[0].token);
        if (isValid)
        {
          console.log('there\'s a token');
          console.log(theEmail.length);
          query = {Email : theEmail[0].Email};
          verifyEmail = {$set: {"EmailAuth" : true}};
          const result = await users.updateOne(query, verifyEmail);
          res.status(200).json({error: 'worked'});
        }
        else{
          res.status(200).json({error: 'token invalid'});  
        }
      }
      else{
        res.status(200).json({error: 'token expired'});  
      
      }

  });

  app.post("/api/requestEmailAuthorization", async (req, res, next) => 
  {
    const{email} = req.body;
    console.log(email);
    const db = client.db("database");
    const resetUser = await db.collection('Users').findOne({"Email": email});
    var ret;
    console.log('im here')
    if (!resetUser)
    {
      ret = {error :  'Email does not exist.'};
      console.log('im here2')
    }
    else
    {
      console.log('im here3')
      let token = await db.collection('Tokens').find({"userId": email}).toArray();
      await db.collection('Tokens').deleteOne({"userId" : email});
  
      creation = Date.now();
      expiration = creation + 1800000;
  
      let resetToken = crypto.randomBytes(32).toString("hex");
      const hash = await bcrypt.hash(resetToken, Number(process.env.BCRYPT_SALT));
      const newToken ={userId: email, token: hash,createdAt: new Date(creation), expireAt: new Date(expiration)}
      const result = await db.collection('Tokens').insertOne(newToken);
    
      const link = `${process.env.CLIENT_URL}/emailAuthorization?token=${resetToken}&id=${email}`;
    
      sendVerification(email, link);
      ret = { error: 'email sent', link: link};
    }
    console.log('im here4')
    res.status(200).json(ret);

  });

app.post("/api/requestResetPassword", async (req, res, next) => {
    const { email } = req.body;
    const db = client.db("database");
    const resetUser = await db.collection('Users').findOne({ "Email": email });

    if (!resetUser){
      res.status(200).json({ id:-1 });
      console.log('Nonexistant user');
    }
    else{
    let token = await db.collection('Tokens').find({ "userId": email }).toArray;
    await db.collection('Tokens').deleteOne({ "userId": email });

    creation = Date.now();
    expiration = creation + 1800000;

    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, Number(process.env.BCRYPT_SALT));
    const newToken = { userId: email, token: hash, createdAt: new Date(creation), expireAt: new Date(expiration) }
    const result = await db.collection('Tokens').insertOne(newToken);

    const link = `${process.env.CLIENT_URL}/passwordReset?token=${resetToken}&id=${email}`;

    sendEmail(email, link);
    var ret = { error: 'email sent', link: link };
    res.status(200).json(ret);
    }
  });

  app.post('/api/deleteUserFood', async (req, res, next) =>
  {
    // incoming: int userId, string foodName, int calories
    // outgoing: error
    
    //const { userId, foodName, calories } = req.body;
    const token = require('./createJWT.js');
    const {foodName, jwtToken, year, day, month} = req.body;
  
    try{
      if(token.isExpired(jwtToken))
      {
        console.log('token expired')
        var r = {error: 'The JWT is no longer valid', jwtToken: ''};
        res.status(200).json(r); 
        return
      }
    }
    catch(e)
    {
      console.log(e.message);
    }

    let email = token.getData(jwtToken);
    
    var error = 'notDeleted';
  
    try
    {
      const db = client.db("database");
      const result = db.collection('Meals').deleteOne({Email: email, FoodName: foodName, Year: year, Month : month, Day : day});
      error = 'deleted';
    }
    catch(e)
    {
      error = e.toString();
    }
  
    var refreshedToken = null;
    try{
      refreshedToken = token.refresh(jwtToken);
    }
    catch(e)
    {
      console.log(e.message);
    }
  
    var ret = { error: error, jwtToken: refreshedToken};
    res.status(200).json(ret);
  });

app.post('/api/addUserFood', async (req, res, next) =>
{
  // incoming: int userId, string foodName, int calories
  // outgoing: error
	
  //const { userId, foodName, calories } = req.body;
  const token = require('./createJWT.js');
  const {foodName, calories, fats, carbohydrates, protein, servingSize, numServings, jwtToken} = req.body;

  let email = token.getData(jwtToken);
  try{
    if(token.isExpired(jwtToken))
    {
      console.log('token expired')
      var r = {error: 'The JWT is no longer valid', jwtToken: ''};
      res.status(200).json(r);
      return
    }
  }
  catch(e)
  {
    console.log(e.message);
  }

//set year/month/day
const date=new Date();
let year=date.getFullYear();
let month=date.getMonth()+1;
let day=date.getDate();
	
  const newFood = {Email: email, Year: year, Month: month, Day: day, FoodName: foodName, Calories: calories, Fats: fats, Carbohydrates: carbohydrates, Protein: protein, ServingSize: servingSize, NumServings: numServings};
  var error = 'notAdded';

  try
  {
    const db = client.db("database");
    const result = db.collection('Meals').insertOne(newFood);
    console.log("imhere")
    error = 'added';
  }
  catch(e)
  {
    error = e.toString();
  }

  var refreshedToken = null;
  try{
    refreshedToken = token.refresh(jwtToken);
  }
  catch(e)
  {
    console.log(e.message);
  }

  var ret = { error: error, jwtToken: refreshedToken};
  res.status(200).json(ret);
});
	
app.post('/api/addDatabaseFood', async (req, res, next) =>
{
  // incoming: int userId, string foodName, int calories
  // outgoing: error
	
  const token = require('./createJWT.js');
  const {foodName, calories, fats, carbohydrates, protein, servingSize, jwtToken} = req.body;
  
  try{
    if(token.isExpired(jwtToken))
    {
      var r = {error: 'The JWT is no longer valid', jwtToken: ''};
      res.status(200).json(r);
      return
    }
  }
  catch(e)
  {
    console.log(e.message);
  }

  const newFood = {FoodName: foodName, Calories: calories, Fats: fats, Carbohydrates: carbohydrates, Protein: protein, ServingSize: servingSize};
  var error = 'failure';

  try
  {
    const db = client.db("database");
    const result = db.collection('Foods').insertOne(newFood);
    error = 'success';
  }
  catch(e)
  {
    error = e.toString();
  }
  
  var refreshedToken = null;
  try{
    refreshedToken = token.refresh(jwtToken);
  }
  catch(e)
  {
    console.log(e.message);
  }

  var ret = { error: error, jwtToken: refreshedToken};
  res.status(200).json(ret);
});

app.post('/api/register', async (req, res, next) =>
{
  // incoming: int userId, string foodName, int calories
  // outgoing: error
    let error;
    const {email,password} = req.body;
    const db = client.db("database");
    const result = await db.collection('Users').find({"Email": email}).toArray();
    if(result.length > 0)
    {
        error = 'exists';
    }
    else{
      const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT));//
      const newUser = {Email: email, Password: hash, EmailAuth: false, calorieGoal: 2000};
      const insert = await db.collection('Users').insertOne(newUser);
      error = 'created';
    }
    var ret = { error: error};
    res.status(200).json(ret); 

});

app.post('/api/requestPasswordReset', async (req, res, next) => {
  const {email} = req.body;
  let error;
  try
  {
    const db = client.db("database");
    const result = db.collection('Users').find(email);
    error = 'found';
  }
  catch(e)
  {
    error = e.toString();
  }

});

app.post('/api/getUserMealPlan', async (req, res, next) =>
{
  // incoming: int userId, 
  // outgoing: error, Array of JSON objects: String foodName, int calories
	
  const token = require('./createJWT.js');
  const {year, month, day, jwtToken} = req.body;
  var error = 'success';
  let email = token.getData(jwtToken);
  console.log(email);
  try{
    if(token.isExpired(jwtToken))
    {
      var r = {error: 'The JWT is no longer valid', jwtToken: ''};
      res.status(200).json(r);
      return
    }
  }
  catch(e)
  {
    console.log(e.message);
  }
  const db = client.db("database");
  const result = await db.collection('Meals').find({"Email": email, "Year": year, "Month": month, "Day": day}).toArray();
  if(result.length<1){
    error='does not exist';
  }
  nutritionResult = getTotalNutrition(result);
  var _name = [];
  var _calories = [];
  var _protein = [];
  var _fats = [];
  var _carbs = [];
  var _servings = [];
	
  for( var i=0; i<result.length; i++ )
  {
    _name.push(result[i].FoodName);
    _calories.push(result[i].Calories);
    _protein.push(result[i].Protein);
    _fats.push(result[i].Fats);
    _carbs.push(result[i].Carbohydrates)
    _servings.push(result[i].NumServings)

  }

  var refreshedToken = null;
  try{
    refreshedToken = token.refresh(jwtToken);
  }
  catch(e)
  {
    console.log(e.message);
  }

  var ret = { nameResults: _name, caloriesResults: _calories, proteinResults: _protein, fatResults: _fats, carbsResults: _carbs, numServings: _servings,
     Calories: nutritionResult.Calories, Fats: nutritionResult.Fats, Protein: nutritionResult.Protein, Carbs: nutritionResult.Carbs,
      error: error, year: year, month: month, day: day, jwtToken: refreshedToken};
  res.status(200).json(ret);
});

  app.post('/api/getCalorieGoal', async (req, res, next) => {
    // incoming: jwtToken
    // outgoing: calorieGoal, error

    const token = require('./createJWT.js');
    const {jwtToken} = req.body;
    let email = token.getData(jwtToken);
    let calorieGoal;
    var error = 'success';

    try{
      if(token.isExpired(jwtToken))
      {
        var r = {error: 'The JWT is no longer valid', jwtToken: ''};
        res.status(200).json(r);
        return
      }
    }
    catch(e)
    {
      console.log(e.message);
    }
    const db = client.db("database");
    const result = await db.collection('Users').findOne({"Email": email});
    calorieGoal = result.calorieGoal;

    if(!result){
      error = 'Does not exist';
      console.log(error);
      return;
    }

    var refreshedToken = null;
    try{
      refreshedToken = token.refresh(jwtToken);
    }
    catch(e)
    {
      console.log(e.message);
    }    

    var ret = { calorieGoal:  calorieGoal, jwtToken: refreshedToken, error: error};
    res.status(200).json(ret);
  });

  app.post('/api/login', async (req, res, next) => {
    // incoming: email, password
    // outgoing: id, firstName, lastName, error

    var loginError = 'loginFailure';
    var ret;
    const token = require('./createJWT.js');
    const { email, password } = req.body;


    const db = client.db("database");
    const results = await db.collection('Users').findOne({ Email: email });
    if (!results) {
      ret = { id: -1 };
      console.log('Incorrect login credentials')
      res.status(200).json(ret);
    }
    else {
      const isValid = await bcrypt.compare(password, results.Password);
      if (isValid) {
        if (results.EmailAuth == true) {
          try {
            const token = require("./createJWT.js");
            ret = token.createToken(email);
            console.log(ret);
          }
          catch (e) {
            ret = { error: e.message };
            console.log(ret);
          }
        }
      }
      else {
        ret = { Email: email, error: loginError }
        console.log(ret);
      }

      res.status(200).json(ret);
    }
  });

app.post('/api/getFood', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error

  const token = require('./createJWT.js');
  const {jwtToken} = req.body;

  let error = "";
  try{
    if(token.isExpired(jwtToken))
    {
      var r = {error: 'The JWT is no longer valid', jwtToken: ''};
      res.status(200).json(r);
      return
    }
  }
  catch(e)
  {
    console.log(e.message);
  }

  const db = client.db("database");
  const results = await db.collection('Foods').find({}).toArray();
  
  var refreshedToken = null;
  try{
    refreshedToken = token.refresh(jwtToken);
  }
  catch(e)
  {
    console.log(e.message);
  }

  var _name = [];
  var _calories = [];
  var _protein = [];
  var _fats = [];
  var _carbs = [];
  var _servingSize = [];
  

  for( var i=0; i<results.length; i++ )
  {
    _name.push(results[i].FoodName);
    _calories.push(results[i].Calories);
    _protein.push(results[i].Protein);
    _fats.push(results[i].Fats);
    _carbs.push(results[i].Carbohydrates)
    _servingSize.push(results[i].ServingSize)
  }

  var ret = {nameResults: _name, caloriesResults: _calories, proteinResults: _protein,
     fatResults: _fats, carbsResults: _carbs, servingResults: _servingSize, error:error, jwtToken: refreshedToken};
  res.status(200).json(ret);
});

app.post('/api/searchFood', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error

  var error = '';

  const token = require('./createJWT.js');
  const {search, jwtToken} = req.body;

  try{
    if(token.isExpired(jwtToken))
    {
      var r = {error: 'The JWT is no longer valid', jwtToken: ''};
      res.status(200).json(r);
      return
    }
  }
  catch(e)
  {
    console.log(e.message);
  }

  var _search = search.trim();
  
  const db = client.db("database");
  const results = await db.collection('Foods').find({"FoodName":{$regex:_search+'.*', $options:'i'}}).toArray();
  
  var refreshedToken = null;
  try{
    refreshedToken = token.refresh(jwtToken);
  }
  catch(e)
  {
    console.log(e.message);
  }

  var _ret = [];
  for( var i=0; i<results.length; i++ )
  {
    _ret.push(results[i].FoodName);
  }
  
  var ret = {results:_ret, error:error, jwtToken: refreshedToken};
  res.status(200).json(ret);
});

app.post('/api/checkUserDuplicate', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error

  var error = 'dne';
  const token = require('./createJWT.js');
  const {email, jwtToken} = req.body;

  try{
    if(token.isExpired(jwtToken))
    {
      var r = {error: 'The JWT is no longer valid', jwtToken: ''};
      res.status(200).json(r);
      return
    }
  }
  catch(e)
  {
    console.log(e.message);
  }

  const db = client.db("database");
  const results = await db.collection('Users').find({ "Email": email}).toArray();
  if(results.length > 0)
  {
    error = 'exists';
  }

  var refreshedToken = null;
  try{
    refreshedToken = token.refresh(jwtToken);
  }
  catch(e)
  {
    console.log(e.message);
  }
  
  var ret = {error:error, jwtToken: refreshedToken};
  res.status(200).json(ret);
});

app.post('/api/checkFoodDuplicate', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error

  var error = 'dne';

  const token = require('./createJWT.js');
  const {foodName, jwtToken} = req.body;

  try{
    if(token.isExpired(jwtToken))
    {
      var r = {error: 'The JWT is no longer valid', jwtToken: ''};
      res.status(200).json(r);
      return
    }
  }
  catch(e)
  {
    console.log(e.message);
  }

  const db = client.db("database");
  const results = await db.collection('Foods').find({ "FoodName": foodName}).toArray();
  if(results.length > 0)
  {
    error = 'exists';
  }
  
  var refreshedToken = null;
  try{
    refreshedToken = token.refresh(jwtToken);
  }
  catch(e)
  {
    console.log(e.message);
  }

  var ret = {error:error, jwtToken: refreshedToken};
  res.status(200).json(ret);
});

app.post('/api/resetPasswordMobile',  async (req, res, next) => {
  const {email, newPassword, code} = req.body;
  const db = client.db("database");
  const users = db.collection("Users");
  theEmail = await users.find({"Email" : email}).toArray();

  let token = await db.collection('MobileTokens').find({"userId": email}).toArray();
    if (token.length > 0)
    {
      const isValid = await bcrypt.compare(code, token[0].token);
      if (isValid)
      {
        console.log('there\'s a token');
        query = {Email : theEmail[0].Email};
        await db.collection('MobileTokens').deleteOne({"userId" : email});
        const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT));
        newPass = {$set: {Password : hash}};
        const result = await users.updateOne(query, newPass);
        res.status(200).json({error: 'worked'});
      }
      else {
        res.status(200).json({error: 'token invalid'});  
      }
    }
    else{
      res.status(200).json({error: 'token expired'});  
    
    }
});

app.post('/api/verifyEmailMobile',  async (req, res, next) => {
  const {email, code} = req.body;
  const db = client.db("database");
  const users = db.collection("Users");
  theEmail = await users.find({"Email" : email}).toArray();


  let token = await db.collection('MobileTokens').find({"userId": email}).toArray();
    if (token.length > 0)
    {
      const isValid = await bcrypt.compare(code, token[0].token);
      if (isValid)
      {
        await db.collection('MobileTokens').deleteOne({"userId" : email});
        console.log('there\'s a token');
        console.log(theEmail.length);
        query = {Email : theEmail[0].Email};
        verifyEmail = {$set: {"EmailAuth" : true}};
        const result = await users.updateOne(query, verifyEmail);
        res.status(200).json({error: 'worked'});
      }
      else{
        res.status(200).json({error: 'token invalid'});  
      }
    }
    else{
      res.status(200).json({error: 'token expired'});  
    
    }

});

app.post("/api/requestEmailAuthorizationMobile", async (req, res, next) => 
{
  const{email} = req.body;
  const db = client.db("database");
  const resetUser = await db.collection('Users').findOne({"Email": email});
  var ret;
  if (!resetUser)
  {
    ret = {error :  'Email does not exist.'};
  }
  else
  {
    console.log('im here3')
    let token = await db.collection('MobileTokens').find({"userId": email}).toArray();
    await db.collection('MobileTokens').deleteOne({"userId" : email});

    creation = Date.now();
    expiration = creation + 1800000;

    let resetToken = getSixDigitCode();
    const hash = await bcrypt.hash(resetToken, Number(process.env.BCRYPT_SALT));
    const newToken ={userId: email, token: hash,createdAt: new Date(creation), expireAt: new Date(expiration)}
    const result = await db.collection('MobileTokens').insertOne(newToken);
  
    let verify = 'Email authorization';
    console.log(verify);
    sendCode(email,  verify, resetToken);
    ret = { error: 'email sent'};
  }
  console.log('im here4')
  res.status(200).json(ret);

});

app.post("/api/requestResetPasswordMobile", async (req, res, next) => 
{
  const{email} = req.body;
  const db = client.db("database");
  const resetUser = await db.collection('Users').findOne({"Email": email});


  if (!resetUser)
    res.status(200).json({error :  'Email does not exist.'});

  let token = await db.collection('MobileTokens').find({"userId": email}).toArray;
  await db.collection('MobileTokens').deleteOne({"userId" : email});

  creation = Date.now();
  expiration = creation + 1800000;

  let resetToken = getSixDigitCode();
  const hash = await bcrypt.hash(resetToken, Number(process.env.BCRYPT_SALT));
  const newToken ={userId: email, token: hash,createdAt: new Date(creation), expireAt: new Date(expiration)}
  const result = await db.collection('MobileTokens').insertOne(newToken);

  let verify = 'Password reset';
  console.log(verify);
  sendCode(email, verify, resetToken);
  var ret = { error: 'email sent'};
  res.status(200).json(ret);
});
	
}

function getSixDigitCode() {

  minimumValue = 100000;
  maximumValue = 999999;
  range = maximumValue-minimumValue + 1

  // Generate random number
  const randomBytes = crypto.randomBytes(3);
  const randomNumber = randomBytes.readUIntBE(0, 3);

  const sixDigitCode = randomNumber % range;

  return sixDigitCode.toString();
};

function getTotalNutrition(array){
  //start off with an array
var rows=array.length;
var calories=0;
var carbs=0;
var fats=0;
var protein=0;
  
for(var i=0;i<rows;i++){
calories+=array[i].Calories * array[i].NumServings;
carbs+=array[i].Carbohydrates * array[i].NumServings;
protein+=array[i].Protein * array[i].NumServings;
fats+=array[i].Fats * array[i].NumServings;
}
return {Calories: calories , Carbs: carbs, Protein : protein, Fats: fats}
};
