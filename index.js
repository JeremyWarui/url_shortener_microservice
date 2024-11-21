require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { URL } = require("url")
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(
  process.env.MONGODB_URI
);

const db = mongoose.connection;

db.on("connected", () => console.log("Connected to db"));
db.on("error", (error) => console.log("Error occured: ", error));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;
  console.log(originalUrl);

  const checkurl = /^(https?:\/\/[^s$.?#].[^\s]*)$/;

  if (!checkurl.test(originalUrl)) {
    return res.json({ error: "invalid url"})
  }

  try {
    new URL(originalUrl)
  } catch (error) {
    return res.json({ error: "invalid url"})
  }

  const url = await Url.findOne({ original_url: originalUrl });
  if (url) {
    return res.json({
      originalUrl: url.original_url,
      shortUrl: url.short_url,
    });
  }

  let generatedUrl = Math.floor(Math.random() * 1000);

  const newUrl = new Url({
    original_url: originalUrl,
    short_url: generatedUrl,
  });

  const savedUrl = await newUrl.save();

  res.json({
    original_url: originalUrl,
    short_url: savedUrl.short_url,
  });
});

app.get("/api/shortUrl/:shortUrl", async (req, res) => {
  const requestedUrl = req.params.shortUrl;
  console.log(requestedUrl);

  if (isNaN(Number(requestedUrl))) {
    return res.json({ error: "invalid url"})
  }

  const foundUrl = await Url.findOne( {short_url: Number(requestedUrl)})
  console.log(foundUrl);

  if (!foundUrl) {
    return res.json({ error: "URL not found" })
  }
  
  res.redirect(foundUrl.original_url)
  
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
