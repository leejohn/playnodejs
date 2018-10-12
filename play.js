const puppeteer = require('C:/Users/Administrator/node_modules/puppeteer-core');
const {TimeoutError} = require('C:/Users/Administrator/node_modules/puppeteer-core/Errors');

(async() => {
  const browser = await puppeteer.launch({executablePath: "C:/Users/Administrator/AppData/Local/Google/Chrome/Application/chrome.exe", headless: true});
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
      await page.waitForSelector("#price_35", {visible : true, timeout : 15000});
  } catch (e) {
    if (e instanceof TimeoutError) {
        console.log("Waiting for price 35 for 15 seconds and timeout");
      }
  }
  const flight_info = await page.evaluate((flight_list) => {
    let info = [];
    let items = flight_list.querySelectorAll(".flight-item");
    for (item of items) {
        let i = {
            airline : item.querySelector(".flight-airline").innerText,
            depart : item.querySelector(".depart-box").innerText,
            arrive : item.querySelector(".arrive-box").innerText,
            consume : item.querySelector(".flight-consume").innerText,
            price : item.querySelector(".flight-price").innerText
        };
        info.push(i);
    }
    return info;
  }, flight_list_handler);

  console.log(flight_info);
  await browser.close();
})();

// var email 	= require("emailjs");
// var server 	= email.server.connect({
//    user:    "leefirst@vip.qq.com", 
//    password:"hrwzcxqrjspdbihi", 
//    host:    "smtp.qq.com", 
//    ssl:     true
// });
 
// // send the message and get a callback with an error or details of the message that was sent
// server.send({
//    text:    "i hope this works", 
//    from:    "leefirst@vip.qq.com", 
//    to:      "lij70 <lij70@spdb.com.cn>, limengying <limengying_1990@126.com>",
//    subject: "testing emailjs"
// }, function(err, message) { console.log(err || message); });