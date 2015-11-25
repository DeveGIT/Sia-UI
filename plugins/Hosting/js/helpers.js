'use strict';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~ Global Variables ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Ensure precision
BigNumber.config({ DECIMAL_PLACES: 24 });
BigNumber.config({ EXPONENTIAL_AT: 1e+9 });
// Stores api result values
var hosting;
// Tracks of if the view is shown
var updating;
// Host properties array
var hostProperties = [
	{
		'name': 'TotalStorage',
		'descr': 'Total storage',
		'unit': 'GB',
		// GB is 1e9 Bytes
		'conversion': new BigNumber('1e+9'),
	},{
		'name': 'MaxFilesize',
		'descr': 'Maximum filesize',
		'unit': 'MB',
		// MB is 1e6 Bytes
		'conversion': new BigNumber('1e+6'),
	},{
		'name': 'Price',
		'descr': 'Price',
		'unit': 'S per GB/month',
		// Siacoin (1e24) / GB (1e9) / blocks in a 30-day month (4320)
		'conversion': new BigNumber('1e+24').div('1e+9').div(4320),
	},
];

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~ Helper Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Notification shortcut 
function notify(msg, type) {
	IPCRenderer.sendToHost('notify', msg, type);
}

// Ask UI to show tooltip bubble
function tooltip(message, element) {
	var rect = element.getBoundingClientRect();
	IPCRenderer.sendToHost('tooltip', message, {
		top: rect.top,
		bottom: rect.bottom,
		left: rect.left,
		right: rect.right,
		height: rect.height,
		width: rect.width,
		length: rect.length,
	});
}

// IPC API listening shortcut that checks for errors
function addResultListener(channel, callback) {
	IPCRenderer.on(channel, function(event, err, result) {
		if (err) {
			console.error(channel, err);
			notify(err, 'error');
		} else if (callback) {
			callback(result);
		}
	});
}

// Convert to Siacoin
// TODO: Enable commas for large numbers
function convertSiacoin(hastings) {
	var number = new BigNumber(hastings);
	var ConversionFactor = new BigNumber(10).pow(24);
	return number.dividedBy(ConversionFactor).round(2);
}

// Controls data size representation
function formatBytes(bytes) {
	if (bytes === 0) {
		return '0B';
	}
	var k = 1000;
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	var i = Math.floor((Math.log(bytes) + 1) / Math.log(k));
	return (new BigNumber(bytes).div(Math.pow(k, i)).round(2)) + " " + sizes[i];
}

