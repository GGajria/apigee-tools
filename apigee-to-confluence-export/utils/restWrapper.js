var https = require("https");
var proxySet = process.argv.filter(function (e) {
    e == "noproxy";
});
if (proxySet.length > 0) {
    var HttpsProxyAgent = require("https-proxy-agent");
    var proxy = "http://<proxy_user>:<proxy_pass>@<proxy_host>:<proxy_port>";
    var agent = new HttpsProxyAgent(proxy);
}

module.exports = {
    executeRestApiCall: function (host, port, method, path, payload, headers, context, callback)	{
        // console.log("debug:" + method + host + port + path)
        executeInternalRestApiCall(host, port, method, path, payload, headers, context, callback);
    }
};

function executeInternalRestApiCall (host, port, method, path, payload, headers, context, callback) {
    try	{
        var options = {
            hostname: host,
            port: port,
            // agent: agent, //enable this to use the web proxy
            path: path,
            method: method,
            rejectUnauthorized: false,
			/* pfx : pfxFile,
            passphrase : pfxPassword,

            */
            headers: headers
        };
        if (proxySet.length == 0) options.agent = agent;
        // console.log(options)

        https.globalAgent.maxSockets = 100;
        var start = new Date().getTime();
        var req = https.request(options, function (res) {
            res.setEncoding("utf8");
            var body = "";
            res.on("data", function (chunk) {
            body += chunk;
        });
            res.on("end", function () {
            response = { "code": res.statusCode, "payload": body};
            if (method == "DELETE") {
            console.log("debug done:" + method + host + port + path + "----" + (new Date().getTime() - start));
        }

            callback(response, context);
        });
        });

        req.on("error", function (e) {
        	response = { "code": 500, "exception": {"code": "HTTP_ERROR" + e}};
            console.log(" Error :: " + e);
            callback(response);
        });

        req.setTimeout(30000, function () {
        	response = {"code": 500, "exception": {"code": "HTTP_ERROR"}};
        	console.log("debug: timeout error " + method + host + port + path);
        	callback(response);
        });

        if (payload != null) {
        	// console.log(" payload "+payload);
            req.write(JSON.stringify(payload));
        }
        req.end();
    }	catch (e) {
        response = { "code": 500, "exception": {"code": "HTTP_ERROR"}};
        console.log(" Try Catch Error :: " + e + "\n" + e.stack);
        callback(response);
    }
}
