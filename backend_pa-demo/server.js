const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

const tokenFile = require("./token");

const axios = require("axios");

app.use(express.static("public"));
app.use(express.json());

// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "html");
// app.engine("html", require("ejs").renderFile);

function generateAlphaNum(len) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = len;
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }

  return randomString;
}

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization"
  );
  next();
});

app.get("/home", (req, res) => {
  res.send("<h1>Backend Active</h1>");
});

app.post("/create_payment_intent", async (req, res) => {
  const { currency, totalPrice } = req.body;
  let token = require("./tokenVal.json");

  if (!token.expires_at || new Date(token.expires_at) < new Date()) {
    token = await tokenFile.generateToken();
    console.log("Generated Token - ", token);
    tokenFile.setToken(token.token, token.expires_at);
    // tokenFile.setToken(token.token, token.expires_at);
  }

  const exp = new Date(token.expires_at);

  await axios
    .request({
      url: "https://api-demo.airwallex.com/api/v1/pa/payment_intents/create",
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`,
      },
      data: {
        amount: totalPrice,
        currency: currency,
        merchant_order_id: generateAlphaNum(8),
        request_id: generateAlphaNum(12),
      },
    })
    .then(({ data }) => {
      //   console.log(data);
      res.send({
        intent_id: data.id,
        client_secret: data.client_secret,
        currency: data.currency,
        amount: data.amount,
      });
    });

  console.log(currency, totalPrice);
});

app.post("/webhook", (req, res) => {
  //   console.log(req.body);
  res.sendStatus(200);

  const webhookFile = require("./webhooks.json");

  webhookFile.events.unshift(req.body);

  fs.writeFileSync("webhooks.json", JSON.stringify(webhookFile), (err) => {
    if (err) throw err;

    console.log("Webhook Added!!");
  });
});

// SSE

app.get("/updates", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Function to send updates to the client
  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Watch the file for changes
  const filePath = "webhooks.json";
  fs.watchFile(filePath, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      // File has changed, send update to the client
      const fileData = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(fileData);
      sendUpdate(jsonData);
    }
  });

  // Send initial data to the client
  const fileData = fs.readFileSync(filePath, "utf8");
  const jsonData = JSON.parse(fileData);
  sendUpdate(jsonData);

  // Close the connection when the client disconnects
  req.on("close", () => {
    fs.unwatchFile(filePath);
    res.end();
  });
});

app.get("/clear_webhooks", async (req, res) => {
  const webhookFile = require("./webhooks.json");

  console.log("clear webhooks");

  webhookFile.events = [];

  fs.writeFileSync("webhooks.json", JSON.stringify(webhookFile), (err) => {
    if (err) throw err;

    console.log("Webhook Added!!");
  });

  res.send("Webhook cleared");
});

app.listen(4242, () => {
  console.log(`Example app listening on Post 4242!!`);
});
