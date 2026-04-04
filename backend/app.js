const express = require("express");
const app = express();

app.get("/api", (req, res) => {
  res.json({ message: "backend working" });
});

app.listen(3001, () => {
  console.log("Server running on 3001");
});
