const express = require('express');
const fetch = require('node-fetch');
const DicomPatientObject = require('./Objects/DicomPatientObject.js');
const ImageStudy = require('./Objects/ImageStudy.js');

global.Headers = fetch.Headers;

const btoa = function(str) { return Buffer.from(str, 'latin1').toString('base64'); }

var app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/getDicomPatientObject', async function (req, res) {
    var patient = new DicomPatientObject(req.query.patient_id);
    await patient.getPatient();
    
    res.send(patient);
})

app.get('/getFHIRImageStudies', async function (req, res) {
    var patient = new DicomPatientObject(req.query.dicom_patient_id, req.query.fhir_patient_id);
    await patient.getPatient();

    var imageStudies = [];

    //Converts to FHIR ImageStudies from DICOM patient Object
    patient.studies.forEach(dicomStudy => {
        imageStudies.push(new ImageStudy(dicomStudy));
    });
    
    res.send(imageStudies);
})

app.get('/getInstanceImage', async function (req, res) {
    res.set({
        'Content-Type': 'image/png'
    });

    var instance_id = req.query.instance_id;

    const instance_url = "http://172.17.0.1:8042/instances/" + instance_id + "/preview";

    var headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa("orthanc:orthanc"));
    return fetch(instance_url, {
        method:'GET',
        headers: headers
    })
    .then(resp=>resp.blob())
    .then(resp => {
        resp.arrayBuffer().then((buf) => {
            res.send(Buffer.from(buf))
        })
    });
});

app.listen(8081, function () {
     console.log('App listening on port 8081');
})