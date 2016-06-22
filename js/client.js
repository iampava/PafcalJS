function addNumber(number, event) {
    console.log(event);
    document.getElementById('result').innerHTML += number;
}

function clientStart() {
    var configObject = {
        BACKGROUND_SUBSTRACTION_SETTING: false
    };
    pafcal.configure(configObject);
    pafcal.start();
}
