var DicomInstance = require('./DicomInstance.js');

const fetch = require('node-fetch');
global.Headers = fetch.Headers;

const btoa = function(str) { return Buffer.from(str, 'latin1').toString('base64'); }

class DicomSeries{
    constructor(series_id){
        this.series_id = series_id;
    }

    async _doInitialize() {
        var series = await this.fetchSeries();

        this.uid = series.MainDicomTags.SeriesInstanceUID;
        this.number = series.MainDicomTags.SeriesNumber;
        this.modality = series.MainDicomTags.Modality;

        var instanceIds = series.Instances;

        this.instance = [];
        var instance_promises = [];

        instanceIds.forEach(instanceId => {
            var dicomInstance = new DicomInstance(instanceId)
            instance_promises.push(dicomInstance.getInstance())
            this.instance.push(dicomInstance)
        });

        await Promise.all(instance_promises)
        console.log("series")
    }

    async _initialize() {
        if (!this.initializationPromise) {
          this.initializationPromise = this._doInitialize();
        }
        return this.initializationPromise;
    }

    async fetchSeries(){
        const patients_url = "http://172.17.0.1:8042/series/" + this.series_id;

        var headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa("orthanc:orthanc"));
        return fetch(patients_url, {
            method:'GET',
            headers: headers
        })
        .then(response => response.text())
        .then(response => JSON.parse(response))
    }

    async getSeries() {
        await this._initialize();
        return this;
    }
}

module.exports = DicomSeries;