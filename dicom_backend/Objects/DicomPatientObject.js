const DicomStudy = require('./DicomStudy.js');

const fetch = require('node-fetch');
global.Headers = fetch.Headers;

const btoa = function(str) { return Buffer.from(str, 'latin1').toString('base64'); }

class DicomPatientObject{
    constructor(dicom_patient_id, fhir_patient_id){
        this.dicom_patient_id = dicom_patient_id;
        this.fhir_patient_id = fhir_patient_id;
    }

    async _doInitialize() {
        var studyIds = await this.fetchStudies();

        this.studies = [];
        var study_promises = [];

        studyIds.forEach(async studyId => {
            var dicomStudy = new DicomStudy(studyId, this.fhir_patient_id);
            study_promises.push(dicomStudy.getStudy());
            this.studies.push(dicomStudy);
        });

        await Promise.all(study_promises);
        console.log("patient");
    }

    async _initialize() {
        if (!this.initializationPromise) {
          this.initializationPromise = this._doInitialize();
        }
        return this.initializationPromise;
    }

    async fetchStudies(){
        const patients_url = "http://172.17.0.1:8042/patients/" + this.dicom_patient_id;

        var headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa("orthanc:orthanc"));
        return fetch(patients_url, {
            method:'GET',
            headers: headers
        })
        .then(response => response.text())
        .then(response => JSON.parse(response).Studies)
    }

    async getPatient() {
        await this._initialize();
        return this;
    }
}

module.exports = DicomPatientObject;
