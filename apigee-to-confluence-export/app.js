var restWrapper = require("./utils/restWrapper.js");

/**
 * Usage
 * node app.js <ORG> <APIGEE_USERNAME> <APIGEE_PASSWORD> <WIKI_USERNAME> <WIKI_PASSWORD> <WIKI_APPS_PAGE_ID> [noproxy]
 */

/**
 * Management API Details
 */
var APIGEE_HOST = "api.enterprise.apigee.com";
var APIGEE_PORT = 443;
var ORG = process.argv[2] || "org"; // 'org'
var APIGEE_USERNAME = process.argv[3] || "apigee@example.com";// apigee username
var APIGEE_PASSWORD = process.argv[4] || "password";// password

/**
 * Wiki Details
 */
var WIKI_USERNAME = process.argv[5] || "wiki.user.name";
var WIKI_PASSWORD = process.argv[6] || "wiki.password";

/**
 * Wiki Page Details
 */
var WIKI_APPS_PAGE_ID = process.argv[7] || "52364457";// '52364460'
var WIKI_APPS_PAGE_TITLE = "APIGEE Artifact Details - Developers, Apps, Products & Proxies" + (ORG == "prod" ? " (PRODUCTION) " : "");// 'APIGEE Artifact Details - Developers, Apps, Products & Proxies'

var headers = {
    "Accept": "application/json",
    "Authorization": "Basic " + new Buffer(APIGEE_USERNAME + ":" + APIGEE_PASSWORD).toString("base64")
};

var GBL_APPS_LIST = [];
var GBL_PRDS_LIST = [];

// all devs
restWrapper.executeRestApiCall(APIGEE_HOST, APIGEE_PORT, "GET", "/v1/o/" + ORG + "/developers?expand=true", null, headers, null,
function (res) {
    if (res.code > 205) {
        console.log("Error with developers: ", res.code);
        return;
    }
    var developers = JSON.parse(res.payload);
    console.log("found " + developers.developer.length + " developers");

    var devs = processDevelopers(developers);

    // all apps
    restWrapper.executeRestApiCall(APIGEE_HOST, APIGEE_PORT, "GET", "/v1/o/" + ORG + "/apps?expand=true", null, headers, null,
    function (res) {
        if (res.code > 205) {
            console.log("Error with apps: ", res.code);
            return;
        }
        var apps = JSON.parse(res.payload);
        console.log("found " + apps.app.length + " apps");
        var appsDetails = processApps(apps);

        // all products
        restWrapper.executeRestApiCall(APIGEE_HOST, APIGEE_PORT, "GET", "/v1/o/" + ORG + "/apiproducts?expand=true", null, headers, null,
        function (res) {
            if (res.code > 205) {
                console.log("Error with products: ", res.code);
                return;
            }
            var products = JSON.parse(res.payload);
            console.log("found " + products.apiProduct.length + " products");

            var productsDetails = processProducts(products);

                // console.log(JSON.stringify(devs))
            devs = devs.sort(function (a, b) {
                return a.email.toLowerCase() > b.email.toLowerCase();
            });

            var finalStr = "<h1>A total of <em>".concat(developers.developer.length.toString(), " </em> developers, ");
            finalStr += "<em>".concat(apps.app.length.toString(), " </em> apps and ");
            finalStr += "<em>".concat(products.apiProduct.length.toString(), " </em> products</h1> <br />");

            finalStr += "<table><colgroup><col /><col /><col /><col /><col /></colgroup><tbody>" +
                "<tr><th>SI</th><th>Developer</th><th>Apps</th><th>Products</th><th>Proxies</th></tr>";
            for (var d = 0; d < devs.length; d++) {
                    // console.log(devs[d].email, ' ' , devs[d].apps)

                    // devs[d].email
                var subApps = [];
                var subProducts = [];
                for (a = 0; a < devs[d].apps.length; a++) {
                        // console.log(devs[d].apps)
                    var matchedApp = appsDetails.filter(function (app) {
                        return app.name == devs[d].apps[a];
                    });
                    if (matchedApp.length > 0) {
                        subApps.push(matchedApp[0]);
                        for (p = 0; p < matchedApp[0].products.length; p++) {
                            var matchedProduct = productsDetails.filter(function (product) {
                                    return product.name == matchedApp[0].products[p];
                                });
                            if (matchedProduct.length > 0) {
                                    subProducts.push(matchedProduct[0]);
                                }
                        }
                    }
                }
                    // var abc = renderHtml(devs[d], subApps, subProducts)
                finalStr += renderHtml(d, devs[d], subApps, subProducts);
                    // console.log('PER ROW', devs[d].email, '==> ', abc, '\n')
            }
            finalStr += "</tbody></table>";

            getPageVersion(WIKI_APPS_PAGE_ID, function (err, res) {
                var payload = {
                    "id": WIKI_APPS_PAGE_ID,
                    "title": WIKI_APPS_PAGE_TITLE,
                    "type": "page",
                    "space": {"key": "key"},
                    "body": {
                        "storage": {
                            "value": finalStr,
                            "representation": "storage"
                        }
                    },
                    "version": {"number": res + 1}
                };

                console.log(payload);

                var wikiAppPutheaders = {
                    "Content-Type": "application/json",
                    "Authorization": "Basic " + new Buffer(WIKI_USERNAME + ":" + WIKI_PASSWORD).toString("base64")
                };

                restWrapper.executeRestApiCall("wiki.intdigital.ee.co.uk", "443", "PUT", "/rest/api/content/" + WIKI_APPS_PAGE_ID, payload, wikiAppPutheaders, null,
                    function (res) {
                        if (res.code > 205) {
                            console.log("Error: ", res);
                            return;
                        }
                        console.log("Done!!");
                    });
            });
        });
    });
});

