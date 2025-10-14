// gen-signature.js
const crypto = require("crypto");

// ⚠️ Điền APP SECRET (ZALO_APP_SECRET) của Mini App
const ZALO_APP_SECRET = "8BLHXTLE5l38LOWi9U7U";

// ⚠️ Điền payload đúng như bạn sẽ gửi vào Postman
const body = {
  "event": "user.revoke.consent",
  "appId": "3894566502630655966",
  "userId": "3712977590518510820",
  "timestamp": 1694140800000
}


// Build content: sort key alphabet rồi nối value
const keys = Object.keys(body).sort(); // ["appId","event","timestamp","userId"]
const content = keys.map((k) => String(body[k])).join("");

// Tạo chữ ký HMAC SHA256
const signature = crypto
  .createHmac("sha256", ZALO_APP_SECRET)
  .update(content)
  .digest("hex");

console.log("Body JSON to use in Postman:");
console.log(JSON.stringify(body, null, 2));
console.log("\nContent used to sign:");
console.log(content);
console.log("\nx-zevent-signature to paste in Postman:");
console.log(signature);
