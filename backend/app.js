const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensor");
const wateringRoutes = require("./routes/watering");
const notificationRoutes = require("./routes/notifications");
const plantRoutes = require("./routes/plants");
const startWateringScheduler = require("./jobs/wateringScheduler");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sensor-data", sensorRoutes);
app.use("/api/watering", wateringRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/plants", plantRoutes);

app.get("/api", (req, res) => {
  res.json({ message: "backend working" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  startWateringScheduler();
});
