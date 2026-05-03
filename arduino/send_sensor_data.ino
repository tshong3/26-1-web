#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "SSID";
const char* WIFI_PASSWORD = "PASSWORD";

const char* SERVER_URL = "API addr";
const char* DEVICE_ID = "device id";

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 10000;

void connectWiFi() {
  Serial.println();
  Serial.println("WiFi connecting...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retryCount = 0;

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    retryCount++;

    if (retryCount > 40) {
      Serial.println();
      Serial.println("WiFi connection failed. Restarting...");
      ESP.restart();
    }
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void sendTestData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
    connectWiFi();
    return;
  }

  HTTPClient http;

  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{";
  jsonData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonData += "\"temperature\":25.3,";
  jsonData += "\"humidity\":61.2,";
  jsonData += "\"soil_moisture\":530,";
  jsonData += "\"light\":720";
  jsonData += "}";

  Serial.println();
  Serial.println("Send data:");
  Serial.println(jsonData);

  int responseCode = http.POST(jsonData);

  Serial.print("Response code: ");
  Serial.println(responseCode);

  String response = http.getString();
  Serial.println("Response body:");
  Serial.println(response);

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println();
  Serial.println("ESP32 API Test Start");

  connectWiFi();
}

void loop() {
  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    sendTestData();
  }
}