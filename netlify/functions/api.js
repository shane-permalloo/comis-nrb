const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const data = require('../../backend/mockData');
const { norm, ageFrom, toNrbDate } = require('../../backend/utils');

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID || 'apiTest';
const CLIENT_KEY = process.env.CLIENT_KEY || 'FBE119F2';
const MIN_AGE = Number(process.env.MIN_AGE || 18);
// Set NRB_API_URL to the real NRB endpoint to switch away from mock data
const NRB_API_URL = process.env.NRB_API_URL || '';

const router = express.Router();

// Mock NRB endpoint
router.get('/mock/api/person', (req, res) => {
  const cid = req.header('ClientId');
  const ckey = req.header('ClientKey');
  if (cid !== CLIENT_ID || ckey !== CLIENT_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const person = data.find(x => x.idno === req.query.IDNumber);
  if (!person) return res.status(404).json({ status: 'NOT FOUND' });
  res.json(person);
});

// Member verification endpoint
router.post('/member/verify', async (req, res) => {
  try {
    const { nid, firstname, surname, othernames, gender, dob, useMock } = req.body;

    let r;
    if (!useMock && NRB_API_URL) {
      // Call the real NRB API
      r = await axios.get(NRB_API_URL, {
        params: { IDNumber: nid },
        headers: { ClientId: CLIENT_ID, ClientKey: CLIENT_KEY }
      });
    } else {
      // Fall back to the local mock endpoint
      const baseUrl = process.env.URL || 'http://localhost:8888';
      r = await axios.get(`${baseUrl}/api/mock/api/person`, {
        params: { IDNumber: nid },
        headers: { ClientId: CLIENT_ID, ClientKey: CLIENT_KEY }
      });
    }
    const p = r.data;
    const errors = [];

    switch (p.status) {
      case 'NOT FOUND':
        return res.json({ success: false, errors: ['NID not found'] });
      case 'INVALID':
        return res.json({ success: false, errors: ['Card is no longer valid — it may have been cancelled, reported lost/stolen, replaced, or is in the editing process'] });
      case 'PERSON DECEASED':
        return res.json({ success: false, errors: ['Card belongs to a deceased person and is invalid'] });
      case 'SEE NRB':
        return res.json({ success: false, errors: ['Card has issues that require the holder to resolve with NRB'] });
      case 'RENEWAL PROCESSED':
        return res.json({ success: false, errors: ['Card has expired and renewal has been processed, but the new card has not yet been printed and issued'] });
      case 'EXPIRED':
        return res.json({ success: false, errors: ['Card has expired and no renewal has been processed'] });
      case 'VALID':
        break;
      default:
        return res.json({ success: false, errors: ['Unknown card status: ' + p.status] });
    }

    const hasMismatch =
      norm(firstname) !== norm(p.firstname) ||
      norm(surname) !== norm(p.surname) ||
      norm(gender) !== norm(p.gender) ||
      toNrbDate(dob) !== p.dateofbirth;
    if (hasMismatch) errors.push('The details provided do not match the NRB records for this NID');
    if (ageFrom(p.dateofbirth) < MIN_AGE) errors.push('Minor not allowed');

    if (errors.length) return res.json({ success: false, errors });
    res.json({ success: true, message: 'Identity verified, saving in progress' });
  } catch (e) {
    const status = e.response?.status;
    if (status === 400) return res.json({ success: false, errors: ['Bad request — invalid data sent to NRB'] });
    if (status === 401) return res.json({ success: false, errors: ['Unauthorized — NRB authentication failed'] });
    if (status === 404) return res.json({ success: false, errors: ['NID not found'] });
    if (status === 500) return res.json({ success: false, errors: ['NRB internal server error — try again later'] });
    if (status === 503) return res.json({ success: false, errors: ['NRB service unavailable — try again later'] });
    res.status(500).json({ success: false, errors: ['Verification failed — unexpected error'] });
  }
});

// Mount router at all possible base paths for serverless-http compatibility
// Netlify passes the original request path (/api/...) to the function event,
// not the rewritten path (/.netlify/functions/api/...).
app.use('/api', router);
app.use('/.netlify/functions/api', router);
app.use('/', router);

module.exports.handler = serverless(app);
