const Finsemble = require("@finsemble/finsemble-core");
const FDC3Client = require("../FDC3/FDC3Client").default;

Finsemble.Clients.Logger.start();
Finsemble.Clients.Logger.log("coinDeskSearch Service starting up");

Finsemble.Clients.DistributedStoreClient.initialize();
Finsemble.Clients.LinkerClient.initialize();
Finsemble.Clients.SearchClient.initialize();
Finsemble.Clients.WindowClient.initialize();

/**
 * Service takes in parameters from Finsemble search in the format "coindesk:TICKER" and 
 *  searches against the coindesk API with TICKER, returns the details to the search box
 *  if it successfully finds details.
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
					"distributedStoreClient",
					"linkerClient",
					"searchClient",
				    "windowClient"
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
        //@ts-ignore
		window.FSBL = {};
		window.FSBL.Clients = Finsemble.Clients;
		this.FDC3Client = new FDC3Client(Finsemble);
		window.addEventListener("fdc3Ready", () => fns.map((fn: any) => fn()));
	}

    async customSearchFunction() {
        let channel = await fdc3.getOrCreateChannel("searchContextChannel"); 

		Finsemble.Clients.SearchClient.register(
            {
              name: "CoinDesk", // The name of the provider
              searchCallback: coinDeskSearch, // A function called when a search is initialized
              itemActionCallback: searchResultActionCallback, // (optional) A function that is called when an item action is fired
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
            const {name, description} = params.item;
            const instrument = {
                type: 'fdc3.instrument',
                name: description,
                id: {
                    ticker: name
                }
            };
            // FDC3 broadcast of our instrument that was prepped above
            channel.broadcast(instrument);
        }
        
        /**
         *
         * @param params query string
         * @param callback
         */
        function coinDeskSearch(params: { text: string, windowName: string }, callback: Function) {
            Finsemble.Clients.Logger.log("CUSTOM SEARCH PARAMS", params);
            // This is showing that search services can be namespaced if you want to use many of them
            //  and distinguish them from each other, but it is not mandatory. This example is using
            //  "coindesk:" as its namespace.
            if (params.text.toLowerCase().includes("coindesk:") &&  params.text.toLowerCase().replace("coindesk:", "").trim().length > 0) {
                const searchText = params.text.toLowerCase().replace("coindesk:", "")
                const symbol = searchText.trim()
                const url = `https://api.coindesk.com/v1/bpi/currentprice/${symbol}.json`
                fetch(url, {
                    "method": "GET",
                    "headers": {}
                })
                    .then(response => {
                        console.log(response)
                        if (response.ok) {
                         return response.json()
                        }
                    })
                    .then(data => {
                        if (data) {
                            const results = [];
                            for (const tickerSymbol in data.bpi){
                                const result = {
                                    name: data.bpi[tickerSymbol].code,
                                    // This is a sort order for how they are displayed on the search dropdown.
                                    // 0 comes first, 100 is last
                                    // Something like a Levenshtein or Hamming distance
                                    //  could then be scaled into that range to denote liklihood
                                    //  the item is what was typed - where 0 is a closer match, so comes first.
                                    // Not relevant to all API return types.
                                    // The API example here, this is not relative, so just using 100 always.
                                    score: 100, 
                                    type: "Application",
                                    description:  data.bpi[tickerSymbol].description,
                                    actions: [{ name: "Broadcast" }],
                                    tags: []
                                }
                                results.push(result)
                            }
                            callback(null, results)
                        }
                }).catch((error) => {});
                
            
                // example coindesk call response
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
