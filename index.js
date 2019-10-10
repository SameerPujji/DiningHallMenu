const express = require("express");
const exphbs = require("express-handlebars");
const app = express();
const puppeteer = require("puppeteer");
const $ = require("cheerio");
const url = "https://wlu.campusdish.com/en/LocationsAndMenus/FreshFoodCompany";

const twilio = require("twilio");
const client = new twilio(process.env.TWILIO_KEY, process.env.TWILIO_AUTH);

app.engine(
  "hbs",
  exphbs({
    extname: "hbs",
    defaultLayout: "layout"
  })
);
app.set("view engine", "hbs");

app.get("/", function(req, res) {
  puppeteer
    .launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
    .then(function(browser) {
      console.log("returning browser");
      return browser.newPage();
    })
    .then(function(page) {
      return page.goto(url).then(function() {
        console.log("returning page");
        return page.content();
      });
    })
    .then(function(html) {
      console.log("inside logic bit");
      let mealArray = [];
      let meal = $("#mealTypeBtn span", html).text();

      $(".menu__category a", html).each(function() {
        mealArray.push($(this).text());
      });
      client.messages.create({
        to: process.env.MY_NUMBER,
        from: process.env.TWILIO_NUMBER,
        body:
          "Hello! Today's " +
          meal.toLowerCase() +
          " menu is: " +
          mealArray.join(", ")
      });
      res.send("Success!");
    })
    .catch(function(err) {
      console.log("Error with promise: ", err);
      client.messages.create({
        to: process.env.MY_NUMBER,
        from: process.env.TWILIO_NUMBER,
        body: "There was an error getting the menu, please try again"
      });
      res.send("error with request");
    });
});

//================================================
app.listen(process.env.PORT || 3000);
