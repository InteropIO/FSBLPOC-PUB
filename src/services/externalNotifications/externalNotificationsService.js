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

    getNotifications = async () => {
        setInternal(() => {
            Finsemble.Clients.NotificationClient.notify({
                // id: "adf-3484-38729zg", // distinguishes individual notifications - provided by Finsemble if not supplied
                // issuedAt: "2021-12-25T00:00:00.001Z", // The notifications was sent - provided by Finsemble if not supplied
                // type: "configDefinedType", // Types defined in the config will have those values set as default
                source: "Finsemble", // Where the Notification was sent from
                title: "Request for Quote",
                details: "RIO - 9409 @ $9409",
                // headerLogo: "URL to Icon",
                // actions: [], // Note this has no Actions making it Informational
                // meta: {} // Use the meta object to send any extra data needed in the notification payload
            })
        }, 10000);
    }

}

const serviceInstance = new externalNotificationsService();

serviceInstance.start();
