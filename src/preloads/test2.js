
let url = "https://stocktwits.com/symbol/AAPL?p=q&search=Apple&q=o&cu=AAPL.E";

let fdc3ToURLTemplate = {
  "//exampleURL": "https://stocktwits.com/symbol/AAPL?p=q&search=Apple&q=o&cu=AAPL.E",
  "urlTemplate": "https://stocktwits.com/symbol/$1?p=q&search=$2&q=o&cu=$3",
  "fdc3ContextType": "fdc3.instrument",
  "templates": [
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
const get = (obj, path, defValue) => {
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
        "type": "fdc3.instrument",
        "id": {}
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
 * const url = createURL(fdc3ToURLTemplate,context)
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



// ========= TESTING SECTION
getContextStateFromUrl(fdc3ToURLTemplate, url)

const context = {
  type: 'fdc3.instrument',
  name: 'Apple',
  id: { ticker: 'AAPL', CUSIP: 'AAPL.E' }
}

createURLUsingContextValues(fdc3ToURLTemplate, context)

const test1 = (() => {
  let url = "https://uk.finance.yahoo.com/quote/AMC/chart?p=AMC&.tsrc=fin-srch";

  let fdc3ToURLTemplate = {
    "urlTemplate": "https://uk.finance.yahoo.com/quote/$1/chart?p=AMC&.tsrc=fin-srch",
    "fdc3ContextType": "fdc3.instrument",
    "templates": [
      {
        templateKey: "$1",
        contextKey: "id.ticker"
      },
      {
        templateKey: "$1",
        contextKey: "name"
      }
    ]
  }
  getContextStateFromUrl(fdc3ToURLTemplate, url) /*?*/

  const context = {
    type: 'fdc3.instrument',
    name: 'AMC Cinemas',
    id: { ticker: 'AMC' }
  }

  // In this case ordering of the templates array is really important.
  // If the URL string has been replaced by the first value it will not be overwritten by newer values
  createURLUsingContextValues(fdc3ToURLTemplate, context) /*?*/

})()
const test2 = (() => {
  let url = "https://find-and-update.company-information.service.gov.uk/search?q=google";

  let fdc3ToURLTemplate = {
    "urlTemplate": "https://find-and-update.company-information.service.gov.uk/search?q=$1",
    "fdc3ContextType": "fdc3.organization",
    "templates": [
      {
        templateKey: "$1",
        contextKey: "name"
      }
    ]
  }
  getContextStateFromUrl(fdc3ToURLTemplate, url) /*?*/

  const context = {
    type: 'fdc3.organization',
    name: 'Google'
  }

  // In this case ordering of the templates array is really important.
  // If the URL string has been replaced by the first value it will not be overwritten by newer values
  createURLUsingContextValues(fdc3ToURLTemplate, context) /*?*/

})()

const test3 = (() => {

  let url = 'http://host/panopticon/workbook/#/stock/params/{"id":"BAC US","idtype":"BBTICKER"}';

  let fdc3ToURLTemplate = {
    "urlTemplate": 'http://host/panopticon/workbook/#/stock/params/{"id":"$1","idtype":"$2"}',
    "fdc3ContextType": "fdc3.instrument",
    "templates": [
      {
        templateKey: "$1",
        contextKey: "id.BBG"
      },
    ]
  }
  getContextStateFromUrl(fdc3ToURLTemplate, url) /*?*/

  const context = {
    type: 'fdc3.instrument',
    id: { BBG: 'Google' }
  }

  // In this case ordering of the templates array is really important.
  // If the URL string has been replaced by the first value it will not be overwritten by newer values
  createURLUsingContextValues(fdc3ToURLTemplate, context) /*?*/

})()


// const test4 = (() => {
//   let url = "http://host/tableau/workbook/#/stock?:toolbar=no&:embed=yes&:refresh=yes&RIC=BAC.N";

//   let fdc3ToURLTemplate = {
//     "urlTemplate": "http://host/tableau/workbook/#/stock?:toolbar=no&:embed=yes&:refresh=yes&RIC=$1",
//     "fdc3ContextType": "fdc3.instrument",
//     "templates": [
//       {
//         templateKey: "$1",
//         contextKey: "id.RIC"
//       }
//     ]
//   }
//   getContextStateFromUrl(fdc3ToURLTemplate, url) /*?*/

//   const context = {
//     type: 'fdc3.instrument',
//     name: 'BAC.N',
//     id: { RIC: 'BAC.F' }
//   }

//   // In this case ordering of the templates array is really important.
//   // If the URL string has been replaced by the first value it will not be overwritten by newer values
//   createURLUsingContextValues(fdc3ToURLTemplate, context) /*?*/

// })()
const test5 = (() => {
  let url = "http://compasstableau-prd-amrs.bankofamerica.com/t/Execution_Svcs/views/Stock-BILaunchpad/StockSummary?:toolbar=no&:embed=yes&:refresh=yes&RIC=IBM.N";

  let fdc3ToURLTemplate = {

    "urlTemplate": "http://compasstableau-prd-amrs.bankofamerica.com/t/Execution_Svcs/views/Stock-BILaunchpad/StockSummary?:toolbar=no&:embed=yes&:refresh=yes&RIC=$1",

    "fdc3ContextType": "fdc3.instrument",

    "templates": [

      {

        "templateKey": "$1",

        "contextKey": "id.RIC"

      }

    ]
  }
  getContextStateFromUrl(fdc3ToURLTemplate, url) /*?*/

  const context = {
    type: 'fdc3.instrument',
    name: 'BAC.N',
    id: { RIC: 'BAC.F' }
  }

  // In this case ordering of the templates array is really important.
  // If the URL string has been replaced by the first value it will not be overwritten by newer values
  createURLUsingContextValues(fdc3ToURLTemplate, context) /*?*/

})()

