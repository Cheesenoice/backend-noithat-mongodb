const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const momoConfig = {
  partnerCode: 'MOMO',
  accessKey: 'F8BBA842ECF85',
  secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  requestType: 'captureWallet',
  redirectUrl: 'http://localhost:3000/momo_return',
  ipnUrl: 'http://localhost:3000/momo_ipn', // optional
};

module.exports = momoConfig;