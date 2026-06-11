#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "HX711.h"

// ===================== Wi-Fi 설정 =====================
const char* WIFI_SSID = "WIFI_SSID";
const char* WIFI_PASS = "WIFI_PASSWD";

// ===================== 서버 설정 =====================
const char* API_BASE_URL = "http://farm.nulldns.top";

const char* DEVICE_ID = "esp32-001";
const int POT_ID = 1;

// 센서 데이터 전송 API
String SENSOR_POST_URL = String(API_BASE_URL) + "/api/sensor-data";

// 급수 명령 확인 API
String WATERING_COMMAND_URL =
  String(API_BASE_URL) + "/api/watering/device/command?device_id=" + DEVICE_ID;

// 급수 결과 전송 API
String WATERING_RESULT_URL =
  String(API_BASE_URL) + "/api/watering/device/command/result";

// ===================== 핀 설정 =====================
#define DHT_PIN 4
#define DHT_TYPE DHT22

#define SOIL_PIN 34
#define LIGHT_PIN 35

#define RELAY_PIN 26

#define HX711_DT 18
#define HX711_SCK 19

#define FLOW_PIN 27

// ===================== 객체 생성 =====================
DHT dht(DHT_PIN, DHT_TYPE);
HX711 scale;

// ===================== 토양습도 보정값 =====================
// 실제 측정값에 따라 수정
const int SOIL_DRY_VALUE = 3400;
const int SOIL_WET_VALUE = 1400;

// ===================== 조도 보정값 =====================
const int LIGHT_DARK_VALUE = 4095;
const int LIGHT_BRIGHT_VALUE = 0;

// ===================== 무게센서 보정값 =====================
// 반드시 실제 보정 후 수정해야 함
float HX711_CALIBRATION_FACTOR = -7050.0;

// true: 부팅할 때 빈 물통을 올려둔 상태에서 영점 조정
// false: tare를 하지 않고 기존 offset 기준으로 측정
const bool TARE_EMPTY_TANK_ON_BOOT = true;

// 빈 물통을 올린 상태에서 tare를 했다면 0으로 둬도 됨
// 만약 tare를 안 하고 전체 무게에서 빈 물통 무게를 빼는 방식이면 빈 물통 무게를 입력
const float EMPTY_TANK_WEIGHT_G = 0.0;

// 물통 최대 용량
// 예: 물통이 500mL 정도라면 500.0
const float MAX_WATER_CAPACITY_ML = 500.0;

// 무게 안정화를 위한 최소값
const float MIN_VALID_WATER_G = 0.0;

// ===================== 릴레이 설정 =====================
// 대부분 릴레이 모듈은 LOW일 때 작동
const bool RELAY_ACTIVE_LOW = true;

// ===================== 주기 설정 =====================
const unsigned long SENSOR_UPLOAD_INTERVAL = 10000;
const unsigned long COMMAND_CHECK_INTERVAL = 3000;

unsigned long lastSensorUploadTime = 0;
unsigned long lastCommandCheckTime = 0;

// ===================== 유량센서 =====================
volatile unsigned long flowPulseCount = 0;

// 유량센서 계수는 모델마다 다름
const float FLOW_CALIBRATION_FACTOR = 7.5;

// ===================== 함수 선언 =====================
void connectWiFi();

void uploadSensorData();
void checkWateringCommand();
void runPump(unsigned long durationMs, float& beforeMl, float& afterMl, float& usedMl);
void sendWateringResult(
  int commandId,
  bool success,
  const String& message,
  float beforeMl,
  float afterMl,
  float usedMl
);

float readTemperature();
float readHumidity();

int readSoilRaw();
int readSoilPercent();

int readLightRaw();
int readLightPercent();

float readTotalWeightGram();
float readWaterWeightGram();
float readWaterAmountMl();
int readWaterLevelPercent();

void IRAM_ATTR flowPulseCounter();

void relayOn();
void relayOff();


// ===================== setup =====================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=================================");
  Serial.println(" Smart Planter ESP32 Start");
  Serial.println("=================================");

  pinMode(RELAY_PIN, OUTPUT);
  relayOff();

  pinMode(FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseCounter, RISING);

  dht.begin();

  scale.begin(HX711_DT, HX711_SCK);

  if (scale.is_ready()) {
    Serial.println("[HX711] Ready");
    scale.set_scale(HX711_CALIBRATION_FACTOR);

    if (TARE_EMPTY_TANK_ON_BOOT) {
      Serial.println("[HX711] Tare start");
      Serial.println("[HX711] Make sure EMPTY water tank is on the load cell.");
      delay(1000);
      scale.tare();
      Serial.println("[HX711] Tare complete");
    }
  } else {
    Serial.println("[HX711] Not ready. Check DT/SCK/VCC/GND wiring.");
  }

  connectWiFi();
}


