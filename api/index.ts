// server/index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const https = require("https");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
//app.use(cors());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "1800");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token,Origin, X-Requested-With, Content, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

const agent = new https.Agent({
  rejectUnauthorized: false,
});
app.get("/", (req, res) => res.send("Express on Vercel"));

app.get("/locationDetails", async (req, res) => {
  const { latitude, longitude } = req.query;

  try {
    const response = await axios.get(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}&type=street`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des données" });
  }
});

app.get("/brocantes", async (req, res) => {
  try {
    const { departement, ville } = req.query;

    const url = `https://brocabrac.fr/${departement}/${ville}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const events = [];

    $(".ev-section .ev").each((index, element) => {
      const scriptTag = $(element)
        .find('script[type="application/ld+json"]')
        .html();
      if (scriptTag) {
        const eventData = JSON.parse(scriptTag);
        const size = $(element).find(".dots").attr("title");
        eventData.size = size;
        events.push(eventData);
      }
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors du scraping" });
  }
});

app.get("/stations", async (req, res) => {
  const { latitude, longitude } = req.query;

  try {
    const response = await axios.get(
      `https://api.prix-carburants.2aaz.fr/station/around/${latitude},${longitude}?responseFields=Hours,Fuels,Price`,
      { httpsAgent: agent }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des données" });
  }
});

app.get("/test", async (req, res) => {
  res.status(500).json({ test: "Ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
