var settings = require('./client-harness');
var MqttClient = require('./mqtt-client');


var testMqttVersion = settings.mqttVersion;
var topicPrefix = settings.topicPrefix;
var testUseSSL = false

//define a default clientID
var clientId = "testClient1";

describe('SendReceive', function() {

  //*************************************************************************
  // Tests
  //*************************************************************************

  it('should connect to a server and disconnect from a server', function() {
    var client = new MqttClient(clientId);

    //connect and verify
    client.connect({
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });

    //disconnect and verify
    client.disconnect();
  });


  it('should pub/sub using largish messages', function() {
    var client = new MqttClient(clientId);

    //connect and verify
    client.connect({
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });

    //subscribe and verify
    var testTopic = topicPrefix + "pubsub/topic";
    var subscribedQoS = 0;
    client.subscribe(testTopic, subscribedQoS);

    //unsubscribe and verify
    client.unsubscribe(testTopic);

    //subscribe again
    client.subscribe(testTopic, subscribedQoS);

    //publish a large message to the topic and verify
    var publishQoS = 0;
    var payload = "";
    var largeSize = 10000;
    for (var i = 0; i < largeSize; i++) {
      payload += "s";
    }
    client.publish(testTopic, publishQoS, payload);

    //receive and verify
    client.receive(testTopic, publishQoS, subscribedQoS, payload);

    //disconnect and verify
    client.disconnect();
  });


  it('should preserve QOS values between publishers and subscribers', function() {
    var client = new MqttClient(clientId);

    //connect and verify
    client.connect({
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });

    //subscribe and verify
    var testTopics = ["pubsub/topic1", "pubsub/topic2", "pubsub/topic3"];
    var subscribedQoSs = [0, 1, 2];
    for (var i = 0; i < testTopics.length; i++) {
      client.subscribe(topicPrefix + testTopics[i], subscribedQoSs[i]);
    }

    //publish, receive and verify
    for (var i = 0; i < testTopics.length; i++) {
      var payload = "msg-" + i;
      for (var qos = 0; qos < 3; qos++) {
        client.publish(topicPrefix + testTopics[i], qos, payload);
        //receive and verify
        client.receive(topicPrefix + testTopics[i], qos, subscribedQoSs[i], payload);
      }
    }

    //disconnect and verify
    client.disconnect();
  });

  it('should work using multiple publishers and subscribers.', function() {
    //topic to publish
    var topic = topicPrefix + "multiplePubSub/topic";

    //create publishers and connect
    var publishers = [];
    var publishersNum = 2;
    for (var i = 0; i < publishersNum; i++) {
      publishers[i] = new MqttClient("publisher-" + i);
      publishers[i].connect({
        mqttVersion: testMqttVersion,
        useSSL: testUseSSL
      });
    }

    //create subscribers and connect
    var subscribedQoS = 0;
    var subscribers = [];
    var subscribersNum = 10;
    for (var i = 0; i < subscribersNum; i++) {
      subscribers[i] = new MqttClient("subscriber-" + i);
      subscribers[i].connect({
        mqttVersion: testMqttVersion,
        useSSL: testUseSSL
      });
      subscribers[i].subscribe(topic, subscribedQoS);
    }

    //do publish and receive with verify
    var publishQoS = 0;
    var pubishMsgNum = 10;
    for (var m = 0; m < pubishMsgNum; m++) {
      var payload = "multi-pub-sub-msg-" + m;
      for (var i = 0; i < publishersNum; i++) {
        publishers[i].publish(topic, publishQoS, payload);
        for (var j = 0; j < subscribersNum; j++) {
          subscribers[j].receive(topic, publishQoS, subscribedQoS, payload);
        }
      }
    }

    //disconnect publishers and subscribers
    for (var i = 0; i < publishersNum; i++) {
      publishers[i].disconnect();
    }
    for (var i = 0; i < subscribersNum; i++) {
      subscribers[i].disconnect();
    }

  });

  it('should clean up before re-connecting if cleanSession flag is set.', function() {
    //connect with cleanSession flag=false and verify
    var client = new MqttClient("client-1");
    client.connect({
      cleanSession: false,
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });

    //subscribe and verify
    var testTopic = topicPrefix + "cleanSession/topic1";
    var subscribedQoS = 0;
    client.subscribe(testTopic, subscribedQoS);

    //publish and verify
    var publishQoS = 1;
    var payload = "cleanSession-msg";
    client.publish(testTopic, publishQoS, payload);
    client.receive(testTopic, publishQoS, subscribedQoS, payload);
    //disconnect
    client.disconnect();

    // Send a message from another client, to our durable subscription.
    var anotherClient = new MqttClient("anotherClient-1");
    anotherClient.connect({
      cleanSession: true,
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });
    anotherClient.subscribe(testTopic, subscribedQoS);
    anotherClient.publish(testTopic, publishQoS, payload);
    anotherClient.receive(testTopic, publishQoS, subscribedQoS, payload);
    anotherClient.disconnect();

    //reconnect
    client.connect({
      cleanSession: true,
      mqttVersion: testMqttVersion,
      useSSL: testUseSSL
    });
    //check no msg is received
    client.receiveNone();

    //do another publish and check if msg is received, because subscription should be cancelled
    client.publish(testTopic, publishQoS, payload);
    //check no msg is received
    client.receiveNone();
    //disconnect
    client.disconnect();
  });


})
