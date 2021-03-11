//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

//create a fhir client based on the sandbox enviroment and test paitnet.
const client = new FHIR.client({
    serverUrl: "https://r4.smarthealthit.org",
    tokenResponse: {
      patient: "579423cd-3384-4e7d-bf19-295a26d27524"
    }
  });
  
  function formatAnnotation(note){
    return "Time: " + note.time + "/ Author:" + note.authorString + "/ Note:" + note.text
  }
  // helper function to process fhir resource to get the patient name.
  function getPatientName(pt) {
    if (pt.name) {
      var names = pt.name.map(function(name) {
        return name.given.join(" ") + " " + name.family;
      });
      return names.join(" / ")
    } else {
      return "anonymous";
    }
  }
  
  // display the patient name gender and dob in the index page
  function displayPatient(pt) {
    document.getElementById('patient_name').innerHTML = getPatientName(pt);
    document.getElementById('gender').innerHTML = pt.gender;
    document.getElementById('dob').innerHTML = pt.birthDate;
  }
  
  //function to display list of medications
  function displayMedication(meds) {
    med_list.innerHTML += "<li> " + meds + "</li>";
  }
  
  //helper function to get quanity and unit from an observation resoruce.
  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
      typeof ob.valueQuantity != 'undefined' &&
      typeof ob.valueQuantity.value != 'undefined' &&
      typeof ob.valueQuantity.unit != 'undefined') {
      return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }
  
  // helper function to get both systolic and diastolic bp
  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation) {
      var BP = observation.component.find(function(component) {
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });
  
    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }
  
  // create a patient object to initalize the patient
  function defaultPatient() {
    return {
      height: {
        value: ''
      },
      weight: {
        value: ''
      },
      sys: {
        value: ''
      },
      dia: {
        value: ''
      },
      ldl: {
        value: ''
      },
      hdl: {
        value: ''
      },
      note: 'No Annotation'
    };
  }
  
  //helper function to display the annotation on the index page
  function displayAnnotation(annotation) {
    note.innerHTML = annotation;
  }
  
  //function to display the observation values you will need to update this
  function displayObservation(obs) {
    hdl.innerHTML = obs.hdl;
    ldl.innerHTML = obs.ldl;
    sys.innerHTML = obs.sys;
    dia.innerHTML = obs.dia;
    height.innerHTML = obs.height;
    weight.innerHTML = obs.weight;
  }
  
  // get patient object and then display its demographics info in the banner
  client.request(`Patient/${client.patient.id}`).then(
    function(patient) {
      displayPatient(patient);
      console.log(patient.ImagingStudy);
    }
  );
  
  // get observation resoruce values
  // you will need to update the below to retrive the weight and height values
  var query = new URLSearchParams();
  
  query.set("patient", client.patient.id);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|8462-4',
    'http://loinc.org|8480-6',
    'http://loinc.org|2085-9',
    'http://loinc.org|2089-1',
    'http://loinc.org|55284-4',
    'http://loinc.org|3141-9',
    'http://loinc.org|8302-2',
    'http://loinc.org|29463-7'
  ].join(","));
  
  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {
  
      // group all of the observation resoruces by type into their own
      var byCodes = client.byCodes(ob, 'code');
      var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
      var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
      var hdl = byCodes('2085-9');
      var ldl = byCodes('2089-1');
      var height = byCodes('8302-2');
      var weight = byCodes('29463-7');
  
      // create patient object
      var p = defaultPatient();
  
      // set patient value parameters to the data pulled from the observation resoruce
      if (typeof systolicbp != 'undefined') {
        p.sys = systolicbp;
      } else {
        p.sys = 'undefined'
      }
  
      if (typeof diastolicbp != 'undefined') {
        p.dia = diastolicbp;
      } else {
        p.dia = 'undefined'
      }
  
      p.hdl = getQuantityValueAndUnit(hdl[0]);
      p.ldl = getQuantityValueAndUnit(ldl[0]);
      p.height = getQuantityValueAndUnit(height[0]);
      p.weight = getQuantityValueAndUnit(weight[0]);
  
      console.log(p)
  
      displayObservation(p)
      displayAnnotation(formatAnnotation(weight[0].note[0]));
    });
  
  var medication_query = new URLSearchParams();
    medication_query.set("patient", client.patient.id);
    
  
  client.request("MedicationRequest?" + medication_query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(med_list) {  
      console.log(med_list);
      med_list.forEach(function(med) { 
        if(med.status === 'stopped' || med.status === 'active'){
          displayMedication(med.medicationCodeableConcept.text);
        }
      })
    });
  
  //update function to take in text input from the app and add the note for the latest weight observation annotation
  //you should include text and the author can be set to anything of your choice. keep in mind that this data will
  // be posted to a public sandbox
  function addWeightAnnotation() {
    var annotation = document.getElementById('annotation').value
  
    var weight_query = new URLSearchParams();
  
    weight_query.set("patient", client.patient.id);
    weight_query.set("_count", 100);
    weight_query.set("_sort", "-date");  
    weight_query.set("code", [
      'http://loinc.org|29463-7'
    ]);
  
    client.request('Observation?'+ weight_query, {
      pageLimit: 0,
      flat: true
    }).then(function(res){
      console.log(res)
      var byCodes = client.byCodes(res, 'code');
      var weight = byCodes('29463-7');
  
      var today = new Date();
  
      var note_entry = [{
        "authorString": "Jimmy Smith",
        "time": today.toISOString(),
        "text": annotation
      }]
  
      weight[0].note = typeof weight[0].note == 'undefined' ? note_entry: note_entry.concat(weight[0].note);
      console.log(weight[0])
      client.update(weight[0])
      displayAnnotation(formatAnnotation(note_entry[0]));
    })
  }
  
  async function printImagingStudies(){
    var imagingStudies = await getImagingStudiesInFhirDb();
    console.log(imagingStudies);
  }
  
  async function moveDicomToFHIR() {
    console.log("Starting...")
    //Patient ID of only patient in DICOM DB
    //Ideally this ID would be the same as the ID 
    //in the FHIR DB or mapped to the FHIR DB ID
    dicom_patient_id = "317e1726-19ecc999-60627f75-b8f64740-a0aa328a"
  
    //Get ImagingStudies from DICOM DB
    let patientImagingStudies = JSON.parse(await fetchPatientImagingStudies(dicom_patient_id));
  
    //Get previous ImagingStudies in FHIR DB
    var prevImagingStudies = await getImagingStudiesInFhirDb();
  
    //Decide which ImageStudies to create, update, and delete
    var prevImagingStudiesMap = new Map(prevImagingStudies.map(item => [JSON.stringify(item.identifier),item]));
    var patientImagingStudiesMap = new Map(patientImagingStudies.map(item => [JSON.stringify(item.identifier),item]));
  
    var prevIdentifierSet = new Set(prevImagingStudiesMap.keys());
    var patientIdentifierSet = new Set(patientImagingStudiesMap.keys());
  
    let createStudies = new Set([...patientIdentifierSet].filter(x => !prevIdentifierSet.has(x)));
    let updateStudies = new Set([...patientIdentifierSet].filter(x => prevIdentifierSet.has(x)));
    let deleteStudies = new Set([...prevIdentifierSet].filter(x => !patientIdentifierSet.has(x)));
  
    createStudies.forEach(study => {
      console.log("CREATE");
      let data = patientImagingStudiesMap.get(study);
      client.update(data)
    });
  
    updateStudies.forEach(study => {
      console.log("UPDATE");
      let data = patientImagingStudiesMap.get(study);
      client.update(data)
    });
  
    deleteStudies.forEach(study => {
      console.log("DELETE");
      let id = patientImagingStudiesMap.get(study).id;
      client.delete("ImagingStudy/" + id);
    });
  
    console.log("Saved!")
  }
  
  async function getImagingStudiesInFhirDb(){
    var image_study_query = new URLSearchParams();
  
    image_study_query.set("patient", client.patient.id);
    image_study_query.set("_count", 100);
  
    return client.request('ImagingStudy?'+ image_study_query, {
      pageLimit: 0,
      flat: true
    })
  }
  
  async function fetchPatientImagingStudies(patient_id) {
    const dicom_object_url = "http://localhost:8081/getFHIRImageStudies?dicom_patient_id=" + patient_id + "&fhir_patient_id=" + client.patient.id;
  
    return new Promise(function (resolve, reject){
      const Http = new XMLHttpRequest();
      Http.open("GET", dicom_object_url);
  
      Http.onload = function () {
        if (this.status >= 200 && this.status < 300) {
            resolve(Http.response);
        } else {
            reject({
                status: this.status,
                statusText: Http.statusText
            });
        }
      };
  
      Http.onerror = function () {
        reject({
            status: this.status,
            statusText: Http.statusText
        });
      };
  
      Http.send();
    });
  }
  
  async function displayInstanceImage() {
    var instance_id = document.getElementById('instance').value;
    console.log(instance_id)
  
    var image_url = "http://localhost:8081/getInstanceImage?instance_id=" + instance_id;

    console.log(image_url)
    document.getElementById('dicom_image').src = image_url;
  }
  
  async function loadDicomImageSelectors(){
    var imagingStudies = await getImagingStudiesInFhirDb();
  
    imagingStudies.forEach((imagingStudy) => {
      var studySelector = document.getElementById('study');
      var option = document.createElement("option");
      option.text = imagingStudy.id;
      option.value = imagingStudy.id;
      studySelector.add(option);
    });

    imagingStudies[0].series.forEach((imagingSeries) => {
      var seriesSelector = document.getElementById('series');
      var option = document.createElement("option");
      option.text = imagingSeries.number;
      option.value = imagingSeries.number;
      seriesSelector.add(option);
    });

    imagingStudies[0].series[0].instance.forEach((imagingInstance) => {
      var instanceSelector = document.getElementById('instance');
      var option = document.createElement("option");
      option.text = imagingInstance.title;
      option.value = imagingInstance.title;
      option.label = imagingInstance.number;
      instanceSelector.add(option);
    });
  
    displayInstanceImage();
  }

  async function updateSeriesSelector(){
    var imagingStudies = await getImagingStudiesInFhirDb();
    var selectedStudyId = document.getElementById('study').value;

    var selectedStudy = imagingStudies.filter(study => study.id == selectedStudyId);

    selectedStudy.series.forEach((imagingSeries) => {
      var seriesSelector = document.getElementById('series');
      seriesSelector.options.length = 0;
      var option = document.createElement("option");
      option.text = imagingSeries.number;
      option.value = imagingSeries.number;
      seriesSelector.add(option);
    });
  }

  async function updateInstanceSelector(){
    var imagingStudies = await getImagingStudiesInFhirDb();

    var selectedStudyId = document.getElementById('study').value;
    var selectedSeriesId = document.getElementById('series').value;

    var selectedStudy = imagingStudies.filter(study => study.id == selectedStudyId);
    var selectedSeries = selectedStudy.series.filter(series => series.number == selectedSeriesId);

    selectedSeries.instance.forEach((imagingInstance) => {
      var instanceSelector = document.getElementById('instance');
      instanceSelector.options.length = 0;
      var option = document.createElement("option");
      option.text = imagingInstance.title;
      option.value = imagingInstance.title;
      option.label = imagingInstance.number;
      instanceSelector.add(option);
    });
  }
  
  //event listner when the add button is clicked to call the function that will add the note to the weight observation
  document.getElementById('moveDicomToFhir').addEventListener('click', moveDicomToFHIR);
  document.getElementById('add').addEventListener('click', addWeightAnnotation);

  document.getElementById('study').addEventListener('change', updateSeriesSelector);
  document.getElementById('series').addEventListener('change', updateInstanceSelector);
  document.getElementById('instance').addEventListener('change', displayInstanceImage);
  
  window.onload = loadDicomImageSelectors
  
  