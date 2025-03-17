const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { nanoid } = require("nanoid"); // unique id generator
const app = express();
const PORT = 3000;
const cors = require("cors");

app.use(cors()); // CORS 설정

// Create a new database
let db = new sqlite3.Database(":memory:"); // 서버 켜져 있을 때만 유지
db.serialize(() => {
  db.run(
    "CREATE TABLE urls (id INTEGER PRIMARY KEY, shortCode TEXT, originalUrl TEXT)" // 테이블 생성
  );
});

app.use(express.json()); // body-parser

app.use(express.static("public")); // HTML, CSS, JS

// URL Shortening
app.post("/shorten", (req, res) => {
  let { url } = req.body;

  // Check if the URL is valid
  if (!/^https?:\/\//.test(url)) {
    url = `http://${url}`;
  }

  // Check if the URL already exists in the database
  db.get(
    "SELECT shortCode FROM urls WHERE originalUrl = ?",
    [url],
    (err, row) => {
      if (row) {
        res.json({ shortUrl: `http://localhost:${PORT}/${row.shortCode}` });
      } else {
        const shortCode = nanoid(6);
        db.run(
          "INSERT INTO urls (shortCode, originalUrl) VALUES (?, ?)",
          [shortCode, url],
          (err) => {
            if (err) {
              res.status(500).json({ error: "Failed to shorten the URL" });
            } else {
              res.json({ shortUrl: `http://localhost:${PORT}/${shortCode}` });
            }
          }
        );
      }
    }
  );
});

// Redirect to the original URL
app.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;

  db.get(
    "SELECT originalUrl FROM urls WHERE shortCode = ?",
    [shortCode],
    (err, row) => {
      if (row) {
        res.redirect(row.originalUrl);
      } else {
        res.status(404).json({ error: "URL not found" });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