function processProducts (products) {
    var productDetails = [];

    for (var p = 0; p < products.apiProduct.length; p++) {
        var product = {};
        product.name = products.apiProduct[p].name;
        product.resources = products.apiProduct[p].apiResources;
        product.proxies = products.apiProduct[p].proxies;
        productDetails.push(product);
    }
    return productDetails;
}

function processDevelopers (devs) {
    var devDetails = [];
    for (var i = 0; i < devs.developer.length; i++) {
        var dev = {};
        var devDetail = devs.developer[i];
        dev.email = devDetail.email;
        dev.apps = [];
        for (var a = 0; a < devDetail.apps.length; a++) {
            var eachApp = devDetail.apps[a];
            dev.apps.push(eachApp);
            if (GBL_APPS_LIST.indexOf(eachApp) < 0) {
                GBL_APPS_LIST.push(eachApp);
            }
        }
        devDetails.push(dev);
    }
    return devDetails;
}

function processApps (apps) {
    var appsDetails = [];
    for (var i = 0; i < apps.app.length; i++) {
        var nextApp = {};
        var app = apps.app[i];
        var displayName = app.attributes.filter(function (e) {
            return e.name == "DisplayName";
        });
        var appName = "";
        if (displayName && displayName[0]) {
            appName = displayName[0].value;
        }
        var products = "";

        /* if (app.credentials && app.credentials[0]){
            var credentials = app.credentials[0]
            clientId = credentials.consumerKey
            clientSecret = credentials.consumerSecret
            nextApp.products = []
            for (var p = 0; p < credentials.apiProducts.length; p++ ){
                var ps = credentials.apiProducts[p]
                //products += ','+ps.apiproduct
                nextApp.products.push(ps.apiproduct)
                if (GBL_PRDS_LIST.indexOf(ps.apiproduct) < 0){
                    GBL_PRDS_LIST.push(ps.apiproduct)
                }
            }
            products = products.length>0?products.substring(1,products.length):products
        } */
        nextApp.credentials = [];
        for (var j = 0; app.credentials && j < app.credentials.length; j++) {
            var credentials = app.credentials[j];
            var clientId = credentials.consumerKey;
            var clientSecret = credentials.consumerSecret;
            nextApp.products = [];
            for (var p = 0; p < credentials.apiProducts.length; p++) {
                var ps = credentials.apiProducts[p];
                // products += ','+ps.apiproduct
                nextApp.products.push(ps.apiproduct);
                if (GBL_PRDS_LIST.indexOf(ps.apiproduct) < 0) {
                    GBL_PRDS_LIST.push(ps.apiproduct);
                }
            }
            nextApp.credentials.push({clientId: clientId, clientSecret: clientSecret});
            products = products.length > 0 ? products.substring(1, products.length) : products;
        }

        var regExp = new RegExp("[\{\}<>\\\/\(\)]");

        nextApp.name = apps.app[i].name;// regExp.test(appName)?apps.app[i].appId:appName
        nextApp.id = apps.app[i].appId;
        nextApp.clientId = clientId;
        nextApp.clientSecret = clientSecret;
        appsDetails.push(nextApp);
    }
    return appsDetails;
}

