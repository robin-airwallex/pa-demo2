const axios = require("axios");
const fs = require("fs");

const setToken = (tok, exp) => {
  const token = { token: tok, expires_at: exp };
  fs.writeFile("tokenVal.json", JSON.stringify(token), (err) => {
    if (err) throw err;

    console.log("Saved!!");
  });
};

const generateToken = async () => {
  return await axios
    .request({
      url: "https://api-demo.airwallex.com/api/v1/authentication/login",
      method: "post",
      headers: {
        "x-api-key":
          "7feded224fbf75ce79c05b39c0ba70d4b3c9a851f0ef89ecef82f6b4e90099353869a7120cf0ad4019a313dd15d0deb2",
        "x-client-id": "PDCAp2djSYOB7jKpxbKEuQ",
      },
    })
    .then(({ data }) => {
      return { token: data.token, expires_at: data.expires_at };
    });
};

module.exports = {
  setToken,
  generateToken,
};
