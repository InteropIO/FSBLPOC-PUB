const fdc3OnReady = (cb) => window.fdc3 ? cb : window.addEventListener("fdc3Ready", cb)

let state = {
    context: null,
    processedInitialIntent: null
};


const updateFromContext = (context, cb) => {
    FSBL.Clients.Logger.log("Updating from context: ", context);
    if (context?.id?.ticker && context.id.ticker != state.context?.id?.ticker) {
        saveStateAndNavigate(context);
    } else {
        //run the callback only if we're not navigating to another page
        if (cb) { cb() };
    }
};

// #region intents
const addIntentListener = () => {
    fdc3OnReady(
        () =>
            fdc3.addIntentListener('ViewChart', (context) => {
                FSBL.Clients.Logger.log("Received intent ViewChart, context: ", context, "Current state: ", state);
                if (state.processedInitialIntent && state.processedInitialIntent != state?.context?.id?.ticker
                    && state.processedInitialIntent == context?.id?.ticker) {
                    FSBL.Clients.Logger.log("Hack: Ignoring intent context that may have come from spawn data: ", context);
                } else {
                    if (state.context == null && state.processedInitialIntent == null) {
                        FSBL.Clients.Logger.log("Recording initial intent context: ", context?.id?.ticker);
                        state.processedInitialIntent = context?.id?.ticker;
                    }
                    updateFromContext(context);
                }
            })
    );
};
//#endregion intents

// #region context
/**
 * Subscribe to data via FDC3
 */
const subscribeToContext = () => {
    fdc3OnReady(
        () => fdc3.addContextListener(context => {
            FSBL.Clients.Logger.log("Received context: ", context);
            if (context.type === "fdc3.instrument") {
                updateFromContext(context);
            }
        })
    );
};
//#endregion context


const getUrlPathOrParamsFromConfig = () => {
    const { templateURL, params
    } = FSBL.Clients.WindowClient.options

}

/**
 * Config drives url template parameters and replace with context contextValue
 * ```javascript
 * const url = createURL({
  templateURL: "https://stocktwits.com/symbol/$$/?q=p&p=$$",
  queryParameter: "p",
  contextValue:"AAPL"
})
 * // url = "https://stocktwits.com/symbol/AAPL/?q=p&p=AAPL"
 * ```
 * @param object
 * @returns new url string
 */
function createURL({ templateURL, queryParameter, contextValue }) {
    const url = new URL(templateURL)
    let { pathname, searchParams } = url

    // set the search parameter from context if it's supplied as a template from config
    if (queryParameter && searchParams.has(queryParameter)) {
        searchParams.set(queryParameter, contextValue)
    }
    // if the config has a template URL replace it for the contextValue
    if (pathname.includes("$$")) {
        url.pathname = pathname.replace("$$", contextValue)
    }
    return url.toString()
}


/**
 * Using the config template URL and Parameters to get context data from window url
 * ```javascript
 * // page url = https://stocktwits.com/symbol/AAPL/?q=p&p=AAPL
 * const contextValue = createURL({
  templateURL: "https://stocktwits.com/symbol/$$/?q=p&p=$$",
  parameter: "p"
})
// contextValue = AAPL
 * ```
 * @param Object
 * @returns contextValue
 */
function getStateFromUrl({ templateURL, queryParameter }) {
    let url = new URL(templateURL)
    // let { pathname, searchParams } = url
    let { pathname, searchParams } = window.location
    pathname
    searchParams

    // get context from query params if exists
    if (queryParameter && searchParams.has(queryParameter)) {
        return searchParams.get(queryParameter)
    }
    // use the template from config to get the contextValue from the pathname
    else if (url.pathname.includes("$$")) {
        const contextIndex = url.pathname.split("/").indexOf("$$") /*?*/
        return pathname.split("/")[contextIndex] /*?*/
    } else {
        throw new Error("could not find state from the URL")
    }
}


const saveStateAndNavigate = (newContext) => {
    state.context = newContext;
    FSBL.Clients.Logger.log("Saving state: ", state);
    const params = {
        field: "state",
        value: state
    };
    FSBL.Clients.WindowClient.setComponentState(params, () => {
        //Hack: wait a little to make sure state sticks - keeps coming back with no state
        setTimeout(() => {
            const ticker = state.context.id.ticker
            const { templateURL, queryParameter } = FSBL.Clients.WindowClient.options.customData.component.custom
            window.location.href = createURL({ templateURL, queryParameter, contextValue: ticker });
        }, 1);
    });
};

const updateFromState = (err, savedState) => {
    const initContext = () => {
        FSBL.Clients.Logger.log("Initializing context and intent listeners");
        addIntentListener();
        subscribeToContext();
    };

    if (err) {
        FSBL.Clients.Logger.warn("Error on retrieving state", err);
        initContext();
    } else {
        FSBL.Clients.Logger.log("Updating from saved state: ", state);
        if (savedState && savedState?.context) {
            state.processedInitialIntent = savedState?.processedInitialIntent;
            updateFromContext(state.context, initContext);
        } else {
            initContext();
        }
    }
}

const restoreState = () => {
    FSBL.Clients.Logger.log("Restoring component state");
    const params = {
        field: "state"
    };
    // TODO: Change to await so show can be after restore
    FSBL.Clients.WindowClient.getComponentState(params, updateFromState);
};
// #endregion

//==================================================================================
// Main initialisation function
//----------------------------------------------------------------------------------


const init = () => {

    const { templateURL, queryParameter } = FSBL.Clients.WindowClient.options.customData.component.custom
    const ticker = getStateFromUrl({ templateURL, queryParameter });
    if (ticker) {
        state.context = {
            type: "fdc3.instrument",
            name: ticker,
            id: {
                ticker
            }
        };
    }

    restoreState();
};

//standard finsemble initialize pattern
if (window.FSBL && FSBL.addEventListener) {
    FSBL.addEventListener('onReady', init);
} else {
    window.addEventListener('FSBLReady', init);
};