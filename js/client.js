function addNumber(number, event) {
    console.log(event);
    document.getElementById('result').innerHTML += number;
}

function clientStart() {
    var configObject = {
        BACKGROUND_SUBSTRACTION_SETTING: false,
        WORKER_PATH: "js/pafcal/pafcal.worker.js"
    };
    pafcal.configure(configObject);
    pafcal.start();
}
