//*************************************************************************
// Client wrapper - define a client wrapper to ease testing
//*************************************************************************


window.MqttClient = function(
     {
        clientId,
        testServer = 'mqtt.eclipse.org',
        testPort = 80,
        testPath = '/mqtt',
        testMqttVersion = 3,
        testUseSSL = false
     }) {
    let client = new Paho.Client(testServer, testPort, testPath, clientId);
    //states
    let connected = false;
    let subscribed = false;
    let messageReceived = false;
    let messageDelivered = false;
    let receivedMessage = null;

    this.states = {
        connected: connected
    };

    //reset all states
    this.resetStates = function() {
        connected = false;
        subscribed = false;
        messageReceived = false;
        messageDelivered = false;
        receivedMessage = null;
    };

    //callbacks
    const onConnect = function() {
        console.log("%s connected", clientId);
        connected = true;
        // called when the client connects
        !function () {
            // Once a connection has been made, make a subscription and send a message.
            console.log("onConnect");
            client.subscribe("World");
            message = new Paho.Message("Test");
            message.destinationName = "World";
            client.send(message);
        }()

        console.assert(connected === true ,'connected');
    };

    // called when the client loses its connection
    const onDisconnect = function(response) {
        if (response.errorCode !== 0) {
            console.log("onConnectionLost:"+response.errorMessage);
        }
        console.log("%s disconnected: %s", clientId, response);
        connected = false;
    };

    const onSubscribe = function() {
        console.log("%s subscribed", clientId);
        subscribed = true;
    };

    const onUnsubscribe = function() {
        console.log("%s unsubscribed", clientId);
        subscribed = false;
    };

    // called when a message arrives
    const onMessageArrived = function(msg) {
        console.log("%s received msg[onMessageArrived]: %s", clientId, msg.payloadString);
        messageReceived = true;
        receivedMessage = msg;
    };

    const onMessageDelivered = function(msg) {
        console.log("%s delivered message: %s", clientId, msg.payloadString);
        messageDelivered = true;
    }

    //set callbacks
    client.onMessageArrived = onMessageArrived;
    client.onConnectionLost = onDisconnect;
    client.onMessageDelivered = onMessageDelivered;

    //functions
    //connect and verify
    this.connect = function(connectOptions) {
        connectOptions = connectOptions || {};
        if (!connectOptions.hasOwnProperty("onSuccess")) {
            connectOptions.onSuccess = onConnect;
            connectOptions.mqttVersion = testMqttVersion;
            connectOptions.useSSL = testUseSSL;
        }
        client.connect(connectOptions);
    };

    //disconnect and verify
    this.disconnect = function() {
        runs(function() {
            client.disconnect();
        });

        waitsFor(function() {
            return !connected;
        }, "the client should disconnect", 10000);

        runs(function() {
            expect(connected).not.toBe(true);
        });
    };

    //subscribe and verify
    this.subscribe = function(topic, qos) {
        client.subscribe(topic, {
            qos: qos,
            onSuccess: onSubscribe
        });
    };

    //unsubscribe and verify
    this.unsubscribe = function(topic) {
        runs(function() {
            client.unsubscribe(topic, {
                onSuccess: onUnsubscribe
            });
        });

        waitsFor(function() {
            return !subscribed;
        }, "the client should subscribe", 2000);

        runs(function() {
            expect(subscribed).not.toBe(true);
        });
    };

    //publish and verify
    this.publish = function(topic, qos, payload) {
        runs(function() {
            let message = new Paho.Message(payload);
            message.destinationName = topic;
            message.qos = qos;
            client.send(message);
        })

        waitsFor(function() {
            return messageDelivered;
        }, "the client should delivered a message", 10000);

        runs(function() {
            //reset state
            messageDelivered = false;
        });
    };

    //verify the receive message
    this.receive = function(expectedTopic, publishedQoS, subscribedQoS, expectedPayload) {

        waitsFor(function() {
            return messageReceived;
        }, "the client should send and receive a message", 10000);

        runs(function() {
            expect(messageReceived).toBe(true);
            expect(receivedMessage).not.toBeNull();
            expect(receivedMessage.qos).toBe(Math.min(publishedQoS, subscribedQoS));
            expect(receivedMessage.destinationName).toBe(expectedTopic);
            if (typeof expectedPayload === "string") {
                expect(receivedMessage.payloadString).toEqual(expectedPayload);
            } else {
                expect(receivedMessage.payloadBytes).toEqual(expectedPayload);
            }

            //reset state after each publish
            messageReceived = false;
            receivedMessage = null;
        })
    };
};