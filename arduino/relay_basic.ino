
#include <Arduino.h>
#define RELAY_PIN 26

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);

  digitalWrite(RELAY_PIN, HIGH); 
  Serial.println("Relay test start");
}

void loop() {
  Serial.println("Relay ON");
  digitalWrite(RELAY_PIN, LOW);
  delay(3000);

  Serial.println("Relay OFF");
  digitalWrite(RELAY_PIN, HIGH);
  delay(3000);
}