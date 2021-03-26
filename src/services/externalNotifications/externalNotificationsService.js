const Finsemble = require("@finsemble/finsemble-core");

Finsemble.Clients.Logger.start();
Finsemble.Clients.Logger.log("externalNotifications Service starting up");

// Add and initialize any other clients you need to use (services are initialized by the system, clients are not):
// Finsemble.Clients.AuthenticationClient.initialize();
// Finsemble.Clients.ConfigClient.initialize();
// Finsemble.Clients.DialogManager.initialize();
// Finsemble.Clients.DistributedStoreClient.initialize();
// Finsemble.Clients.DragAndDropClient.initialize();
// Finsemble.Clients.LauncherClient.initialize();
// Finsemble.Clients.LinkerClient.initialize();
Finsemble.Clients.NotificationClient.initialize();
// Finsemble.Clients.HotkeyClient.initialize();
// Finsemble.Clients.SearchClient.initialize();
// Finsemble.Clients.StorageClient.initialize();
// Finsemble.Clients.WindowClient.initialize();
// Finsemble.Clients.WorkspaceClient.initialize();

/**
 * Add service description here
 */
class externalNotificationsService extends Finsemble.baseService {
    /**
     * Initializes a new instance of the externalNotificationsService class.
     */
    constructor() {
        super({
            // Declare any client dependencies that must be available before your service starts up.
            startupDependencies: {
                // When ever you use a client API with in the service, it should be listed as a client startup
                // dependency. Any clients listed as a dependency must be initialized at the top of this file for your
                // service to startup.
                clients: [
                    // "authenticationClient",
                    // "configClient",
                    // "dialogManager",
                    // "distributedStoreClient",
                    // "dragAndDropClient",
                    // "hotkeyClient",
                    // "launcherClient",
                    // "linkerClient",
                    // "searchClient
                    // "storageClient",
                    // "windowClient",
                    // "workspaceClient",
                    "notificationClient"
                ],
            },
        });

        this.readyHandler = this.readyHandler.bind(this);

        this.onBaseServiceReady(this.readyHandler);
    }

    /**
     * Fired when the service is ready for initialization
     * @param {function} callback
     */
    readyHandler(callback) {
        this.getNotifications();
        Finsemble.Clients.Logger.log("externalNotifications Service ready");
        callback();
    }

    getNotifications() {

        // Create WebSocket connection.
        const socket = new WebSocket('ws://localhost:8080');

        // Connection opened
        socket.addEventListener('open', () => Finsemble.Clients.Logger.log('Notification service available+++++++++'))
        // function onOpen(event) {

        //     Finsemble.Clients.Logger.log('Notification service available');

        //     // Listen for messages
        //     socket.addEventListener('message', sentNotification)

        //     const sentNotification = ({ data }) => {
        //         Finsemble.Clients.Logger.log('Message from server ', data);

        //         const { source, title, details } = event.data

        //         Finsemble.Clients.NotificationClient.notify({
        //             // id: "adf-3484-38729zg", // distinguishes individual notifications - provided by Finsemble if not supplied
        //             // issuedAt: "2021-12-25T00:00:00.001Z", // The notifications was sent - provided by Finsemble if not supplied
        //             // type: "configDefinedType", // Types defined in the config will have those values set as default
        //             source, // Where the Notification was sent from
        //             title,
        //             details,
        //             // headerLogo: "URL to Icon",
        //             // actions: [], // Note this has no Actions making it Informational
        //             // meta: {} // Use the meta object to send any extra data needed in the notification payload
        //         })
        //     }

        //     function subscribe() {

        //         // listen to internal Finsemble notifications and send them back to the websocket server
        //         const subscription = {
        //             filter: {
        //                 // The callback below will be executed if notifications with notification.type == 'chat-notification' AND
        //                 // notification.source == 'Symphony' are received
        //                 include: [
        //                     {
        //                         type: "chat-notification",
        //                         source: "Symphony",
        //                     },
        //                     // It's also possible to do deep matches
        //                     { "meta.myCustomObject.field": "email-notification" }, // For an OR match add two objects in the include filter
        //                 ],
        //                 // The exclude filter works the same as the include filter but the callback will NOT be executed if there
        //                 // is a match. Exclude matches take precedence over include matches.
        //                 exclude: [],
        //             },
        //         };

        //         // Listen to notifications and send to the server
        //         Finsemble.Clients.NotificationClient.subscribe(subscription, (notification) => {
        //             Finsemble.Clients.Logger.log("Filter Matches. Notification Received", notification);
        //             // send data to the server via websocket
        //             socket.send(notification);
        //         });
        //     }



        // }


    };

}

const serviceInstance = new externalNotificationsService();

serviceInstance.start();
