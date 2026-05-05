#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "SSID";
const char* password = "PASSWD";

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);

  Serial.print("WiFi 연결 중");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n연결 완료!");

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin("http://farm.nulldns.top"); 

    int httpCode = http.GET();

    if (httpCode > 0) {
      Serial.print("응답 코드: ");
      Serial.println(httpCode);

      String payload = http.getString();
      Serial.println("응답 데이터:");
      Serial.println(payload);
    } else {
      Serial.print("요청 실패: ");
      Serial.println(http.errorToString(httpCode));
    }

    http.end();
  }
}

void loop() {}