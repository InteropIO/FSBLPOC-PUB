

// function escapeStringRegExp(str) {
//   //regex escape function
//   const escapeStringRegExp_matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
//   return str.replace(escapeStringRegExp_matchOperatorsRe, '\\$&');
// }
// let regexStr = escapeStringRegExp("https://stocktwits.com/symbol/$1/?p=q&search=$2&q=o");


// let url = "https://stocktwits.com/symbol/AAPL/?p=q&search=Apple&q=o&cu=AAPL.E"

// regexStr = regexStr.replaceAll(escapeStringRegExp("$1"), "(.+)"); /*?*/
// let regex = new RegExp(regexStr, "i");
// let matches = url.match(regex)





function getContextDataFromURL(urlTemplate, templateKey, url) {
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string

  const urlSections = urlTemplate.split(templateKey)

  // regex - just trust in the magic!
  const regexString = `(?<=${escapeRegExp(urlSections[0])}).*?(?=${escapeRegExp(urlSections[1][0])})`
  // const regexString = `(?<=${escapeRegExp(urlSections[0])})(.*\\b)`
  /*
  String.raw is sometimes needed to truly escape - keeping this in here for info
  example:
  ```
  String.raw`(?<=https:\/\/stocktwits\.com\/symbol\/AAPL\/\?p=q&search=).*(?=&q=o&cu=AAPL\.E)`
  ```
  */
  const regex = new RegExp(regexString, "g")
  const result = url.match(regex)

  return result ? result[0] : null
}

const test3 = (() => {

  const url = 'http://host/panopticon/workbook/#/stock/params/{"id":"BAC US","idtype":"BBTICKER"}';

  let fdc3ToURLTemplate = {
    "urlTemplate": 'http://host/panopticon/workbook/#/stock/params/{"id":"$1","idtype":"$2"}',
    "fdc3ContextType": "fdc3.instrument",
    "templates": [
      {
        templateKey: "$1",
        contextKey: "id.BBG"
      },
      {
        templateKey: "$2",
        contextKey: "name"
      },
    ]
  }

  let tempURL = fdc3ToURLTemplate.urlTemplate;
  let res

  const templateResult = fdc3ToURLTemplate.templates.forEach(({ templateKey }, index) => {
    res = getContextDataFromURL(tempURL, templateKey, url)
  })
  templateResult



})()

// const test1 = (() => {
//   let url = "https://uk.finance.yahoo.com/quote/AMC/chart?p=AMC.A&.tsrc=fin-srch";

//   let fdc3ToURLTemplate = {
//     "urlTemplate": "https://uk.finance.yahoo.com/quote/$1/chart?p=$2&.tsrc=fin-srch",
//     "fdc3ContextType": "fdc3.instrument",
//     "templates": [
//       {
//         templateKey: "$1",
//         contextKey: "id.ticker"
//       },
//       {
//         templateKey: "$2",
//         contextKey: "id.ticker"
//       }
//     ]
//   }

//   const templateResult = fdc3ToURLTemplate.templates.map(({ templateKey, contextKey }) => getContextDataFromURL(fdc3ToURLTemplate.urlTemplate, templateKey, url))
//   templateResult

// })()




/**
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

  const templateResult = fdc3ToURLTemplate.templates.map(({ templateKey, contextKey }) => getContextDataFromURL(fdc3ToURLTemplate.urlTemplate, templateKey, url))



})()




const test4 = (() => {
  let url = "http://host/tableau/workbook/#/stock?:toolbar=no&:embed=yes&:refresh=yes&RIC=BAC.N";

  let fdc3ToURLTemplate = {
    "urlTemplate": "http://host/tableau/workbook/#/stock?:toolbar=no&:embed=yes&:refresh=yes&RIC=$1",
    "fdc3ContextType": "fdc3.instrument",
    "templates": [
      {
        templateKey: "$1",
        contextKey: "id.RIC"
      }
    ]
  }

  const templateResult = fdc3ToURLTemplate.templates.map(({ templateKey, contextKey }) => getContextDataFromURL(fdc3ToURLTemplate.urlTemplate, templateKey, url))


})()
*/