var ImageSeries = require('./ImageSeries.js');

class ImageStudy{
    constructor(dicomStudy){
        this.id = dicomStudy.study_id;
        this.resourceType = "ImagingStudy";
        this.identifier = dicomStudy.identifier;
        this.status = dicomStudy.status;
        this.subject = dicomStudy.subject;
        this.series = [];
        dicomStudy.series.forEach(dicomSeries => {
            this.series.push(new ImageSeries(dicomSeries));
        });
    }
}


module.exports = ImageStudy;