// ===================== loop =====================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long now = millis();

  if (now - lastSensorUploadTime >= SENSOR_UPLOAD_INTERVAL) {
    lastSensorUploadTime = now;
    uploadSensorData();
  }

  if (now - lastCommandCheckTime >= COMMAND_CHECK_INTERVAL) {
    lastCommandCheckTime = now;
    checkWateringCommand();
  }
}


// ===================== Wi-Fi 연결 =====================
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int retryCount = 0;

  while (WiFi.status() != WL_CONNECTED && retryCount < 30) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connected");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] Connection failed");
  }
}


// ===================== 센서 데이터 전송 =====================
void uploadSensorData() {
  float temperature = readTemperature();
  float humidity = readHumidity();

  int soilRaw = readSoilRaw();
  int soilPercent = readSoilPercent();

  int lightRaw = readLightRaw();
  int lightPercent = readLightPercent();

  float totalWeightG = readTotalWeightGram();
  float waterWeightG = readWaterWeightGram();
  float waterAmountMl = readWaterAmountMl();
  int waterLevelPercent = readWaterLevelPercent();

  Serial.println();
  Serial.println("========== Sensor Data ==========");
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Soil Raw: ");
  Serial.println(soilRaw);

  Serial.print("Soil Moisture: ");
  Serial.print(soilPercent);
  Serial.println(" %");

  Serial.print("Light Raw: ");
  Serial.println(lightRaw);

  Serial.print("Light: ");
  Serial.print(lightPercent);
  Serial.println(" %");

  Serial.print("Total Weight: ");
  Serial.print(totalWeightG);
  Serial.println(" g");

  Serial.print("Water Weight: ");
  Serial.print(waterWeightG);
  Serial.println(" g");

  Serial.print("Water Amount: ");
  Serial.print(waterAmountMl);
  Serial.println(" mL");

  Serial.print("Water Level: ");
  Serial.print(waterLevelPercent);
  Serial.println(" %");

  Serial.println("=================================");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected. Skip upload.");
    return;
  }

  HTTPClient http;
  http.begin(SENSOR_POST_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<768> doc;

  doc["device_id"] = DEVICE_ID;
  doc["pot_id"] = POT_ID;

  doc["temperature"] = temperature;
  doc["humidity"] = humidity;

  doc["soil_moisture"] = soilPercent;
  doc["soil_raw"] = soilRaw;

  doc["light"] = lightPercent;
  doc["light_raw"] = lightRaw;

  // 무게센서 계산값
  doc["total_weight_g"] = totalWeightG;
  doc["water_weight_g"] = waterWeightG;
  doc["water_amount_ml"] = waterAmountMl;
  doc["water_level_percent"] = waterLevelPercent;

  String jsonBody;
  serializeJson(doc, jsonBody);

  Serial.println("[HTTP] POST Sensor Data");
  Serial.println(jsonBody);

  int httpCode = http.POST(jsonBody);

  Serial.print("[HTTP] Response code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("[HTTP] Response:");
    Serial.println(response);
  } else {
    Serial.print("[HTTP] POST failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}


// ===================== 급수 명령 확인 =====================
void checkWateringCommand() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Command] WiFi not connected. Skip command check.");
    return;
  }

  HTTPClient http;
  http.begin(WATERING_COMMAND_URL);

  int httpCode = http.GET();

  if (httpCode <= 0) {
    Serial.print("[Command] GET failed: ");
    Serial.println(http.errorToString(httpCode));
    http.end();
    return;
  }

  String response = http.getString();

  Serial.println();
  Serial.print("[Command] HTTP code: ");
  Serial.println(httpCode);
  Serial.print("[Command] Response: ");
  Serial.println(response);

  http.end();

  if (httpCode != 200) {
    return;
  }

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.print("[Command] JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  bool hasCommand = doc["has_command"] | false;

  if (!hasCommand) {
    Serial.println("[Command] No watering command");
    return;
  }

  int commandId = doc["command_id"] | 0;
  int durationSec = doc["duration_sec"] | 3;

  if (durationSec <= 0) {
    durationSec = 3;
  }

  if (durationSec > 30) {
    durationSec = 30;
  }

  Serial.println("[Command] Watering command received");
  Serial.print("Command ID: ");
  Serial.println(commandId);
  Serial.print("Duration: ");
  Serial.print(durationSec);
  Serial.println(" sec");

  float beforeMl = 0.0;
  float afterMl = 0.0;
  float usedMl = 0.0;

  runPump((unsigned long)durationSec * 1000, beforeMl, afterMl, usedMl);

  sendWateringResult(
    commandId,
    true,
    "Watering completed",
    beforeMl,
    afterMl,
    usedMl
  );
}


// ===================== 펌프 작동 =====================
void runPump(unsigned long durationMs, float& beforeMl, float& afterMl, float& usedMl) {
  Serial.println("[Pump] Preparing watering");

  beforeMl = readWaterAmountMl();

  Serial.print("[Pump] Water before: ");
  Serial.print(beforeMl);
  Serial.println(" mL");

  flowPulseCount = 0;

  unsigned long startTime = millis();

  Serial.println("[Pump] ON");
  relayOn();

  while (millis() - startTime < durationMs) {
    delay(100);
  }

  relayOff();
  Serial.println("[Pump] OFF");

  delay(500);

  afterMl = readWaterAmountMl();

  usedMl = beforeMl - afterMl;

  if (usedMl < 0) {
    usedMl = 0;
  }

  unsigned long pulseCount = flowPulseCount;

  Serial.print("[Pump] Water after: ");
  Serial.print(afterMl);
  Serial.println(" mL");

  Serial.print("[Pump] Water used by weight: ");
  Serial.print(usedMl);
  Serial.println(" mL");

  Serial.print("[Flow] Pulse count: ");
  Serial.println(pulseCount);
}


// ===================== 급수 결과 전송 =====================
void sendWateringResult(
  int commandId,
  bool success,
  const String& message,
  float beforeMl,
  float afterMl,
  float usedMl
) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Result] WiFi not connected. Skip result upload.");
    return;
  }

  HTTPClient http;
  http.begin(WATERING_RESULT_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;

  doc["device_id"] = DEVICE_ID;
  doc["command_id"] = commandId;
  doc["success"] = success;
  doc["message"] = message;

  doc["water_before_ml"] = beforeMl;
  doc["water_after_ml"] = afterMl;
  doc["water_used_ml"] = usedMl;

  String jsonBody;
  serializeJson(doc, jsonBody);

  Serial.println("[Result] POST Watering Result");
  Serial.println(jsonBody);

  int httpCode = http.POST(jsonBody);

  Serial.print("[Result] HTTP code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("[Result] Response:");
    Serial.println(response);
  } else {
    Serial.print("[Result] POST failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}


// ===================== DHT22 읽기 =====================
float readTemperature() {
  float t = dht.readTemperature();

  if (isnan(t)) {
    Serial.println("[DHT22] Temperature read failed");
    return -999.0;
  }

  return t;
}

float readHumidity() {
  float h = dht.readHumidity();

  if (isnan(h)) {
    Serial.println("[DHT22] Humidity read failed");
    return -999.0;
  }

  return h;
}


// ===================== 토양습도 읽기 =====================
int readSoilRaw() {
  return analogRead(SOIL_PIN);
}

int readSoilPercent() {
  int raw = readSoilRaw();

  int percent = map(raw, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0, 100);
  percent = constrain(percent, 0, 100);

  return percent;
}


// ===================== 조도 읽기 =====================
int readLightRaw() {
  return analogRead(LIGHT_PIN);
}

int readLightPercent() {
  int raw = readLightRaw();

  int percent = map(raw, LIGHT_DARK_VALUE, LIGHT_BRIGHT_VALUE, 0, 100);
  percent = constrain(percent, 0, 100);

  return percent;
}


// ===================== 무게센서 계산 =====================
float readTotalWeightGram() {
  if (!scale.is_ready()) {
    Serial.println("[HX711] Not ready");
    return -999.0;
  }

  float totalWeight = scale.get_units(10);

  // 로드셀 방향에 따라 음수로 나오는 경우 보정
  if (totalWeight < 0) {
    totalWeight = -totalWeight;
  }

  return totalWeight;
}

float readWaterWeightGram() {
  float totalWeight = readTotalWeightGram();

  if (totalWeight < 0) {
    return -999.0;
  }

  float waterWeight = totalWeight - EMPTY_TANK_WEIGHT_G;

  if (waterWeight < MIN_VALID_WATER_G) {
    waterWeight = 0.0;
  }

  return waterWeight;
}

float readWaterAmountMl() {
  float waterWeight = readWaterWeightGram();

  if (waterWeight < 0) {
    return -999.0;
  }

  // 물은 대략 1g = 1mL로 계산
  float waterMl = waterWeight;

  if (waterMl > MAX_WATER_CAPACITY_ML) {
    waterMl = MAX_WATER_CAPACITY_ML;
  }

  return waterMl;
}

int readWaterLevelPercent() {
  float waterMl = readWaterAmountMl();

  if (waterMl < 0) {
    return 0;
  }

  int percent = (int)((waterMl / MAX_WATER_CAPACITY_ML) * 100.0);
  percent = constrain(percent, 0, 100);

  return percent;
}


// ===================== 유량센서 인터럽트 =====================
void IRAM_ATTR flowPulseCounter() {
  flowPulseCount++;
}


// ===================== 릴레이 제어 =====================
void relayOn() {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, LOW);
  } else {
    digitalWrite(RELAY_PIN, HIGH);
  }
}

void relayOff() {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, HIGH);
  } else {
    digitalWrite(RELAY_PIN, LOW);
  }
}