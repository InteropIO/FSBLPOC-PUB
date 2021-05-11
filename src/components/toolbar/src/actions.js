const { FinsembleProvider } = require("@finsemble/finsemble-ui/react/components/FinsembleProvider")

export default {
    logout() {
        FSBL.Logout();
    },
    spawnAbout() {
        FSBL.Clients.LauncherClient.showWindow({
            componentType: "About Finsemble"
        },
            {
                monitor: "mine",
                left: "center",
                top: "center",
                spawnIfNotFound: true
            });
    }
}