function getPageVersion (pageId, callback) {
    var wikiAppGetHeaders = {
        "Authorization": "Basic " + new Buffer(WIKI_USERNAME + ":" + WIKI_PASSWORD).toString("base64")
    };

    restWrapper.executeRestApiCall("wiki.mycompany.com", "443", "GET", "/rest/api/content/" + WIKI_APPS_PAGE_ID, null, wikiAppGetHeaders, null,
    function (res) {
        if (res.code > 205) {
            console.log("Error: ", res.code);

            return callback(res);
        }
        var wiki = JSON.parse(res.payload);
        console.log("found version " + wiki.version.number);
        return callback(null, wiki.version.number);
    });
}

function convertAppsToHtml (appObj) {
    var finalStr = "<h1>Developer Apps</h1> <br />";
    finalStr += "<table><colgroup><col /><col /><col /><col /></colgroup><tbody>" +
                "<tr><th>App</th><th>Client ID</th><th>Client Secret</th><th>Products</th></tr>";

    for (var apps in appObj) {
        var app = appObj[apps];
        finalStr += "<tr>";
        finalStr += "<td>" + app.name.replace(/['/\\<>{}()"]/g, "") + "</td>";
        finalStr += "<td>" + (app.clientId ? app.clientId.substring(0, 4) + "****" : app.clientId) + "</td>";
        finalStr += "<td>" + (app.clientSecret ? app.clientSecret.substring(0, 4) + "****" : app.clientSecret) + "</td>";
        finalStr += "<td>" + (app.products.join("<br />")) + "</td>";
        finalStr += "</tr>";
    }

    return finalStr += "</tbody></table>";
}

function renderHtml (i, dev, apps, products) {
    var finalStr = "\n<tr><td>" + (++i) + "</td><td>" + dev.email + "</td>";
    var appStr = "<td>";
    for (var a in apps) {
        var app = apps[a];
        for (var b in app.credentials) {
            var credentials = app.credentials[b];
            appStr += (b > 0 ? "[" + b + "] " + app.name : app.name) + " (" + credentials.clientId.substring(0, 4) + "****) (" + credentials.clientSecret.substring(0, 4) + "****)<br />";
        }
    }
    appStr += "</td>";
    var fProducts = [];
    var proxies = [];
    for (var product in products) {
        if (fProducts.indexOf(products[product].name) < 0) {
            fProducts.push(products[product].name);
        }
        for (i = 0; i < products[product].proxies.length; i++) {
            var proxy = products[product].proxies[i];
            if (proxies.indexOf(proxy) < 0) {
                proxies.push(proxy);
            }
        }
    }
    var proxyStr = "<td>" + proxies.join("<br />") + "</td>";
    var productStr = "<td>" + fProducts.join("<br />") + "</td>";
    return finalStr += appStr + productStr + proxyStr + "</tr>";
}
