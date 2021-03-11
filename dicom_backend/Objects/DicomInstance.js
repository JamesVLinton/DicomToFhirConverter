const fetch = require('node-fetch');
global.Headers = fetch.Headers;

const btoa = function(str) { return Buffer.from(str, 'latin1').toString('base64'); }

class DicomInstance{
    constructor(instance_id){
        this.instance_id = instance_id
    }

    async _doInitialize() {
        var instance = await this.fetchInstance();

        this.title = this.instance_id;
        this.uid = instance.MainDicomTags.SOPInstanceUID;
        this.number = instance.MainDicomTags.InstanceNumber;
        this.sopClass = {
            "system":"urn:ietf:rfc:3986",
            "code":"urn:oid:1.2.840.10008.5.1.4.1.1.2"
        };

        console.log("instance: " + this.number);
    }

    async _initialize() {
        if (!this.initializationPromise) {
          this.initializationPromise = this._doInitialize();
        }
        return this.initializationPromise;
    }

    async fetchInstance(){
        const patients_url = "http://172.17.0.1:8042/instances/" + this.instance_id;

        var headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa("orthanc:orthanc"));
        return fetch(patients_url, {
            method:'GET',
            headers: headers
        })
        .then(response => response.text())
        .then(response => JSON.parse(response))
    }

    async getInstance() {
        await this._initialize();
        return this;
    }
}

module.exports = DicomInstance;