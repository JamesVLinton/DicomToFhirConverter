var ImageInstance = require('./ImageInstance.js');

class ImageSeries{
    constructor(dicomSeries){
        this.uid = dicomSeries.uid;
        this.number = dicomSeries.number;
        this.modality = dicomSeries.modality;
        this.instance = [];
        dicomSeries.instance.forEach(dicomInstance => {
            this.instance.push(new ImageInstance(dicomInstance));
        });
    }
}

module.exports = ImageSeries;