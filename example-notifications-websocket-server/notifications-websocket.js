const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    sendNotification(ws);
});

const ticker = ["AAPL", "TSLA", "IBM", "GME", "AMC", "MSFT", "TTWO"]
const action = ["Buy", "Sell"]
function sendNotification(ws) {
    setInterval(() => {
        const tickerIndex = Math.floor(Math.random() * ticker.length)
        const actionIndex = Math.floor(Math.random() * action.length)
        const price = (Math.random() * 100).toFixed(2);
        const notification = { source: "externalNotificationService", title: `${action[actionIndex]} ${ticker[tickerIndex]}`, details: `price: ${price}` }
        ws.send(JSON.stringify(notification));
    }, 15000)
}

// {
//     // id: "adf-3484-38729zg", // distinguishes individual notifications - provided by Finsemble if not supplied
//     // issuedAt: "2021-12-25T00:00:00.001Z", // The notifications was sent - provided by Finsemble if not supplied
//     // type: "configDefinedType", // Types defined in the config will have those values set as default
//     source, // Where the Notification was sent from
//     title,
//     details,
//     // headerLogo: "URL to Icon",
//     // actions: [], // Note this has no Actions making it Informational
//     // meta: {} // Use the meta object to send any extra data needed in the notification payload
// }
