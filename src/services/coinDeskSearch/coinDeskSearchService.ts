const Finsemble = require("@finsemble/finsemble-core");
const FDC3Client = require("../FDC3/FDC3Client").default;

Finsemble.Clients.Logger.start();
Finsemble.Clients.Logger.log("coinDeskSearch Service starting up");

// Add and initialize any other clients you need to use (services are initialized by the system, clients are not):
// Finsemble.Clients.AuthenticationClient.initialize();
// Finsemble.Clients.ConfigClient.initialize();
// Finsemble.Clients.DialogManager.initialize();
Finsemble.Clients.DistributedStoreClient.initialize();
// Finsemble.Clients.DragAndDropClient.initialize();
// Finsemble.Clients.LauncherClient.initialize();
Finsemble.Clients.LinkerClient.initialize();
// Finsemble.Clients.HotkeyClient.initialize();
Finsemble.Clients.SearchClient.initialize();
// Finsemble.Clients.StorageClient.initialize();
Finsemble.Clients.WindowClient.initialize();
// Finsemble.Clients.WorkspaceClient.initialize();

/**
 * Add service description here
 */
class coinDeskSearchService extends Finsemble.baseService {
	/**
	 * Initializes a new instance of the coinDeskSearchService class.
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
					"distributedStoreClient",
					// "dragAndDropClient",
					// "hotkeyClient",
					// "launcherClient",
					"linkerClient",
					"searchClient",
					// "storageClient",
				    "windowClient"
					// "workspaceClient",
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
	readyHandler(callback: () => void) {
		this.fdc3Ready(this.customSearchFunction);
		
		callback();
	}

    /**
         * Initialize FDC3 - wait for fdc3 to be ready
         * @param  {...function} fns - functions to be executed when fdc3 is ready
         */
    fdc3Ready(...fns: any) {
        // add any functionality that requires FDC3 in here
        this.FDC3Client = new FDC3Client(Finsemble);
        window.addEventListener("fdc3Ready", () => fns.map((fn: any) => fn()));
    }

    async customSearchFunction() {

        let channel = await fdc3.getOrCreateChannel("searchContextChannel"); 

// TODO - delete dead code, describe what is being done, implement the component to render (see Kris' Slack)

		Finsemble.Clients.SearchClient.register(
            {
              name: "CoinDesk", // The name of the provider
              searchCallback: coinDeskSearch, // A function called when a search is initialized
              itemActionCallback: searchResultActionCallback, // (optional) A function that is called when an item action is fired
              providerActionTitle: "My Provider action title", // (optional) The title of the provider action
              // providerActionCallback: providerActionCallback,
              //(optional) A function that is called when a provider action is fired
            },
            function (err: any) {
              if (err) { Finsemble.Clients.Logger.error(err) }
              else {          
                Finsemble.Clients.Logger.log("SEARCH: CoinDesk - Registration succeeded");
              }
            }
        );
        Finsemble.Clients.Logger.log("coinDeskSearch Service ready");
		function searchResultActionCallback(params: any){
            // result = {
            //     name: data.bpi[symbolUpper].code,
            //     score: 100,
            //     type: "Application",
            //     description:  data.bpi[symbolUpper].description,
            //     actions: [{ name: "Broadcast" }],
            //     tags: []
            // }
            const {name, description} = params;
            const instrument = {
                type: 'fdc3.instrument',
                name: description,
                id: {
                    ticker: name
                }
            };
            channel.broadcast(instrument);
        }
        
        /**
         *
         * @param params query string
         * @param callback
         */

        function coinDeskSearch(params: { text: string, windowName: string }, callback: Function) {
    

            Finsemble.Clients.Logger.log("CUSTOM SEARCH PARAMS", params);
        
        // user will need to type "coindesk:GBP" in to the search bar
            if (params.text.toLowerCase().includes("coindesk:")) {
            // only get the city from the string
            const searchText = params.text.toLowerCase().replace("coindesk:", "")
            const symbol = searchText.trim()
        
            
            // https://cors-anywhere.herokuapp.com/
            const symbolUpper = symbol.toUpperCase()
            const url = `https://api.coindesk.com/v1/bpi/currentprice/${symbol}.json`
            console.log(url)
            fetch(url, {
                "method": "GET",
                "headers": {}
            })
                .then(response => response.json()) 
                .then(data => {
                console.log(symbolUpper)
                console.log(data)
                const result = {
                    name: data.bpi[symbolUpper].code,
                    score: 100,
                    type: "Application",
                    description:  data.bpi[symbolUpper].description,
                    actions: [{ name: "Broadcast" }],
                    tags: []
                }
                callback(null, [result])
            })
        
        // coindesk call response
        /*    {
                "time": {
                "updated": "Mar 19, 2021 17:15:00 UTC",
                "updatedISO": "2021-03-19T17:15:00+00:00",
                "updateduk": "Mar 19, 2021 at 17:15 GMT"
                },
                "disclaimer": "This data was produced from the CoinDesk Bitcoin Price Index (USD). Non-USD currency data converted using hourly conversion rate from openexchangerates.org",
                "bpi": {
                "USD": {
                    "code": "USD",
                    "rate": "58,849.3383",
                    "description": "United States Dollar",
                    "rate_float": 58849.3383
                },
                "GBP": {
                    "code": "GBP",
                    "rate": "42,418.7796",
                    "description": "British Pound Sterling",
                    "rate_float": 42418.7796
                }
                }
            } */
        
            
            }
        }
    }



}

const serviceInstance = new coinDeskSearchService();

serviceInstance.start();
