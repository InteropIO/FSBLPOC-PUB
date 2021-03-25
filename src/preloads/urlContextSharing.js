const fdc3OnReady = (cb) => window.fdc3 ? cb : window.addEventListener("fdc3Ready", cb)

let state = {
    context: null,
    processedInitialIntent: null,
    intent: "ViewChart",
    context: "fdc3.instrument"
};

//========== utility functions

// This is the same as lodash's ._set function https://youmightnotneed.com/lodash/#set
function set(obj, path, value) {
    // Regex explained: https://regexr.com/58j0k
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)

    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {}
        if (i === pathArray.length - 1) acc[key] = value
        return acc[key]
    }, obj)
}

// This is the same as lodash's ._get function https://youmightnotneed.com/lodash/#get
function get(obj, path, defValue) {
    // If path is not defined or it has false value
    if (!path) return undefined
    // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
    // Regex explained: https://regexr.com/58j0k
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)
    // Find value if exist return otherwise return undefined value;
    return (
        pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj) || defValue
    )
}

  // =======end utility functions

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
            fdc3.addIntentListener(state.intent, (context) => {
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
 *
 * @param {string} type the fdc3 type
 * @returns an object template for the context type
 * `getContextTemplate("fdc3.context")`
 */
function getContextTemplate(type) {
    switch (type) {
        case "fdc3.contact":
            return {
                type: 'fdc3.contact'
            }
        case "fdc3.contactList":
            return {
                type: 'fdc3.contactList',
                contacts: []
            }
        case "fdc3.country":
            return {
                type: 'fdc3.country'
            }
        case "fdc3.instrument":
            return {
                "type": "fdc3.instrument",
                "id": {}
            }
        case "fdc3.instrumentList":
            return {
                type: 'fdc3.instrumentList',
                instruments: []
            }
        case "fdc3.organization":
            return {
                type: 'fdc3.organization'
            }
        case "fdc3.position":
            return {
                type: 'fdc3.position',
                instrument: {
                    type: "fdc3.instrument"
                },
                holding: 2000000
            }
        case "fdc3.portfolio":
            return {
                type: 'fdc3.portfolio',
                positions: []
            }

        default:
            return {
                "type": type
            }

    }

}



/**
 * Get the state from the URL using the template objects
 * @param {object} fdc3ToURLTemplate
 * @param {string} urlParam
 * @returns {object} context data
 * @example
 * ```javascript
 *
const fdc3ToURLTemplate = {
  urlTemplate: "https://stocktwits.com/symbol/$1?p=q&search=$2&q=o&cu=$3",
  fdc3ContextType: "fdc3.instrument",
  templates: [
    {
      templateKey: "$1",
      contextKey: "id.ticker"
    },
    {
      templateKey: "$2",
      contextKey: "name"
    },
    {
      templateKey: "$3",
      contextKey: "id.CUSIP"
    }
  ]
}

const url = "https://stocktwits.com/symbol/AAPL?p=q&search=Apple&q=o&cu=AAPL.E" || window.location.href

 * getContextStateFromUrl(fdc3ToURLTemplate, url)
 * ```
 */
function getContextStateFromUrl({ urlTemplate, templates, fdc3ContextType }, urlParam = window.location.href) {
    const template = new URL(urlTemplate)
    const url = new URL(urlParam)

    // methods to decode the template URL
    const getURLPathFromTemplateURL = (key) => template.pathname.split("/").indexOf(key)
    const getParamsFromTemplateURL = (param) => {
      const res = Array.from(template.searchParams.entries()).filter(([key, value]) => value.includes(param))
      return res[0] || []
    }
    const getKeyFromPanopticonURL = (param) => {
        const url1 = decodeURIComponent(template)
        const regex = /\{(.*?)\}/g;
        const [result] = url1.match(regex) ?? [];

        if (!result) return result

        // get the key for the panopiticon JSON object
        let [key, value] = Object.entries(JSON.parse(result))
            .find(([key, value]) => {
                if (value === param) return key
            })

        return key
    }


    // methods to get the values from the actual URL
    const getValueFromURLPath = (path) => url.pathname.split("/")[path]
    const getValueFromURLParams = (param) => url.searchParams.get(param)
    const getValueFromPanopticonURLObject = (key) => {
        const url1 = decodeURIComponent(url)
        const regex = /\{(.*?)\}/g;
        const [result] = url1.match(regex) ?? [];
        const panopiticonObject = JSON.parse(result)
        const value = panopiticonObject[key]
        return value
    }


    // run through all the template values from fdc3ToURLTemplate and get the values from the URL using the methods above
    const templateResult = templates.map(({ templateKey, contextKey }) => {
      const [templateParam] = getParamsFromTemplateURL(templateKey)
      const templatePath = getURLPathFromTemplateURL(templateKey)
        const panopticonObjectKey = getKeyFromPanopticonURL(templateKey)


      let contextValue;

      if (templateParam) {
        contextValue = getValueFromURLParams(templateParam)
      } else if (panopticonObjectKey) {
          contextValue = getValueFromPanopticonURLObject(panopticonObjectKey)
      } else if (templatePath) {
        contextValue = getValueFromURLPath(templatePath)
      }

      return {
        templateKey,
        contextKey,
        contextValue
      }
    })


    let context = getContextTemplate(fdc3ContextType)
    templateResult.forEach(({ contextKey, contextValue }) => set(context, contextKey, contextValue))
    return context
  }

  /**
 * Config drives url template parameters and replace with context contextValue
 * ```javascript
 * const context = {
  type: 'fdc3.instrument',
  name: 'Apple',
  id: { ticker: 'AAPL', CUSIP: 'AAPL.E' }
}
const fdc3ToURLTemplate = {
  urlTemplate: "https://stocktwits.com/symbol/$1?p=q&search=$2&q=o&cu=$3",
  fdc3ContextType: "fdc3.instrument",
  templates: [
    {
      templateKey: "$1",
      contextKey: "id.ticker"
    },
    {
      templateKey: "$2",
      contextKey: "name"
    },
    {
      templateKey: "$3",
      contextKey: "id.CUSIP"
    }
  ]
}
 * const url = createURLUsingContextValues(fdc3ToURLTemplate,context)
 * ```
 * @param { {string, array, string} } fdc3ToURLTemplate
 * @param {object} context
 * @returns {string} url string e.g "https://stocktwits.com/symbol/AAPL?p=q&search=Apple&q=o&cu=AAPL.E"
 */
function createURLUsingContextValues({ urlTemplate, templates, fdc3ContextType }, context) {
    if (context.type !== fdc3ContextType) throw new Error("URL_TEMPLATE_ERROR: Mismatch. Context type does not match url template context type (fdc3).")

    let newTemplate = urlTemplate.toString();


    templates.map(({
        contextKey,
        templateKey,
    }) => {
        let contextValue = get(context, contextKey)

        return {
            contextKey,
            templateKey,
            contextValue,
      }
    }).forEach(({ // fill in the template values with real values
        contextKey,
        templateKey,
        contextValue,
    }) => {
        // update the URL with the data from the context object
        newTemplate = newTemplate.replace(templateKey, contextValue)
    })

    return newTemplate
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
            const context = state.context
            const fdc3ToURLTemplate = FSBL.Clients.WindowClient.options.customData.component.custom.fdc3ToURLTemplate
            // TODO: does the URL string need to be urlEncoded?
            window.location.href = createURLUsingContextValues(fdc3ToURLTemplate, context);
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

    const fdc3ToURLTemplate = FSBL.Clients.WindowClient.options.customData.component.custom.fdc3ToURLTemplate
    state.context = getContextStateFromUrl(fdc3ToURLTemplate);

    // TODO: add the ability to use multiple int in the future
    const { name: intent, contexts } = FSBL.Clients.WindowClient.options.customData.foreign.services?.fdc3?.intents[0];
    if (intent) state.intent = intent
    const context = contexts[0]
    if (context) state.context = context

    restoreState();
};

//standard finsemble initialize pattern
if (window.FSBL && FSBL.addEventListener) {
    FSBL.addEventListener('onReady', init);
} else {
    window.addEventListener('FSBLReady', init);
};