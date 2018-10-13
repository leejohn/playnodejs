const puppeteer = require('puppeteer');
const {TimeoutError} = require('puppeteer/Errors');
const fs = require("fs");

var previous_m707_price = Number(fs.readFileSync("price.txt", {flag: "r", encoding: "UTF-8"}));
var current_m707_price = "";

function sendEmail(flight_info) {
  var email = require("emailjs");
  var server = email.server.connect({
    user: "leefirst@vip.qq.com",
    password: "hrwzcxqrjspdbihi",
    host: "smtp.qq.com",
    ssl: true
  });
  // send the message and get a callback with an error or details of the message that was sent
  server.send({
    text: JSON.stringify(flight_info, null, 4),
    from: "leefirst@vip.qq.com",
    to: "leejohn <leejohn@qq.com>, limengying <limengying_1990@126.com>",
    subject: "Lower Price found for trip to Prague: CNY" + current_m707_price
  }, function (err, message) { console.log(err || message); });
}

(async() => {
  const browser = await puppeteer.launch({executablePath: "/usr/bin/google-chrome", headless: true});
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);
  await page.setUserAgent("Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36")
  await page.setExtraHTTPHeaders({
    authority : "www.ctrip.com"
  });

  await page.goto('http://flights.ctrip.com/international/search/round-sha-prg?depdate=2019-5-14_2019-5-28&cabin=y_s&adult=1&directflight=1', {waitUntil : "networkidle0"});
// await page.goto('file:///C:/js-workspace/play/page/prague.html', {waitUntil : "networkidle0"});
  const flight_list_handler = await page.waitForSelector(".flight-list", {visible : true, timeout : 0});
  try {
      await page.waitFor("15000");
  } catch (e) {
    if (e instanceof TimeoutError) {
        console.log("Waiting for 15 seconds and timeout");
      }
  }
  const flight_info = await page.evaluate((flight_list) => {

    strip_return = (str) => {
      return str.replace(/[\r\n]/g, "");
    };

    let info = [];
    let items = flight_list.querySelectorAll(".flight-item");
    for (item of items) {
        let i = {
            airline : strip_return(item.querySelector(".flight-airline").innerText),
            depart : strip_return(item.querySelector(".depart-box").innerText),
            arrive : strip_return(item.querySelector(".arrive-box").innerText),
            consume : strip_return(item.querySelector(".flight-consume").innerText),
            price : strip_return(item.querySelector(".flight-price").innerText)
        };
        info.push(i);
    }
    return info;
  }, flight_list_handler);

  for (flight of flight_info) {
    if (flight.airline.indexOf("MU707") != -1) {
      let current_price_array = flight.price.match(/\d/g);
      for (d of current_price_array) {
        current_m707_price += d;
      }
    }
  }

  if (Number(current_m707_price) < previous_m707_price) {
    console.log("New lower price! M707 price current is " + current_m707_price);
    sendEmail(flight_info);
    fs.writeFileSync("price.txt", current_m707_price, {encoding: "UTF-8"});
  } else {
    console.log("Current price is CNY: " + current_m707_price +  ", Higher than previous M707 price")
    fs.writeFileSync("high.txt", current_m707_price, {encoding: "UTF-8"});
  }

  console.log(flight_info);


  await browser.close();
})();
