var settings = require('./client-harness');
var MqttClient = require('./mqtt-client');


var testMqttVersion = settings.mqttVersion;
var topicPrefix = settings.topicPrefix;
var testUseSSL = settings.useSSL


describe('LiveTakeOver', function() {

  //*************************************************************************
  // Tests
  //*************************************************************************

  it('should be taken over by another client for the actively doing work.', function() {
    var clientId = "TakeOverClient1";
    var testTopic = topicPrefix + "FirstClient/Topic";
    var subscribedQoS = 2;
    var publishQoS = 1;
    var payload = "TakeOverPayload";

    //will msg
    var willMessage = new Paho.Message("will-payload");
    willMessage.destinationName = topicPrefix + "willTopic";
    willMessage.qos = 2;
    willMessage.retained = true;

    var client1 = new MqttClient(clientId);
    client1.connect({
      cleanSession: false,
      willMessage: willMessage,
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });

    //subscribe
    client1.subscribe(testTopic, subscribedQoS);

    //publish some messwage
    for (var i = 0; i < 9; i++) {
      client1.publish(testTopic, publishQoS, payload);
      client1.receive(testTopic, publishQoS, subscribedQoS, payload);
    }

    // Now lets take over the connection
    // Create a second MQTT client connection with the same clientid. The
    // server should spot this and kick the first client connection off.
    var client2 = new MqttClient(clientId);
    client2.connect({
      cleanSession: false,
      willMessage: willMessage,
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });

    waitsFor(function() {
      return !client1.states.connected;
    }, "the previous client should be disconnected", 10000);

    // We should have taken over the first Client's subscription...
    //Now check we have grabbed his subscription by publishing.
    client2.publish(testTopic, publishQoS, payload);
    client2.receive(testTopic, publishQoS, subscribedQoS, payload);

    //disconnect
    client2.disconnect();
  });


})
