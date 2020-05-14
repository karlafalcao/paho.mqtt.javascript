//*************************************************************************
// Client wrapper - define a client wrapper to ease manipulation
//*************************************************************************

window.MqttClient = function(
     {
        clientId,
        testServer = 'mqtt.eclipse.org',
        testPort = 80,
        testPath = '/mqtt',
        testMqttVersion = 3,
        testUseSSL = false,
        onConnectCallback = function() {}
     }) {
    let client = new Paho.Client(testServer, testPort, testPath, clientId);
    //states
    let connected = false;
    let subscribed = false;
    let messageReceived = false;
    let messageDelivered = false;
    let receivedMessage = null;

    //callbacks
    // called when the client connects
    const onConnect = function() {
        console.log("%s connected", clientId);
        connected = true;
        onConnectCallback()
    };

    // called when the client loses its connection
    const onDisconnect = function(response) {
        if (response.errorCode !== 0) {
            console.log("onConnectionLost:"+response.errorMessage);
        }
        console.log("%s disconnected: %s", clientId, response);
        connected = false;
    };

    // called when a message arrives
    const onMessageArrived = function(msg) {
        console.log("%s received msg[onMessageArrived]: %s", clientId, msg.payloadString);
        messageReceived = true;
        receivedMessage = msg;
    };

    // called when a message is delivered
    const onMessageDelivered = function(msg) {
        console.log("%s delivered message: %s", clientId, msg.payloadString);
        messageDelivered = true;
    };

    const onSubscribe = function() {
        console.log("%s subscribed", clientId);
        subscribed = true;
    };

    const onUnsubscribe = function() {
        console.log("%s unsubscribed", clientId);
        subscribed = false;
    };

    // set other callbacks
    client.onMessageArrived = onMessageArrived;
    client.onConnectionLost = onDisconnect;
    client.onMessageDelivered = onMessageDelivered;

    //Methods
    //connect to websockets
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

    //subscribe
    this.subscribe = function(topic, qos = 0) {
        client.subscribe(topic, {
            // qos: qos,
            onSuccess: onSubscribe
        });
    };

    //unsubscribe
    this.unsubscribe = function(topic) {
        client.unsubscribe(topic, {
            onSuccess: onUnsubscribe
        });
    };

    //publish
    this.publish = function(topic, qos, payload) {
        let message = new Paho.Message(payload);
        message.destinationName = topic;
        message.qos = qos;
        client.send(message);
    };

};