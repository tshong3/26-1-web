#include <Arduino.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("DHT22 테스트 시작");
  dht.begin();
}

void loop() {
  delay(2000);

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT22 failed");
    return;
  }

  Serial.print("습도: ");
  Serial.print(humidity);
  Serial.print(" %\t");

  Serial.print("온도: ");
  Serial.print(temperature);
  Serial.println(" °C");
}
