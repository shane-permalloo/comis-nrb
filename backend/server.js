const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const data = require('./mockData');
const { norm, ageFrom, toNrbDate } = require('./utils');

const app = express();
app.use(cors());
app.use(express.json());

// Mock NRB endpoint
app.get('/mock/api/person', (req, res) => {
  const cid = req.header('ClientId');
  const ckey = req.header('ClientKey');
  if (cid !== process.env.CLIENT_ID || ckey !== process.env.CLIENT_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const person = data.find(x => x.idno === req.query.IDNumber);
  if (!person) return res.status(404).json({ status: 'NOT FOUND' });
  res.json(person);
});

// Member verification endpoint
app.post('/api/member/verify', async (req, res) => {
  try {
    const { nid, firstname, surname, othernames, gender, dob, useMock } = req.body;

    // When useMock is false and NRB_API_URL is set, call the real NRB API; otherwise use the mock
    const nrbUrl = (!useMock && process.env.NRB_API_URL) ? process.env.NRB_API_URL : process.env.MOCK_NRB_URL;
    const r = await axios.get(nrbUrl, {
      params: { IDNumber: nid },
      headers: { ClientId: process.env.CLIENT_ID, ClientKey: process.env.CLIENT_KEY }
    });
    const p = r.data;
    const errors = [];

    // Status-based validation per NRB spec
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

    // Field-level checks (only for VALID status)
    const hasMismatch =
      norm(firstname) !== norm(p.firstname) ||
      norm(surname) !== norm(p.surname) ||
      norm(gender) !== norm(p.gender) ||
      toNrbDate(dob) !== p.dateofbirth;
    if (hasMismatch) errors.push('The details provided do not match the NRB records for this NID');
    if (ageFrom(p.dateofbirth) < Number(process.env.MIN_AGE)) errors.push('Minor not allowed');

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

app.listen(process.env.PORT, () => console.log('Running on ' + process.env.PORT));
