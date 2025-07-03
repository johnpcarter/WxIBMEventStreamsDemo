const formx = document.querySelector("#userinfo");

minTemp = 10;
maxTemp = 30;
ws = null;
rowCount = 0;

async function sendData(formData, url, callback) {
  
  try {
	const response = await fetch(url, {
	  method: "POST",
	  headers: {
		  "Content-Type": "application/x-www-form-urlencoded",
		  "Accept": "application/json"

	  },
	  body: formData
	});
	callback(await response.json());
  } catch (e) {
	console.error(e);
  }
}

function updateProducerResults(response) {
					  
	numElement = document.getElementById("producerCount");
							
	num = Number(numElement.innerHTML) + response.produced.length;
	numElement.innerHTML = num;
		
	response.produced.forEach(e => {
		appendToProducerTable(e.seq, e.temperature.deviceId, e.temperature.temperature);
		
		// scroll to bottom
		
		var producerScrollDiv = document.getElementById("producerResults");
		producerScrollDiv.scrollTop = producerScrollDiv.scrollHeight;
	});
		
	if (producerButton.value === 'Stop producing') {
		setTimeout(function() {
				
			sendDataWithCheck(BuildProducerFormData(producerForm), submitUrl, updateProducerResults);
				
		}, 1000);
	}
}

function appendToProducerTable(offset, deviceId, temperature) {
	row = cloneRow("producerTable", "producerTableRow");
	
	deviceElement = row.querySelector('[name="deviceId"]');
	tempElement = row.querySelector('[name="temperature"]');
	
	deviceElement.innerHTML = deviceId;
	tempElement.innerHTML = temperature + "°c";
	
	updateBackgroundColorForDevice(deviceElement, deviceId);
	
	if (deviceId === "D-001") {
		deviceElement.style.backgroundImage = "url('images/pixel_blue.gif')";
	} else if (deviceId === "D-002") {
		deviceElement.style.backgroundImage = "url('images/pixel_brown.gif')";
	} else if (deviceId === "D-003") {
		deviceElement.style.backgroundImage = "url('images/pixel_orange.gif')";
	} else {
		deviceElement.style.backgroundImage = "url('images/pixel_red.gif')"
	}
}
   
function startConsuming() {

	ws = new WebSocket(wsSocket);	
	
	ws.onopen = function(event) {
		
		// do nothing
		
		console.log("connected successfully to " + wsSocket);
	};
	
	ws.onmessage = function(event) {
		
		// received temperatures
				
		updateConsumerGraph(JSON.parse(event.data));
	};
	
	ws.onerror = function(event) {
		
		console.log("error from " + wsSocket);
	};
	
	ws.onclose = function(event) {
		
		console.log("closed connectio to " +  + wsSocket);
	};
}

function stopConsuming() {

	if (ws != null) {
		ws.close();
		ws = null;
	}	
	
	setCounter("consumerCount", 0);
	setCounter("consumerTotalCount", 0)
	setCounter("d001_count", 0);
	setCounter("d002_count", 0);
	setCounter("d003_count", 0);
	setCounter("other_count", 0);
}


// Take over form submission
function overrideProducerForm(form, url, callback) {
	  
	form.addEventListener("submit", (event) => {
    	event.preventDefault();
    	sendData(BuildProducerFormData(form), url, callback);
	});
}

function BuildProducerFormData(form) {
	
	minTemp = form.elements['minTemp'].value;
	maxTemp = form.elements['maxTemp'].value;
	
	return new URLSearchParams({
		  'minTemp': minTemp,
		  'maxTemp': maxTemp,
		  'numDevices': form.elements['numDevices'].value,
		  'status': form.elements['status'].value
	 })
}

function updateConsumerGraph(event) {
	
	newTimeSlot = cloneDiv("timeSlot");

	timeLabel = newTimeSlot.querySelector('[name="timeLabel"]');
	timeLabel.innerHTML = event.timeSlot;
	
	event.temperatures.forEach(e => {
		addTemperatureBar(newTimeSlot, e);
	});
	
	incrementCounter("consumerCount", 1);
}

function addTemperatureBar(newTimeSlot, temperature) {
	
	deviceId = temperature.deviceId;
	avg = temperature.averageTemperature;
	min = temperature.minTemperature;
	max = temperature.maxTemperature;
	count = temperature.total;
	
	timeDiv = newTimeSlot.querySelector('[name="temperature"]');
	newTimeDiv = timeDiv.cloneNode(true);
	timeDiv.parentElement.appendChild(newTimeDiv);
	
	temperatureValue = newTimeDiv.querySelector('[name="temperatureValue"]');
	temperatureGraph = newTimeDiv.querySelector('[name="temperatureGraph"]');
	
	temperatureValue.innerHTML = Number(avg).toFixed(2);
	temperatureGraph.height = Number(avg) * (200/(maxTemp-minTemp));
	
	updateBackgroundColorForDevice(temperatureGraph, deviceId, count);
	
	incrementCounter("consumerTotalCount", count);

	// scroll to bottom
	
	var consumerScrollDiv = document.getElementById("consumerResults");
	consumerScrollDiv.scrollLeft = consumerScrollDiv.scrollWidth;
}

function updateBackgroundColorForDevice(divElement, deviceId, count) {

	if (deviceId === "D-001") {
		divElement.src = "images/pixel_blue.gif";
		
		if (count != null)
			incrementCounter("d001_count", count);
	} else if (deviceId === "D-002") {
		divElement.src = "images/pixel_brown.gif";
		
		if (count != null)
			incrementCounter("d002_count", count);
	} else if (deviceId === "D-003") {
		divElement.src = "images/pixel_orange.gif";
		
		if (count != null)
			incrementCounter("d003_count", count);
	} else {
		divElement.src = "images/pixel_red.gif";
		
		if (count != null)
			incrementCounter("other_count", count);
	}	
}

function setCounter(identifier, count) {
	
	var div = document.getElementById(identifier);	
	div.innerHTML = count;
}

function incrementCounter(identifier, count) {
	
	var div = document.getElementById(identifier);
	var value = Number(div.innerHTML);
	
	div.innerHTML = value + Number(count);
}

function cloneDiv(divId) {

  var div = document.getElementById(divId);  
  var clone = div.cloneNode(true); // copy children too	
  
  div.parentElement.appendChild(clone);
  
  return clone;
}

function cloneRow(tableId, tableRowId) {

  var table = document.getElementById(tableId); // find table to append to  
  var row = document.getElementById(tableRowId); // find row to copy
  
  var clone = row.cloneNode(true); // copy children too
  clone.id = "e" + rowCount++; // change id or other attributes/contents
  
  table.appendChild(clone); // add new row to end of table
  return clone;
}