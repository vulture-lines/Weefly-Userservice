//Importing the jwt library
const jwt = require("jsonwebtoken");

//Function to generate User JSON web token
const Usertokengenerator = (id,userId) => {
  const token = jwt.sign({ id,userId}, process.env.JWT_KEY, {
    expiresIn: "1h",
  });
  return token;
};

//Function to generate Admin JSON web token
const Admintokengenerator = (id,Access) => {
  const token = jwt.sign({ id,Access}, process.env.JWT_KEY, {
    expiresIn: "1h",
  });
  return token;
};

//Function to generate Admin JSON web token
const Agenttokengenerator = (id) => {
  const token = jwt.sign({ id}, process.env.JWT_KEY, {
    expiresIn: "1h",
  });
  return token;
};

module.exports = {Usertokengenerator,Admintokengenerator,Agenttokengenerator};