const puppeteer = require('puppeteer-core');
const { TimeoutError } = require('puppeteer-core/Errors');
const fs = require("fs");
console.logCopy = console.log.bind(console);

console.log = function(data)
{
    var currentDate = '[' + new Date().toUTCString() + '] ';
    this.logCopy(currentDate, data);
};

var path_to_chrome = process.argv[2]
console.log("Use Chrome: " + path_to_chrome)

function sendEmail(flight_info, ca405_lower_price_flag, lowest_price_flag, previous_lowest_price, previous_ca405_price, current_ca405_price, current_lowest_price, current_ca405_price, current_lowest_flight, ca405_flight) {
  var email = require("emailjs");
  var server = email.server.connect({
    user: "leejohn",
    password: "tljruprgovvlcagb",
    host: "smtp.qq.com",
    ssl: true
  });

  if (ca405_lower_price_flag && lowest_price_flag) {
    var subject = "Japan lower " + ca405_flight + " price: " + current_ca405_price + " and lowest price " + current_lowest_flight + " " + current_lowest_price;
  } else if (ca405_lower_price_flag) {
    var subject = "Japan lower " + ca405_flight + " price: " + current_ca405_price;
  } else if (lowest_price_flag) {
    var subject = "Japan lowest price " + current_lowest_flight + " " + current_lowest_price;
  }


  // send the message and get a callback with an error or details of the message that was sent
  server.send({
    text: JSON.stringify(flight_info, null, 4),
    from: "lijian <leefirst@vip.qq.com>",
    to: "leejohn <leejohn@qq.com>, limy <limengying_1990@126.com>",
    subject: subject
  }, function (err, message) { console.log(err || message); });
}

async function crawl(url, specified_flight) {
  var previous_lowest_price;
  var previous_ca405_price;
  var current_ca405_price;
  var current_lowest_price;
  var current_lowest_flight;
  var ca405_flight;

  function init_variables() {
    previous_lowest_price = Number(fs.readFileSync("price.txt", { flag: "r", encoding: "UTF-8" }));
    previous_ca405_price = Number(fs.readFileSync("ca405_price.txt", { flag: "r", encoding: "UTF-8" }));
    current_ca405_price = undefined;
    current_lowest_price = 99999999;
    current_lowest_flight = undefined;
    ca405_flight = undefined;
  }

  init_variables();

  const browser = await puppeteer.launch({ executablePath: path_to_chrome, headless: false , args :['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);
  await page.setUserAgent("Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36")
  await page.setExtraHTTPHeaders({
    authority: "www.ctrip.com"
  });

  await page.goto(url, { waitUntil: "networkidle0" });
  // await page.goto('file:///C:/js-workspace/play/page/prague.html', {waitUntil : "networkidle0"});
  const flight_list_handler = await page.waitForSelector(".flight-list", { visible: true, timeout: 0 });

  const flight_info = await page.$eval(".flight-list", (flight_list) => {

    strip_return = (str) => {
      return str.replace(/[/r/n]/g, "");
    };

    let info = [];
    let items = flight_list.querySelectorAll(".flight-item");
    for (item of items) {
      try {
        let i = {
          airline: strip_return(item.querySelector(".flight-airline").innerText),
          depart: strip_return(item.querySelector(".depart-box").innerText),
          arrive: strip_return(item.querySelector(".arrive-box").innerText),
          consume: strip_return(item.querySelector(".flight-consume").innerText),
          price: strip_return(item.querySelector(".flight-price").innerText)
        };
        info.push(i);
      } catch (error) {
        continue;
      }

    }
    return info;
  });
  var lowest_price_flag = false;
  var send_email_flag = false;
  var ca405_lower_price_flag = false;
  for (flight of flight_info) {
    try {
      flight_price = flight.price.match(/\d+/)[0];

      if (current_lowest_price > flight_price) {
        current_lowest_price = flight_price;
      }

      if (flight_price < previous_lowest_price) {
        previous_lowest_price = flight_price;
        lowest_price_flag = true;
        current_lowest_flight = flight.airline
      }
      if (flight.airline.indexOf(specified_flight) != -1) {
        current_ca405_price = flight_price;
        if (flight_price < previous_ca405_price) {
          ca405_flight = flight.airline;
          ca405_lower_price_flag = true;
        }
      }
    } catch (error) {
      console.log(error)
    }


  }

  if (ca405_lower_price_flag) {
    console.log("A new CA405 lower price found!");
    send_email_flag = true;
    fs.writeFileSync("ca405_price.txt", current_ca405_price, { encoding: "UTF-8" });
  } else {
    console.log("Current price is CNY: " + current_ca405_price + ", Higher than previous ca405 price")
    fs.writeFileSync("high_ca405.txt", current_lowest_price, { encoding: "UTF-8" });
  }

  if (lowest_price_flag) {
    console.log("A new lowest price found!");
    send_email_flag = true;
    fs.writeFileSync("price.txt", current_lowest_price, { encoding: "UTF-8" });
  } else {
    console.log("Current lowest price is CNY: " + current_lowest_price + ", Higher than previous price")
    fs.writeFileSync("high.txt", current_lowest_price, { encoding: "UTF-8" });
  }

  if (send_email_flag) {
    sendEmail(flight_info, ca405_lower_price_flag, lowest_price_flag, previous_lowest_price, previous_ca405_price, current_ca405_price, current_lowest_price, current_ca405_price, current_lowest_flight, ca405_flight);
  }

  fs.writeFileSync("flight_info.txt", JSON.stringify(flight_info, null, 4))
  console.log(flight_info);

  await browser.close();
}

function sleep(ms) {
  console.log("sleep " + ms + "ms")
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  while (true) {
    let interval = Math.floor((Math.random() * 20)) + 10;
    await sleep(interval * 1000 * 60);
    japan_url = 'https://flights.ctrip.com/international/search/round-sha-ngo?depdate=2019-10-24_2019-10-27&cabin=y_s&adult=1&child=0&infant=0'
    await crawl(japan_url, "CA405");

  }
}

run()