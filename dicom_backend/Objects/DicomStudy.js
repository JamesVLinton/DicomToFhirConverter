var DicomSeries = require('./DicomSeries.js');

const fetch = require('node-fetch');
const { response } = require('express');
global.Headers = fetch.Headers;

const btoa = function(str) { return Buffer.from(str, 'latin1').toString('base64'); }

class DicomStudy{
    constructor(study_id, fhir_patient_id){
        this.study_id = study_id;
        this.fhir_patient_id = fhir_patient_id;
    }

    async _doInitialize() {
        var series = await this.fetchStudies();

        this.status = "available";
        this.subject = {
            "type":"Patient/dicom",
            "reference": "Patient/" + this.fhir_patient_id
        };
        this.identifier = [{
            "system": "urn:dicom:uid",
            "value": "urn:oid:" + series.MainDicomTags.StudyInstanceUID
        }];

        var seriesIds = series.Series;

        this.series = [];
        var series_promises = [];

        seriesIds.forEach(seriesId => {
            var dicomSeries = new DicomSeries(seriesId);
            series_promises.push(dicomSeries.getSeries());
            this.series.push(dicomSeries);
        });

        await Promise.all(series_promises);
        console.log("study");
    }

    async _initialize() {
        if (!this.initializationPromise) {
          this.initializationPromise = this._doInitialize();
        }
        return this.initializationPromise;
    }

    async fetchStudies(){
        const patients_url = "http://172.17.0.1:8042/studies/" + this.study_id;

        var headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa("orthanc:orthanc"));
        return fetch(patients_url, {
            method:'GET',
            headers: headers
        })
        .then(response => response.text())
        .then(response => JSON.parse(response))
    }

    async getStudy() {
        await this._initialize();
        return this;
    }
}

module.exports = DicomStudy;