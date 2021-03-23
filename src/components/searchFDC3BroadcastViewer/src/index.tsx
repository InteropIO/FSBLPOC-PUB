import React, {useState, useEffect} from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import "../../../../assets/css/theme.css";

const fdc3OnReady = (cb: any) => window.fdc3 ? cb() : window.addEventListener('fdc3Ready', cb)

function SearchFDC3BroadcastViewer() {
    const [ticker, setTicker] = useState("")
    const [description, setDescription] = useState("")

    // run useEffect once (on load) to add the channel context listener
    useEffect(() => {
        const channelContext = async () => {
            const channel = await fdc3.getOrCreateChannel("searchContextChannel");
            const listener = channel.addContextListener((contextObj: any) => {
                if (contextObj.type === "fdc3.instrument") {
                    setTicker(contextObj.id.ticker)
                    setDescription(contextObj.name)
                }
            });    
            return listener
        }        
        const listener = channelContext()
        // cleanup event listener when the React component reloads/remounts
        return () => {
            listener
                .then(({unsubscribe}) => unsubscribe())
        }
    }, [])
    
    return <>Ticker: {ticker}, Description: {description}</>;
}

fdc3OnReady(
    () => ReactDOM.render(
        <FinsembleProvider>
            <SearchFDC3BroadcastViewer />
        </FinsembleProvider>,
        document.getElementById("searchFDC3BroadcastViewer-tsx")
    )
);
