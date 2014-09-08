/* jshint sub: true */

var Promise = require('promiscuous');
var JSON_TYPE = 'application/json';
var defaults = {
	type: 'get',
	dataType: JSON_TYPE,
	timeout: 0,
};
// promiscuous hack
if (!window.setImmediate) window.setImmediate = window.setTimeout;


module.exports = function(options) {
	if (typeof options == 'string') options = {url: options};

	var xhr = new XMLHttpRequest();
	var abortTimeout;

	var promise = new Promise(function(resolve, reject) {
		options = extend({}, defaults, options, {
			resolve: resolve,
			reject: reject
		});
	});

	if (options.data && !(options.data instanceof FormData)) {
		options.contentType = JSON_TYPE;
		options.data = JSON.stringify(options.data);
	}

	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			clearTimeout(abortTimeout);
			onStatus(xhr, options);
		}
	};

	xhr.open(options.type, options.url, true);
	xhrHeaders(xhr, options);

	if (options.timeout > 0) {
		abortTimeout = setTimeout(onTimeout.bind(null, xhr, options), options.timeout);
	}

	try {
		xhr.send(options.data);
	}
	catch (error) {
		xhr = error;
		onError('Resource not found', xhr, options);
	}

	return promise;
};


var onStatus = function(xhr, options) {
	if (xhr.status >= 200 && xhr.status < 300) {
		onSuccess(xhr, options);
	}
	else onError('ajax: unsuccesful request', xhr, options);
};


var onSuccess = function(xhr, options) {
	var contentType = xhr.getResponseHeader('content-type');

	if (contentType && contentType.indexOf(JSON_TYPE) !== -1) {
		try {xhr.data = JSON.parse(xhr.response);} catch (err) {}
	}
	else xhr.data = xhr.response;

	options.resolve(xhr.data);
};


var onError = function(type, xhr, options) {
	var error = new Error(type);
	error.message = xhr.responseText;
	error.xhr = xhr;
	error.options = options;
	options.reject(error);
};


var xhrHeaders = function(xhr, options) {
	options.headers = options.headers || {};

	if (options.contentType) options.headers['Content-Type'] = options.contentType;
	if (options.dataType) options.headers['Accept'] = options.dataType;

	for (var header in options.headers) {
		xhr.setRequestHeader(header, options.headers[header]);
	}
};


var onTimeout = function(xhr, options) {
	xhr.onreadystatechange = {};
	xhr.abort();
	onError('ajax: timeout exceeded)', xhr, options);
};


function extend() {
	var args = [].slice.apply(arguments);
	var dest = args.shift();
	var source = args.shift();
	var o = 'object';
	var k, val;

	for (k in source) {
		if (source.hasOwnProperty(k)) {
			val = source[k];
			if (dest.hasOwnProperty(k) && typeof dest[k] == o && typeof val == o) {
				extend(dest[k], val);
			}
			else dest[k] = val;
		}
	}

	if (args.length > 0) dest = extend.apply(null, [dest].concat(args));

	return dest;
}
