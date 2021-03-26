## URL Template Context Sharing Preload!

### Instructions:
#### Step1:
Add the both the FDC3 preload and the urlContextSharing Preload to your component configuration:


```
"preload": [
    "$applicationRoot/preloads/FDC3Client.js",
    "$applicationRoot/preloads/urlContextSharing.js"
    ]
```
#### Step 2:

Add the **fdc3ContextType** section to your preload:

```
    "fdc3ToURLTemplate": {
					"urlTemplate": "https://stocktwits.com/symbol/$1?p=q&search=$2&q=o&cu=$3",
					"fdc3ContextType": "fdc3.instrument",
					"templates": [
						{
							"templateKey": "$1",
							"contextKey": "id.ticker"
						},
						{
							"templateKey": "$2",
							"contextKey": "name"
						},
						{
							"templateKey": "$3",
							"contextKey": "id.CUSIP"
						}
					]
				}
```
**How it works:**
The url looks something like this: https://stocktwits.com/symbol/AAPL?p=q&search=Apple&q=o&cu=AAPL.E

We next use a template to work out what parts of the URL we need to collect data from or set data for like so:
*https://stocktwits.com/symbol/$1?p=q&search=$2&q=o&cu=$3*
The $ signs get replaced when the template is processed with actual values .

To do this we need to set some additonal paramters to work out what FDC3 keys need to be set using which template value by using the templates array:
```
"templates": [
				{
					"templateKey": "$1",
					"contextKey": "id.ticker"
				},
				{
					"templateKey": "$2",
					"contextKey": "name"
				}
			]
```
**You can use as many templates as you need*

It's also important that we set `"fdc3ContextType": "fdc3.instrument"` to match our context type. This ensures that the context object is formatted correctly when using broadcast. Custom context types will also work too.

The templates and context type combined will produce the FDC3 context value from Stock Twits. The result looks like this:
```
{
	type:"fdc3.instument",
	name:"Apple",
	id:{
		ticker:"AAPL"
	}
}
```
NOTE: The casing of the FDC3 object and the template is important.


### Full Example:
Full config for StockTwits component:
```
	"Stocktwits FDC3": {
			"window": {
				"url": "https://stocktwits.com/",
				"width": 800,
				"height": 600,
				"options": {
					"minWidth": 75,
					"securityPolicy": "trusted"
				},
				"affinity": "fdc3",
				"addToWorkspace": true
			},
			"component": {
				"mode": "fdc3",
				"category": "system",
				"preload": [
					"$applicationRoot/preloads/FDC3Client.js",
					"$applicationRoot/preloads/urlContextSharing.js"
				],
				"custom": {
					"fdc3ToURLTemplate": {
						"urlTemplate": "https://stocktwits.com/symbol/$1?p=q&search=$2&q=o&cu=$3",
						"fdc3ContextType": "fdc3.instrument",
						"templates": [
							{
								"templateKey": "$1",
								"contextKey": "id.ticker"
							},
							{
								"templateKey": "$2",
								"contextKey": "name"
							},
							{
								"templateKey": "$3",
								"contextKey": "id.CUSIP"
							}
						]
					}
				}
			},
			"foreign": {
				"services": {
					"windowService": {
						"allowAutoArrange": true
					},
					"data": {},
					"fdc3": {
						"intents": [
							{
								"name": "ViewChart",
								"displayName": "ViewChart",
								"contexts": [
									"fdc3.instrument"
								]
							}
						]
					}
				},
				"components": {
					"App Launcher": {
						"launchableByUser": true
					},
					"Toolbar": {
						"iconURL": "https://stocktwits.com/favicon.png"
					},
					"Window Manager": {
						"title": "StockTwits App",
						"FSBLHeader": true,
						"showLinker": true,
						"persistWindowState": true
					}
				}
			}
		},
```