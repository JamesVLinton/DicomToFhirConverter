class ImageInstance{
    constructor(dicomInstance){
        this.title = dicomInstance.title
        this.uid = dicomInstance.uid;
        this.number = dicomInstance.number;
        this.sopClass = dicomInstance.sopClass;
    }
}

module.exports = ImageInstance;