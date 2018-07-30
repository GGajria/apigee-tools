var mbaasResponse = context.getVariable("flow.validation.response.content");

if (!mbaasResponse){
    setError("503", "05", "Service temporarily unavailable", "internal_error");
}

var payload = mbaasResponse;
payload = JSON.parse(payload);
if (payload.code == "invalid_token"){
    setError("401", "401", "Invalid credentials", "invalid_token");
}

var scope = payload.scope; //white space delimited
var userId = payload.userId;
var deviceId = payload.serviceData.deviceId;
var backendClientId = payload.audience; //api key

// now validate the scope stuff
// extract from base path and check against scope

// validate deviceId header matches against deviceId
var requestDeviceId = context.getVariable("request.header.deviceId");
var clientId = context.getVariable("request.header.Client-Id");
var basePath = context.getVariable("proxy.basepath").replace("/","");

if (clientId != backendClientId ) {  // or invalid client id
    setError("403", "403", "Forbidden user", "invalid_clientid");
}
if (requestDeviceId != deviceId ) {  // or invalid udid
    setError("403", "403", "Forbidden user", "invalid_udid");
}

var scopeArr = scope.split(" ");
if (scopeArr.indexOf(basePath) == -1){ // or invalid scope
    setError("403", "403", "Access denied", "invalid_scope");
}

context.setVariable("validate-token.userId", userId); // extract the userId fom MBaaS

function setError(statusCode, code, message, reason) {
    context.setVariable("validate-token.error.status", "true");
    context.setVariable("validate-token.error.status-code", statusCode);
    context.setVariable("validate-token.error.code", code);
    context.setVariable("validate-token.error.message", message);
    context.setVariable("validate-token.error.reason", reason);
    context.setVariable("validate-token.error.payload", JSON.stringify({code: code, message: message}));
}
