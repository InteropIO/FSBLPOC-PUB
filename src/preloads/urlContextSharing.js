const fdc3OnReady = (cb) => window.fdc3 ? cb : window.addEventListener("fdc3Ready", cb)

let state = {
    context: null,
    intent: "ViewChart",
    fdc3ToURLTemplate: null,
    listeners: []
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

// This does a deep equals and is neeeded for comparing context objects
const equals = (a, b) => {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date)
        return a.getTime() === b.getTime();
    if (!a || !b || (typeof a !== 'object' && typeof b !== 'object'))
        return a === b;
    if (a.prototype !== b.prototype) return false;
    let keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every(k => equals(a[k], b[k]));
};
// =======end utility functions

// promise based version of FSBL.Clients.WindowClient.getComponentState
function getFinsembleComponentState(params) {
    return new Promise((resolve, reject) => {
        FSBL.Clients.WindowClient.getComponentState(params, (err, res) => {
            if (err) {
                reject(err)
            }
            else {
                if (!res) {
                    resolve(null)
                } else {
                    resolve(res);
                }
            }
        });
    })
}

async function setFinsembleComponentState(params) {
    return new Promise((resolve, reject) => {
        const setState = async (params, maxRetries = 10) => {
            try {
                // if the window state is the same as state then it has been updated
                const componentState = await getFinsembleComponentState(params)

                // check to see if the params sent in have been set in the Finsemble window state
                if (equals(params.value, componentState)) {
                    FSBL.Clients.Logger.log("Component state has been set")
                    resolve(true)
                } else {
                    FSBL.Clients.Logger.log("Trying again to set component state")
                    if (maxRetries === 0) reject(Error(`failed to set Finsemble window state. Tried ${maxRetries} times (${maxRetries / 10} seconds).`))
                    maxRetries--;

                    await FSBL.Clients.WindowClient.setComponentState(params)
                    // try again but wait to see if Finsemble sets the window state
                    setTimeout(() => {
                        setState(params, maxRetries)
                    }, 100)
                }
            } catch (error) {
                FSBL.Clients.Logger.error(` WindowState Error`, error)
            }

        }

        setState(params)
    })
}

async function updateFromContext(context) {
    FSBL.Clients.Logger.log("Updating from context: ", context);
    if (!equals(context, state.context)) {
        state.context = context
        const res = await saveStateAndNavigate(context);
        return res
    } else {
        return false
    }
};


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
    // fill the context template object from the values from the URL
    templateResult.forEach(({ contextKey, contextValue }) => {
        if (contextValue && contextValue !== "undefined")
            set(context, contextKey, contextValue)
    })

    // check to see if the template has been updated, if not set it to null
    const isDefaultTemplate = equals(context, getContextTemplate(fdc3ContextType))
    if (isDefaultTemplate) {
        return null
    } else {
        FSBL.Clients.Logger.log("URL Context", context)
        return context
    }
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
* @param {object} context
* @returns {string} url string e.g "https://stocktwits.com/symbol/AAPL?p=q&search=Apple&q=o&cu=AAPL.E"
*/
function createURLUsingContextValues(context) {
    const { fdc3ToURLTemplate } = FSBL.Clients.WindowClient.options?.customData?.component?.custom
    const { urlTemplate, templates, fdc3ContextType } = fdc3ToURLTemplate

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



async function saveStateAndNavigate(context) {

    try {
        const contextState = {
            context: state.context,
            intent: state.intent
        }
        FSBL.Clients.Logger.log("Saving state: ", state);
        const componentIsSet = await setFinsembleComponentState({
            field: "state",
            value: contextState
        })
        if (componentIsSet) {
            // remove event listeners
            state.listeners.forEach(listener => listener.unsubscribe())
            const newURL = createURLUsingContextValues(context)

            FSBL.Clients.Logger.log(`successfully saved state, now navigating to ${newURL}`)

            window.location.href = newURL;
        } else {
            return false
        }
    } catch (error) {
        FSBL.Clients.Logger.error(error);

    }
};


/**
 * Get the saved state using the Finsemble Window API
 * @param {Error} err
 * @param {object} savedWindowState
 */
async function updateFromWindowState(savedWindowState, { fdc3ContextType }) {
    FSBL.Clients.Logger.log("Updating from saved state: ", savedWindowState);

    if (savedWindowState.context) {
        const updated = await updateFromContext(savedWindowState.context);
        // if we can't update from the context then run the init
        if (!updated) { initContext(fdc3ContextType) };
    } else {
        initContext(fdc3ContextType);
    }
}

function initContext(contextType) {
    FSBL.Clients.Logger.log("Initializing context and intent listeners");

    // set context via intent
    const intentListener = fdc3.addIntentListener(state.intent, (context) => {
        FSBL.Clients.Logger.log("Received intent ViewChart, context: ", context, "Current state: ", state);
        // only initialise if the content is empty
        if (!state.context) {
            updateFromContext(context);
        } else {
            FSBL.Clients.Logger.log("Recording initial intent context: ", context);
        }

    })

    // set context via context listener
    const contextListener = fdc3.addContextListener(context => {
        FSBL.Clients.Logger.log("Received context: ", context);
        if (context.type === contextType) {
            updateFromContext(context);
        }
    })

    state.listeners.push(intentListener, contextListener)

};

// #endregion

//==================================================================================
// Main initialisation function
//----------------------------------------------------------------------------------


async function init() {

    // TODO: add the ability to use multiple int in the future
    const { name: intent } = FSBL.Clients.WindowClient.options.customData.foreign.services?.fdc3?.intents[0];
    if (intent) state.intent = intent

    const fdc3ToURLTemplate = FSBL.Clients.WindowClient.options?.customData?.component.custom?.fdc3ToURLTemplate
    if (!fdc3ToURLTemplate) {
        throw new Error("No fdc3ToURLTemplate value found in config")
    }

    state.fdc3ToURLTemplate = fdc3ToURLTemplate
    state.context = getContextStateFromUrl(fdc3ToURLTemplate);

    try {
        FSBL.Clients.Logger.log("Restoring component state");
        const windowState = await getFinsembleComponentState({
            field: "state"
        });
        FSBL.Clients.Logger.log("Component state", windowState);

        if (windowState) {
            updateFromWindowState(windowState, fdc3ToURLTemplate)
        }
        else {
            initContext(fdc3ToURLTemplate.fdc3ContextType)
        }

    } catch (error) {
        FSBL.Clients.Logger.warn("Error on retrieving state", error);
        initContext(fdc3ToURLTemplate.fdc3ContextType);
    }

};

//standard finsemble initialize pattern
if (window.FSBL && FSBL.addEventListener) {
    FSBL.addEventListener('onReady', () => fdc3OnReady(init));
} else {
    window.addEventListener('FSBLReady', () => fdc3OnReady(init));
};


// open the devtools
// (() => {
//     const browserView = fin.desktop.System.currentWindow.getBrowserView()
//     const appWindow = browserView.webContents
//     appWindow.openDevTools()
// })()
