/***********************************************************************************************************************
	Copyright 2017-2020 by ChartIQ, Inc.
	Licensed under the ChartIQ, Inc. Developer License Agreement https://www.chartiq.com/developer-license-agreement
 **********************************************************************************************************************/
if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener('onReady', init);
} else {
	window.addEventListener('FSBLReady', init);
}

function init() {
	Promise.all([
		setFSBLVersion(),
		setContainerVersion(),
		setApplicationRoot(),
		setMonitors(),
		setHostSpecs()
	]).then(() => {
		FSBL.Clients.WindowClient.fitToDOM();
	})
}

/**
 * Get container type
 *
 * @return {string}
 */
function getContainerType() {
	if (typeof fin === "undefined") {
		FSBL.Clients.Logger.warn("No fin object. Likely deprecated.");
		return "unknown";
	}

	if (typeof fin.container !== "undefined" && fin.container.toLowerCase() === "electron") {
		return "Finsemble Electron Adapter";
	}

	return "Openfin";
}


/**
 * Fetches and outputs the Finsemble version to the view
 *
 * @return {Promise}
 */
function setFSBLVersion() {
	return new Promise((resolve) => {
		FSBL.getFSBLInfo().then((data) => {
			let innerHtml = "";
			Object.keys(data).forEach((key) => {
				innerHtml += `<div><strong><em>${key}</em></strong>: ${data[key]}</div>`;
			});
			document.getElementById('fsbl-version').innerHTML = innerHtml;
			resolve();
		});
	});
}

function setApplicationRoot() {
	return new Promise((resolve) => {
		FSBL.Clients.ConfigClient.getValue({ field: 'finsemble.applicationRoot' }, (err, value) => {
			if (!err) {
				document.getElementById('application-root').innerText = value;
			}
			resolve();
		});
	})
}

/**
 * Fetches and output the container version to the view
 *
 * @return {Promise}
 */
function setContainerVersion() {
	return new Promise((resolve) => {
		const containerType = getContainerType();
		if (containerType !== "unknown") {
			document.getElementById("container-name").innerText = containerType + " version";
		}

		FSBL.System.getVersion((version) => {
			document.getElementById("container-version").innerText = version;
		});

		resolve();
	});
}


/**
 * Fetches and outputs the monitor data to the view
 *
 * @return {Promise}
 */
function setMonitors() {
	let count = 1;
	const outputMonitorDetails = (monitorObj, isPrimary) => {
		return `<tr>
            <td>${count++}</td>
            <td>${isPrimary ? "yes" : "no"}</td>
            <td>${monitorObj.deviceScaleFactor}</td>
            <td>${monitorObj.monitorRect.width ? monitorObj.monitorRect.width : monitorObj.monitorRect.right - monitorObj.monitorRect.left}</td>
            <td>${monitorObj.monitorRect.height ? monitorObj.monitorRect.height : monitorObj.monitorRect.bottom - monitorObj.monitorRect.top}</td>
            <td>${monitorObj.monitorRect.left}</td>
            <td>${monitorObj.monitorRect.top}</td>
        </tr>`;
	};

	return new Promise((resolve) => {
		FSBL.System.getMonitorInfo((data) => {
			let monitorInfo = "<table><tr>" +
				"<th>#</th>" +
				"<th>Primary</th>" +
				"<th>scale</th>" +
				"<th>scaled width</th>" +
				"<th>scaled height</th>" +
				"<th>xPos</th>" +
				"<th>yPos</th>" +
				"</tr>";
			monitorInfo += outputMonitorDetails(data.primaryMonitor, true);
			data.nonPrimaryMonitors.forEach((monitor) => {
				monitorInfo += outputMonitorDetails(monitor, false);
			});

			monitorInfo += "</table>";

			document.getElementById('monitor-info').innerHTML = monitorInfo;
		});
		resolve();
	});
}


/**
 * Fetches and outputs Host spec data into the view
 *
 * @return {Promise}
 */
function setHostSpecs() {

	const getMemoryValue = (memoryInBytes) => {
		return (memoryInBytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
	};

	/**
	 * Process the GPU data
	 *
	 * @param gpuObject
	 * @return {string}
	 */
	const getGPUOutput = (gpuObject) => {
		let count = 1;

		let output = "<table><tr><th>#</th><th>model</th><th>VRAM</th></tr>";

		if (gpuObject.controllers) {
			gpuObject.controllers.forEach((gpu) => {
				output += `<tr>
                       <td>${count++}</td>
                        <td>${gpu.model}</td>
                        <td>${gpu.vram} MB</td>
                    </tr>`;
			});
		} else {
			output += `<tr>
                       <td>${count++}</td>
                        <td>${gpuObject.name}</td>
                        <td></td>
                    </tr>`;
		}
		output += "</table>";

		return output
	};


	/**
	 * Process the CPU data
	 *
	 * @param cpuObjects
	 * @return {string}
	 */
	const getCPUOutput = (cpuObjects) => {
		let count = 1;
		let cpuList = {};

		cpuObjects.forEach((cpu) => {
			if (!cpuList[cpu.model]) {
				cpuList[cpu.model] = 1;
			} else {
				cpuList[cpu.model]++;
			}
		});

		let output = "<table><tr><th>#</th><th>model</th><th>Virtual Cores</th></tr>";
		Object.keys(cpuList).forEach((key) => {
			output += `<tr><td>${count++}</td><th>${key}</th><th>${cpuList[key]}</th></tr>`
		});
		output += "</table>";

		return output
	};

	return new Promise((resolve) => {
		FSBL.System.getHostSpecs((data) => {
			let innerHtml = `<div><strong><em>OS Type</em></strong>: ${data.name}</div>`;
			innerHtml += `<div><strong><em>OS Version</em></strong>: ${data.osVersion ? data.osVersion : ''}</div>`;
			innerHtml += `<div><strong><em>Architecture</em></strong>: ${data.arch}</div>`;
			innerHtml += `<div><strong><em>Memory</em></strong>: ${(getMemoryValue(data.memory))}</div>`;
			innerHtml += `<div><strong><em>CPUs</em></strong>: ${(getCPUOutput(data.cpus))}</div>`;
			innerHtml += `<div><strong><em>GPUs</em></strong>: ${(getGPUOutput(data.gpu))}</div>`;

			document.getElementById('host-specs').innerHTML = innerHtml;
			setTimeout(() => {
				resolve();
			}, 400);
		});
	});
}
