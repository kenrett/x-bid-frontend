var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
var DEFAULT_API_BASE_URL = "https://api.biddersweet.app";
var toOrigin = function (value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch (_a) {
    return null;
  }
};
var toWsOrigin = function (value) {
  if (!value) return null;
  try {
    var parsed = new URL(value);
    if (parsed.protocol === "ws:" || parsed.protocol === "wss:") {
      return parsed.origin;
    }
    var protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return "".concat(protocol, "//").concat(parsed.host);
  } catch (_a) {
    return null;
  }
};
var uniq = function (values) {
  var seen = new Set();
  var out = [];
  for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
    var value = values_1[_i];
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
};
var serialize = function (directives) {
  return directives
    .map(function (_a) {
      var name = _a[0],
        values = _a[1];
      return "".concat(name, " ").concat(values.join(" "));
    })
    .join("; ");
};
export var getCsp = function (_a) {
  var _b, _c;
  var env = _a.env,
    apiBaseUrl = _a.apiBaseUrl,
    cableUrl = _a.cableUrl;
  var apiOrigin =
    (_b = toOrigin(
      apiBaseUrl && apiBaseUrl.trim() ? apiBaseUrl : undefined,
    )) !== null && _b !== void 0
      ? _b
      : DEFAULT_API_BASE_URL;
  var wsOrigin =
    (_c = toWsOrigin(cableUrl && cableUrl.trim() ? cableUrl : undefined)) !==
      null && _c !== void 0
      ? _c
      : toWsOrigin(apiOrigin);
  var devConnectSrc = [
    "http://localhost:*",
    "ws://localhost:*",
    "http://127.0.0.1:*",
    "ws://127.0.0.1:*",
  ];
  var devImgSrc = ["http://localhost:*", "http://127.0.0.1:*"];
  var connectSrc = uniq(
    __spreadArray(
      [
        "'self'",
        apiOrigin,
        wsOrigin,
        "https://api.stripe.com",
        "https://m.stripe.network",
        "https://hooks.stripe.com",
        "https://cloudflareinsights.com",
      ],
      env === "development" ? devConnectSrc : [],
      true,
    ),
  );
  var imgSrc = uniq(
    __spreadArray(
      ["'self'", "data:", "blob:", apiOrigin, "https://robohash.org"],
      env === "development" ? devImgSrc : [],
      true,
    ),
  );
  var scriptSrc = uniq(
    __spreadArray(
      [
        "'self'",
        "https://js.stripe.com",
        "https://static.cloudflareinsights.com",
      ],
      env === "development" ? ["'unsafe-inline'", "'unsafe-eval'"] : [],
      true,
    ),
  );
  var styleSrc = uniq(
    __spreadArray(
      ["'self'"],
      env === "development" ? ["'unsafe-inline'"] : [],
      true,
    ),
  );
  return serialize([
    ["default-src", ["'self'"]],
    ["script-src", scriptSrc],
    ["script-src-elem", scriptSrc],
    ["style-src", styleSrc],
    ["connect-src", connectSrc],
    ["img-src", imgSrc],
    [
      "frame-src",
      [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com",
        "https://checkout.stripe.com",
      ],
    ],
    ["frame-ancestors", ["'none'"]],
    ["base-uri", ["'none'"]],
    ["form-action", ["'self'"]],
  ]);
};
