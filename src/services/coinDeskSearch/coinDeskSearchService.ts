const Finsemble = require("@finsemble/finsemble-core");
import FDC3Client from "../FDC3/FDC3Client";
import BloombergBridgeClient from "../../clients/BloombergBridgeClient/BloombergBridgeClient";

let UIReady = false;

Finsemble.Clients.Logger.start();
Finsemble.Clients.Logger.log("coinDeskSearch Service starting up");

Finsemble.Clients.DistributedStoreClient.initialize();
Finsemble.Clients.LinkerClient.initialize();
Finsemble.Clients.SearchClient.initialize();
Finsemble.Clients.WindowClient.initialize();

//Setup the BloombergBridgeClient that will be used for all messaging to/from Bloomberg
const bbg = new BloombergBridgeClient(Finsemble.Clients.RouterClient, Finsemble.Clients.Logger);
/** Flag used to track whether we are currently connected to a Bloomberg terminal.
 * Both the Bloomberg terminal and the BloombergBridge must be runnign for this 
 * to be true.
 */
let connectedToBbg = false;

/**
 * Service takes in parameters from Finsemble search in the format "coindesk:TICKER" and 
 *  searches against the coindesk API with TICKER, returns the details to the search box
 *  if it successfully finds details.
 */
class coinDeskSearchService extends Finsemble.baseService {
    FDC3Client: FDC3Client | null = null;

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
    this.setupConnectionLifecycleChecks = this.setupConnectionLifecycleChecks.bind(this);
    this.checkConnection = this.checkConnection.bind(this);
		this.onBaseServiceReady(this.readyHandler);
	}

	/**
	 * Fired when the service is ready for initialization
	 * @param {function} callback
	 */
	readyHandler(callback: () => void) {
		this.fdc3Ready(this.customSearchFunction);
		this.setupConnectionLifecycleChecks();
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

        function searchResultActionCallback(params: any){
            //Push context to the FDC3 Channel we setup a reference to
            Finsemble.Clients.Logger.log(`searchResultActionCallback called with params: `, params);
            const {item, action} = params;
            const instrument = {
                type: 'fdc3.instrument',
                name: item.description,
                id: {
                    ticker: item.name
                }
            };
            channel.broadcast(instrument);

            //Also push context to (all) Bloomberg Launchpad groups
            const bbgSecurity = item.name + " Curncy";
            if (connectedToBbg){
                bbg.runGetAllGroups((err, response) => {
                    if (response && response.groups && Array.isArray(response.groups)) {
                        Finsemble.Clients.Logger.log(`Setting context '${bbgSecurity}' on launchpad groups: `, response.groups);
                        //cycle through all launchpad groups
                        response.groups.forEach(group => {
                            //TODO: may want to check group.type and only apply to type == security groups
                            //Set group's context
                                //N.b. this is replying on Bloomberg to resolve the name to a valid Bloomberg security string (e.g. TSLA = TSLA US Equity)
                             bbg.runSetGroupContext(group.name, bbgSecurity, null, (err, data) => {
                                if (err) {
                                    Finsemble.Clients.Logger.error(`Error received from runSetGroupContext, group: ${group.name}, value: ${bbgSecurity}, error: `, err);
                                }
                            });
                        });
                    } else if (err) {
                        Finsemble.Clients.Logger.error("Error received from runGetAllGroups:", err);
                    } else {
                        Finsemble.Clients.Logger.error("invalid response from runGetAllGroups", response);
                    }
                });
            } else {
                Finsemble.Clients.Logger.warn("Context not shared to Bloomberg as we are not connected to the terminal");
            }
        }
    }

    //-----------------------------------------------------------------------------------------
    // Functions related to Bloomberg connection status
    // Used to enable/disable calls to send context to launchpad automatically
    //-----------------------------------------------------------------------------------------
    setupConnectionLifecycleChecks = () => { 
        //do the initial check
        this.checkConnection();
        //listen for connection events (listen/transmit)
        bbg.setConnectionEventListener(this.checkConnection);
        //its also possible to poll for connection status,
        //  worth doing in case the bridge process is killed off and doesn't get a chance to send an update
        setInterval(this.checkConnection, 30000);
    };

    checkConnection = () => {
        bbg.checkConnection((err, resp) => { 
            if (!err && resp === true) {
                connectedToBbg = true;
            } else if (err) {
                Finsemble.Clients.Logger.debug("Error received when checking connection", err);
                connectedToBbg = false;
            } else {
                Finsemble.Clients.Logger.debug("Negative response when checking connection: ", resp);
                connectedToBbg = false;
            }
        });
    };
    //-----------------------------------------------------------------------------------------
    
}

const serviceInstance = new coinDeskSearchService();
serviceInstance.start();
