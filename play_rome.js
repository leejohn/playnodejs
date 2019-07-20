const puppeteer = require('puppeteer-core');
const puppeteer_error = require('puppeteer-core/Errors');
const scrollPageToBottom = require("puppeteer-autoscroll-down")
const fs = require("fs");
console.logCopy = console.log.bind(console);

console.log = function (data) {
  var currentDate = '[' + new Date().toUTCString() + '] ';
  this.logCopy(currentDate, data);
};

// var path_to_chrome = process.argv[2]
var path_to_chrome = "C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe";
console.log("Use Chrome: " + path_to_chrome)

function sendEmail(flight_info, subject, detail) {
  var email = require("emailjs");
  var server = email.server.connect({
    user: "leejohn",
    password: "tljruprgovvlcagb",
    host: "smtp.qq.com",
    ssl: true
  });

  // send the message and get a callback with an error or details of the message that was sent
  server.send({
    text: detail,
    from: "lijian <leefirst@vip.qq.com>",
    to: "leejohn <leejohn@qq.com>, limy <limengying_1990@126.com>",
    subject: subject
  }, function (err, message) { console.log(err || message); });
}

async function crawl(url, specified_flights) {
  var previous_lowest_price;
  var previous_ca405_price;
  var current_ca405_price;
  var current_lowest_price;
  var current_lowest_flight;
  var ca405_flight;
  var json_data;
  function init_variables() {

    text = fs.readFileSync("scrapy.txt", { flag: "r", encoding: "UTF-8" })
    if (text == "") {
      json_data = {
        lowest: {
          price: 9999999
        }
      };
    } else {
      json_data = JSON.parse(text)
    }

    // json_date= {
    //   MU787 : {
    //     price : 100,
    //     airline : "MU787-MU797",
    //     depart: "2019-01-21",
    //     arrive: "2019-01-29",
    //     lower: true,
    //     notice: false
    //   },
    //   CA935 : {

    //   },
    //   lowest : {

    //   }

    // }
  }

  init_variables();

  const browser = await puppeteer.launch({ executablePath: path_to_chrome, headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);
  await page.setUserAgent("Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36")
  await page.setExtraHTTPHeaders({
    authority: "www.ctrip.com"
  });

  strip_return = (str) => {
    return str.replace(/[/r/n]/g, "");
  };

  await page.setViewport({ width: 1366, height: 768 })
  await page.goto(url, { waitUntil: ["networkidle2", "networkidle0"] });
  await page.waitFor(10000);
  await scrollPageToBottom(page)

  const flight_list_handler = await page.waitForSelector(".flight-list", { visible: true, timeout: 0 });
  flight_list = await flight_list_handler.$$(".flight-item");
  var flight_info = Array();
  for (flight of flight_list) {
    flight_detail_toggle = await flight.$(".flight-detail-toggle")
    await flight_detail_toggle.click()
    //#outerContainer > div > div.body > div.flight-detail > div > div.airline-box > div.airline
    // depart_airline_name = await page.$eval("#outerContainer > div > div.body > div.flight-detail > div:nth-child(1) > div.airline-box", element => element.innerText);
    // return_airline_name = await page.$eval("#outerContainer > div > div.body > div.flight-detail > div:nth-child(2) > div.airline-box", element => element.innerText);
    let i = {
      depart_airline_name: await page.$eval("#outerContainer > div > div.body > div.flight-detail", node => node.innerText),
      depart: await flight.$eval(".depart-box", node => node.innerText),
      arrive: await flight.$eval(".arrive-box", node => node.innerText),
      consume: await flight.$eval(".flight-consume", node => node.innerText),
      price: await flight.$eval(".flight-price", node => node.innerText)
    }
    const close_element = await page.waitForSelector("#outerContainer > div > div.title > i")
    await close_element.click();
    flight_info.push(i);
  }

  // const flight_info = await page.$eval(".flight-list", (flight_list) => {

  //   strip_return = (str) => {
  //     return str.replace(/[/r/n]/g, "");
  //   };

  //   let info = [];
  //   let items = flight_list.querySelectorAll(".flight-item");
  //   console.log("items length: " + items.length)
  //   for (item of items) {
  //     try {
  //       flight_detail_toggle_link = item.querySelector(".flight-detail-toggle > a");
  //       flight_detail_toggle_link.click();

  //       //#outerContainer > div > div.body > div.flight-detail > div:nth-child(1) > div.airline-box
  //       //#outerContainer > div > div.body > div.flight-detail > div:nth-child(2) > div.airline-box
  //       depart_airline_name = document.querySelector("#outerContainer > div > div.body > div.flight-detail > div:nth-child(1) > div.airline-box").innerText;
  //       return_airline_name = document.querySelector("#outerContainer > div > div.body > div.flight-detail > div:nth-child(2) > div.airline-box").innerText;
  //       console.log(depart_airline_name + " " + return_airline_name)
  //       let i = {
  //         airline: depart_airline_name,
  //         depart: strip_return(item.querySelector(".depart-box").innerText),
  //         arrive: strip_return(item.querySelector(".arrive-box").innerText),
  //         consume: strip_return(item.querySelector(".flight-consume").innerText),
  //         price: strip_return(item.querySelector(".flight-price").innerText)
  //       };

  //       close_element = document.querySelector("#outerContainer > div > div.title > i");
  //       close_element.click();

  //       info.push(i);
  //     } catch (error) {
  //       continue;
  //     }

  //   }
  //   return info;
  // });
  var specify = (json_data, flight_name, specified_flight, notice) => {
    json_data[flight_name] = {
      airline: specified_flight.depart_airline_name,
      depart: specified_flight.depart,
      arrive: specified_flight.arrive,
      consume: specified_flight.consume,
      price: Number(specified_flight.price.match(/\d+/)[0]),
      notice: notice
    };
  };

  for (specified_flight of specified_flights) {
    for (flight of flight_info) {
      try {
        flight_price = Number(flight.price.match(/\d+/)[0]);
        //check if lower than lowest

        if (flight.depart_airline_name.indexOf(specified_flight) != -1) {
          //check if current price is lower
          //first check if this flight info exist
          if (!(specified_flight in json_data)) {
            specify(json_data, specified_flight, flight, true)
          } else {
            //check price is lower
            if (flight_price < json_data[specified_flight].price) {
              specify(json_data, specified_flight, flight, true)
            }
          }
        }

      } catch (error) {
        console.log(error)
      }
    }
  }

  flight_info.forEach(flight => {
    price = Number(flight.price.match(/\d+/)[0]);
    current_lowest_price = Number(json_data["lowest"].price);
    if (price < current_lowest_price) {
      specify(json_data, "lowest", flight, true);
    }
  });


  // iterate all json_date, if found notice = true, than log and email this information
  var send_email_flag = false;
  var subject = "";
  var detail = "";
  for (var key in json_data) {
    if (json_data.hasOwnProperty(key)) {
      if (json_data[key].notice) {
        let airline_name = json_data[key].airline.split('\n')[0];
        subject += "A new " + key + " price found(" + airline_name + ")" + json_data[key].price + "---";
        send_email_flag = true;
      }
    }
  }
  detail += JSON.stringify(json_data, null, 4)


  if (send_email_flag) {
    sendEmail(flight_info, subject, detail);
    console.log("Maile send!")
  }

  for (var key in json_data) {
    if (json_data.hasOwnProperty(key)) {
      json_data[key].notice = false;
    }
  }

  fs.writeFileSync("scrapy.txt", JSON.stringify(json_data, null, 4))
  fs.writeFileSync("flight-detail.json", JSON.stringify(flight_info, null, 4))
  // console.log(flight_info);

  await browser.close();
}

function sleep(ms) {
  console.log("sleep " + ms + "ms")
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  while (true) {
    let interval = Math.floor((Math.random() * 20)) + 10;
    //await sleep(interval * 1000 * 60);
    japan_url = 'https://flights.ctrip.com/international/search/round-sha-rom?depdate=2020-01-21_2020-01-29&cabin=y_s&adult=1&child=0&infant=0'
    await crawl(japan_url, ["CA935", "MU787"]);

  }
}

run()