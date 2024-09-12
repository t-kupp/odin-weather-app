const locationInput = document.querySelector("#locationInput");
const searchBtn = document.querySelector("#searchBtn");
const locationName = document.querySelector("#locationName");
const currentIconDisplay = document.querySelector("#currentIcon");
const currentTempDisplay = document.querySelector("#currentTemp");
const currentDateDisplay = document.querySelector("#currentDate");
const currentTimeDisplay = document.querySelector("#currentTime");
const rightInfo = document.querySelector("#rightInfo");
const celsiusBtn = document.querySelector("#celsiusBtn");
const fahrenheitBtn = document.querySelector("#fahrenheitBtn");
const forecastContainer = document.querySelector("#forecast-container");
let activeUnitSystem = "metric";
let useGeolocation = false;
let weatherData = [
  { day: "current" },
  { day: 0 },
  { day: 1 },
  { day: 2 },
  { day: 3 },
  { day: 4 },
  { day: 5 },
  { day: 6 },
  { day: 7 },
];

///////////////////
// API functions //
///////////////////

async function getWeatherData(location) {
  let cityName = location;
  let date1 = getCurrentDate();
  let date2 = getDateInAWeek();
  let APIKey = "E6766K5TT6ACJQ7YGAGJ4ZKSP"; // free key, doesn't matter if clearly displayed
  const requestURL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${cityName}/${date1}/${date2}/?key=${APIKey}`;
  try {
    const response = await fetch(requestURL);
    const json = await response.json();
    filterData(json);
  } catch (error) {
    console.log(error);
    alert("Location not found.");
  }
}

navigator.geolocation.getCurrentPosition(
  async function (position) {
    useGeolocation = true;
    let coordinates = `${position.coords.latitude},${position.coords.longitude}`;
    weatherData[0].currentLocation = await coordinatesToLocationName(coordinates);
    getWeatherData(coordinates);
  },
  function (error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.log("User denied the request for Geolocation.");
        getWeatherData("Stockholm");
        break;
      case error.POSITION_UNAVAILABLE:
        console.log("Location information is unavailable.");
        getWeatherData("Stockholm");
        break;
      case error.TIMEOUT:
        console.log("The request to get user location timed out.");
        getWeatherData("Stockholm");
        break;
      case error.UNKNOWN_ERROR:
        console.log("An unknown error occurred.");
        getWeatherData("Stockholm");
        break;
    }
  }
);

async function coordinatesToLocationName(coordinates) {
  const APIKey = "AIzaSyAWg_qEKVBZJgMJEha0WaUZopCnAuhmpv0";
  const requestURL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates}&location_type=ROOFTOP&result_type=street_address&key=${APIKey}`;
  try {
    const response = await fetch(requestURL);
    const json = await response.json();
    return getCityAndCountryFromGoogleAPI(json);
  } catch (error) {
    console.log(error);
  }
}

function filterData(json) {
  // get data for the current weather info
  if (useGeolocation == false) {
    let coordinates = json.latitude + "," + json.longitude;
    weatherData[0].currentLocation = getLocationNameFormatted(json.resolvedAddress);
  }
  useGeolocation = false;
  weatherData[0].currentTemp = json.currentConditions.temp;
  weatherData[0].feelsLike = json.currentConditions.feelslike;
  weatherData[0].humidity = json.currentConditions.humidity;
  weatherData[0].tzoffset = json.tzoffset;
  weatherData[0].icon = json.currentConditions.icon;
  weatherData[0].chanceOfRain = json.days[0].hours[getCurrentHour()].precipprob;
  if (weatherData[0].icon == "rain") weatherData[0].chanceOfRain = 100;
  weatherData[0].windSpeed = json.currentConditions.windspeed;
  weatherData[0].weekday = getWeekdayFromDate(json.days[0].datetime);
  weatherData[0].tempMax = json.days[0].tempmax;
  weatherData[0].tempMin = json.days[0].tempmin;
  //get data for the weather forecast
  let d = 0;
  for (let i = 1; i < weatherData.length; i++) {
    weatherData[i].weekday = getWeekdayFromDate(json.days[d].datetime);
    weatherData[i].tempMax = json.days[d].tempmax;
    weatherData[i].tempMin = json.days[d].tempmin;
    weatherData[i].icon = json.days[d].icon;
    d++;
  }
  d = 0;
  displayData();
}

///////////////////////////////////
// main function to display data //
///////////////////////////////////

function displayData() {
  //left display
  locationName.innerText = getLocationNameFormatted(weatherData[0].currentLocation);
  currentIconDisplay.innerHTML = getIcon(weatherData[0].icon);
  // messy, pls fix
  if (activeUnitSystem == "metric") {
    weatherData[0].currentTemp = fahrenheitToCelsius(weatherData[0].currentTemp);
    currentTempDisplay.innerText = weatherData[0].currentTemp + "°C";
  } else {
    currentTempDisplay.innerText = `${Math.round(weatherData[0].currentTemp)}` + "°F";
  }
  currentDateDisplay.innerText = getCurrentDateFormatted();
  currentTimeDisplay.innerText = getCurrentTimeFormatted();

  //right display
  rightInfo.innerHTML = "";
  buildSideInfoModule(
    "thermometer",
    "Feels Like",
    weatherData[0].feelsLike,
    "°F",
    "feelsLikeValue"
  );
  buildSideInfoModule("humidity", "Humidity", weatherData[0].humidity, "%");
  buildSideInfoModule("chanceOfRain", "Chance of Rain", weatherData[0].chanceOfRain, "%");
  buildSideInfoModule("windSpeed", "Wind Speed", weatherData[0].windSpeed, "mph", "windSpeedValue");

  // weather forecast
  forecastContainer.innerHTML = "";
  for (let i = 1; i < weatherData.length; i++) {
    let fcDayContainer = forecastContainer.appendChild(document.createElement("div"));
    fcDayContainer.classList.add("fc-day-container");
    let fcTitle = fcDayContainer.appendChild(document.createElement("p"));
    fcTitle.classList.add("fcTitle");
    fcTitle.innerText = weatherData[i].weekday;
    let icon = fcDayContainer.appendChild(document.createElement("div"));
    icon.innerHTML = getIcon(weatherData[i].icon);
    let fcMaxTemp = fcDayContainer.appendChild(document.createElement("p"));
    fcMaxTemp.classList.add("fcMaxTemp");
    fcMaxTemp.classList.add("tempValue");
    fcMaxTemp.innerText = fahrenheitToCelsius(weatherData[i].tempMax) + "°C";
    let fcLowTemp = fcDayContainer.appendChild(document.createElement("p"));
    fcLowTemp.classList.add("fcLowTemp");
    fcLowTemp.classList.add("tempValue");
    fcLowTemp.innerText = fahrenheitToCelsius(weatherData[i].tempMin) + "°C";
  }
  if (activeUnitSystem == "imperial") {
    let tempValues = document.querySelectorAll(".tempValue");
    for (value of tempValues) {
      value.innerText = celsiusToFahrenheit(value.innerText) + "°F";
    }
  }
}

//////////////////
// UI functions //
//////////////////

searchBtn.addEventListener("click", () => {
  getWeatherData(locationInput.value);
});

locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    getWeatherData(locationInput.value);
    searchInput.blur();
  }
});

locationInput.addEventListener("click", () => {
  locationInput.value = "";
});

celsiusBtn.addEventListener("click", () => {
  convertValuesToMetric();
  celsiusBtn.classList.add("active");
  fahrenheitBtn.classList.remove("active");
});

fahrenheitBtn.addEventListener("click", () => {
  convertValuesToImperial();
  celsiusBtn.classList.remove("active");
  fahrenheitBtn.classList.add("active");
});

//////////////////////
// helper functions //
//////////////////////

function getCityAndCountryFromGoogleAPI(json) {
  let arr = json.plus_code.compound_code.split(" ");
  let result = [];
  for (let i = 1; i < arr.length; i++) {
    result.push(arr[i]);
  }
  return result.join(" ");
}

function buildSideInfoModule(icon, titleText, value, unit, id) {
  let sideInfoContainer = rightInfo.appendChild(document.createElement("div"));
  sideInfoContainer.classList.add("side-info-container");
  sideInfoContainer.innerHTML = getIcon(icon);
  let infoTitle = sideInfoContainer.appendChild(document.createElement("p"));
  infoTitle.classList.add("sideInfoTitle");
  infoTitle.innerText = titleText;
  let sideInfoValue = sideInfoContainer.appendChild(document.createElement("p"));
  sideInfoValue.classList.add("sideInfoValue");
  if (activeUnitSystem == "metric" && unit == "°F") {
    value = fahrenheitToCelsius(value);
    unit = "°C";
  }
  if (activeUnitSystem == "metric" && unit == "mph") {
    value = MphToKmh(value);
    unit = "km/h";
  }
  sideInfoValue.innerText = `${value}${unit}`;
  sideInfoValue.id = id;
}

function fahrenheitToCelsius(input) {
  // check for string input and remove °F before converting
  if (typeof input == "string") {
    input = input.replace("°F", "");
    input = parseFloat(input);
  }
  let result = ((input - 32) * 5) / 9;
  return Math.round(result);
}

function celsiusToFahrenheit(input) {
  // check for string input and remove °F before converting
  if (typeof input == "string") {
    input = input.replace("°C", "");
    input = parseFloat(input);
  }
  let result = (input * 9) / 5 + 32;
  return Math.round(result);
}

function kmhToMph(input) {
  // check for string input and remove mph before converting
  if (typeof input == "string") {
    input = input.replace("km/h", "");
    input = parseFloat(input);
  }
  let result = input * 1.609344;
  return Math.round(result * 10) / 10;
}

function MphToKmh(input) {
  // check for string input and remove mph before converting
  if (typeof input == "string") {
    input = input.replace("mph", "");
    input = parseFloat(input);
  }
  let result = input / 1.609344;
  return Math.round(result * 10) / 10;
}

function getCurrentDate() {
  const currentDate = new Date();
  return currentDate.toISOString();
}

function getLocationNameFormatted(string) {
  const arr = string.split(",");
  if (arr.length == 1) return arr[0];
  const formattedName = arr[0] + "," + arr[arr.length - 1];
  return formattedName;
}

function getCurrentDateFormatted() {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (weatherData[0].tzoffset - 2) * 60 * 60 * 1000);
  const optionsWeekday = { weekday: "long" };
  const optionsDay = { day: "numeric" };
  const optionsMonth = { month: "long" };
  const optionsYear = { year: "numeric" };
  const weekday = futureTime.toLocaleDateString("en-US", optionsWeekday);
  const day = futureTime.toLocaleDateString("en-US", optionsDay);
  const month = futureTime.toLocaleDateString("en-US", optionsMonth);
  const year = futureTime.toLocaleDateString("en-US", optionsYear);
  const formattedDate = `${weekday}, ${day} ${month} ${year}`;
  return formattedDate;
}

function getCurrentTimeFormatted() {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (weatherData[0].tzoffset - 2) * 60 * 60 * 1000);
  let hours = futureTime.getHours();
  const minutes = futureTime.getMinutes();
  const period = hours >= 12 ? "pm" : "am";
  hours = hours % 24;
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedTime = `${formattedHours}:${formattedMinutes} ${period}`;
  return formattedTime;
}

function getCurrentHour() {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (weatherData[0].tzoffset - 2) * 60 * 60 * 1000);
  let hours = futureTime.getHours();
  hours = hours % 24;
  return hours;
}

function getDateInAWeek() {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + 7);
  return futureDate.toISOString();
}

function getWeekdayFromDate(date) {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(date);
  return weekday[d.getDay()];
}

function convertValuesToMetric() {
  if (activeUnitSystem == "metric") return;
  // convert main display temperature
  currentTempDisplay.innerText = fahrenheitToCelsius(currentTempDisplay.innerText) + "°C";
  // convert feels like temperature
  const feelsLikeValue = document.querySelector("#feelsLikeValue");
  feelsLikeValue.innerText = fahrenheitToCelsius(feelsLikeValue.innerText) + "°C";
  // convert wind speed
  const windSpeedValue = document.querySelector("#windSpeedValue");
  windSpeedValue.innerText = MphToKmh(windSpeedValue.innerText) + "km/h";
  activeUnitSystem = "metric";
  // convert forecast
  let tempValues = document.querySelectorAll(".tempValue");
  for (value of tempValues) {
    value.innerText = fahrenheitToCelsius(value.innerText) + "°C";
  }
}

function convertValuesToImperial() {
  if (activeUnitSystem == "imperial") return;
  // convert main display temperature
  currentTempDisplay.innerText = celsiusToFahrenheit(currentTempDisplay.innerText) + "°F";
  // convert feels like temperature
  const feelsLikeValue = document.querySelector("#feelsLikeValue");
  feelsLikeValue.innerText = celsiusToFahrenheit(feelsLikeValue.innerText) + "°F";
  // convert wind speed
  const windSpeedValue = document.querySelector("#windSpeedValue");
  windSpeedValue.innerText = kmhToMph(windSpeedValue.innerText) + "mph";
  activeUnitSystem = "imperial";
  // convert forecast
  let tempValues = document.querySelectorAll(".tempValue");
  for (value of tempValues) {
    value.innerText = celsiusToFahrenheit(value.innerText) + "°F";
  }
}

function getIcon(icon) {
  if (icon == "snow")
    return `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64"><defs><linearGradient id="b" x1="22.56" x2="39.2" y1="21.96" y2="50.8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".45" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient><linearGradient id="a" x1="30.12" x2="31.88" y1="43.48" y2="46.52" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#86c3db"/><stop offset=".45" stop-color="#86c3db"/><stop offset="1" stop-color="#5eafcf"/></linearGradient><linearGradient id="c" x1="29.67" x2="32.33" y1="42.69" y2="47.31" xlink:href="#a"/><linearGradient id="d" x1="23.12" x2="24.88" y1="43.48" y2="46.52" xlink:href="#a"/><linearGradient id="e" x1="22.67" x2="25.33" y1="42.69" y2="47.31" xlink:href="#a"/><linearGradient id="f" x1="37.12" x2="38.88" y1="43.48" y2="46.52" xlink:href="#a"/><linearGradient id="g" x1="36.67" x2="39.33" y1="42.69" y2="47.31" xlink:href="#a"/></defs><path fill="url(#b)" stroke="#e6effc" stroke-miterlimit="10" stroke-width=".5" d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z"/><g><circle cx="31" cy="45" r="1.25" fill="none" stroke="url(#a)" stroke-miterlimit="10"/><path fill="none" stroke="url(#c)" stroke-linecap="round" stroke-miterlimit="10" d="M33.17 46.25l-1.09-.63m-2.16-1.24l-1.09-.63M31 42.5v1.25m0 3.75v-1.25m-1.08-.63l-1.09.63m4.34-2.5l-1.09.63"/><animateTransform additive="sum" attributeName="transform" dur="4s" repeatCount="indefinite" type="translate" values="-1 -6; 1 12"/><animateTransform additive="sum" attributeName="transform" dur="9s" repeatCount="indefinite" type="rotate" values="0 31 45; 360 31 45"/><animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;1;1;1;0"/></g><g><circle cx="24" cy="45" r="1.25" fill="none" stroke="url(#d)" stroke-miterlimit="10"/><path fill="none" stroke="url(#e)" stroke-linecap="round" stroke-miterlimit="10" d="M26.17 46.25l-1.09-.63m-2.16-1.24l-1.09-.63M24 42.5v1.25m0 3.75v-1.25m-1.08-.63l-1.09.63m4.34-2.5l-1.09.63"/><animateTransform additive="sum" attributeName="transform" begin="-2s" dur="4s" repeatCount="indefinite" type="translate" values="1 -6; -1 12"/><animateTransform additive="sum" attributeName="transform" dur="9s" repeatCount="indefinite" type="rotate" values="0 24 45; 360 24 45"/><animate attributeName="opacity" begin="-2s" dur="4s" repeatCount="indefinite" values="0;1;1;1;0"/></g><g><circle cx="38" cy="45" r="1.25" fill="none" stroke="url(#f)" stroke-miterlimit="10"/><path fill="none" stroke="url(#g)" stroke-linecap="round" stroke-miterlimit="10" d="M40.17 46.25l-1.09-.63m-2.16-1.24l-1.09-.63M38 42.5v1.25m0 3.75v-1.25m-1.08-.63l-1.09.63m4.34-2.5l-1.09.63"/><animateTransform additive="sum" attributeName="transform" begin="-1s" dur="4s" repeatCount="indefinite" type="translate" values="1 -6; -1 12"/><animateTransform additive="sum" attributeName="transform" dur="9s" repeatCount="indefinite" type="rotate" values="0 38 45; 360 38 45"/><animate attributeName="opacity" begin="-1s" dur="4s" repeatCount="indefinite" values="0;1;1;1;0"/></g></svg>
  `;
  if (icon == "rain")
    return `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64"><defs><linearGradient id="b" x1="22.56" x2="39.2" y1="21.96" y2="50.8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".45" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient><linearGradient id="a" x1="22.53" x2="25.47" y1="42.95" y2="48.05" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4286ee"/><stop offset=".45" stop-color="#4286ee"/><stop offset="1" stop-color="#0950bc"/></linearGradient><linearGradient id="c" x1="29.53" x2="32.47" y1="42.95" y2="48.05" xlink:href="#a"/><linearGradient id="d" x1="36.53" x2="39.47" y1="42.95" y2="48.05" xlink:href="#a"/></defs><path fill="url(#b)" stroke="#e6effc" stroke-miterlimit="10" stroke-width=".5" d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z"/><path fill="none" stroke="url(#a)" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" d="M24.39 43.03l-.78 4.94"><animateTransform attributeName="transform" dur="0.7s" repeatCount="indefinite" type="translate" values="1 -5; -2 10"/><animate attributeName="opacity" dur="0.7s" repeatCount="indefinite" values="0;1;1;0"/></path><path fill="none" stroke="url(#c)" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" d="M31.39 43.03l-.78 4.94"><animateTransform attributeName="transform" begin="-0.4s" dur="0.7s" repeatCount="indefinite" type="translate" values="1 -5; -2 10"/><animate attributeName="opacity" begin="-0.4s" dur="0.7s" repeatCount="indefinite" values="0;1;1;0"/></path><path fill="none" stroke="url(#d)" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" d="M38.39 43.03l-.78 4.94"><animateTransform attributeName="transform" begin="-0.2s" dur="0.7s" repeatCount="indefinite" type="translate" values="1 -5; -2 10"/><animate attributeName="opacity" begin="-0.2s" dur="0.7s" repeatCount="indefinite" values="0;1;1;0"/></path></svg>  `;
  if (icon == "fog")
    return `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="27.5" x2="36.5" y1="17.21" y2="32.79" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d4d7dd"/><stop offset=".45" stop-color="#d4d7dd"/><stop offset="1" stop-color="#bec1c6"/></linearGradient><linearGradient id="b" y1="24.21" y2="39.79" xlink:href="#a"/><linearGradient id="c" y1="31.21" y2="46.79" xlink:href="#a"/></defs><path fill="none" stroke="url(#a)" stroke-linecap="round" stroke-miterlimit="10" stroke-width="3" d="M17 25h30"><animateTransform attributeName="transform" begin="0s" dur="5s" repeatCount="indefinite" type="translate" values="-4 0; 4 0; -4 0"/></path><path fill="none" stroke="url(#b)" stroke-linecap="round" stroke-miterlimit="10" stroke-width="3" d="M17 32h30"><animateTransform attributeName="transform" begin="-2s" dur="5s" repeatCount="indefinite" type="translate" values="-3 0; 3 0; -3 0"/></path><path fill="none" stroke="url(#c)" stroke-linecap="round" stroke-miterlimit="10" stroke-width="3" d="M17 39h30"><animateTransform attributeName="transform" begin="-4s" dur="5s" repeatCount="indefinite" type="translate" values="-4 0; 4 0; -4 0"/></path></svg>
  `;
  if (icon == "wind")
    return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="27.56" x2="38.27" y1="17.64" y2="36.19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d4d7dd"/><stop offset=".45" stop-color="#d4d7dd"/><stop offset="1" stop-color="#bec1c6"/></linearGradient><linearGradient id="b" x1="19.96" x2="31.37" y1="29.03" y2="48.8" xlink:href="#a"/></defs><path fill="none" stroke="url(#a)" stroke-dasharray="35 22" stroke-linecap="round" stroke-miterlimit="10" stroke-width="3" d="M43.64 20a5 5 0 113.61 8.46h-35.5"><animate attributeName="stroke-dashoffset" dur="2s" repeatCount="indefinite" values="-57; 57"/></path><path fill="none" stroke="url(#b)" stroke-dasharray="24 15" stroke-linecap="round" stroke-miterlimit="10" stroke-width="3" d="M29.14 44a5 5 0 103.61-8.46h-21"><animate attributeName="stroke-dashoffset" begin="-1.5s" dur="2s" repeatCount="indefinite" values="-39; 39"/></path></svg>
  `;
  if (icon == "cloudy")
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="22.56" x2="39.2" y1="21.96" y2="50.8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".45" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path fill="url(#a)" stroke="#e6effc" stroke-miterlimit="10" stroke-width=".5" d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z"><animateTransform attributeName="transform" dur="7s" repeatCount="indefinite" type="translate" values="-3 0; 3 0; -3 0"/></path></svg>
  `;
  if (icon == "partly-cloudy-day")
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="16.5" x2="21.5" y1="19.67" y2="28.33" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#f59e0b"/></linearGradient><linearGradient id="b" x1="22.56" x2="39.2" y1="21.96" y2="50.8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".45" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><circle cx="19" cy="24" r="5" fill="url(#a)" stroke="#f8af18" stroke-miterlimit="10" stroke-width=".5"/><path fill="none" stroke="#fbbf24" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" d="M19 15.67V12.5m0 23v-3.17m5.89-14.22l2.24-2.24M10.87 32.13l2.24-2.24m0-11.78l-2.24-2.24m16.26 16.26l-2.24-2.24M7.5 24h3.17m19.83 0h-3.17"><animateTransform attributeName="transform" dur="45s" repeatCount="indefinite" type="rotate" values="0 19 24; 360 19 24"/></path><path fill="url(#b)" stroke="#e6effc" stroke-miterlimit="10" stroke-width=".5" d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z"/></svg>
  `;
  if (icon == "partly-cloudy-night")
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="13.58" x2="24.15" y1="15.57" y2="33.87" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#86c3db"/><stop offset=".45" stop-color="#86c3db"/><stop offset="1" stop-color="#5eafcf"/><animateTransform attributeName="gradientTransform" dur="10s" repeatCount="indefinite" type="rotate" values="10 19.22 24.293; -10 19.22 24.293; 10 19.22 24.293"/></linearGradient><linearGradient id="b" x1="22.56" x2="39.2" y1="21.96" y2="50.8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".45" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path fill="url(#a)" stroke="#72b9d5" stroke-linecap="round" stroke-linejoin="round" stroke-width=".5" d="M29.33 26.68a10.61 10.61 0 01-10.68-10.54A10.5 10.5 0 0119 13.5a10.54 10.54 0 1011.5 13.11 11.48 11.48 0 01-1.17.07z"><animateTransform attributeName="transform" dur="10s" repeatCount="indefinite" type="rotate" values="-10 19.22 24.293; 10 19.22 24.293; -10 19.22 24.293"/></path><path fill="url(#b)" stroke="#e6effc" stroke-miterlimit="10" stroke-width=".5" d="M46.5 31.5h-.32a10.49 10.49 0 00-19.11-8 7 7 0 00-10.57 6 7.21 7.21 0 00.1 1.14A7.5 7.5 0 0018 45.5a4.19 4.19 0 00.5 0v0h28a7 7 0 000-14z"/></svg>
  `;
  if (icon == "clear-day")
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="26.75" x2="37.25" y1="22.91" y2="41.09" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><circle cx="32" cy="32" r="10.5" fill="url(#a)" stroke="#f8af18" stroke-miterlimit="10" stroke-width=".5"/><path fill="none" stroke="#fbbf24" stroke-linecap="round" stroke-miterlimit="10" stroke-width="3" d="M32 15.71V9.5m0 45v-6.21m11.52-27.81l4.39-4.39M16.09 47.91l4.39-4.39m0-23l-4.39-4.39m31.82 31.78l-4.39-4.39M15.71 32H9.5m45 0h-6.21"><animateTransform attributeName="transform" dur="45s" repeatCount="indefinite" type="rotate" values="0 32 32; 360 32 32"/></path></svg>
  `;
  if (icon == "clear-night")
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="21.92" x2="38.52" y1="18.75" y2="47.52" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#86c3db"/><stop offset=".45" stop-color="#86c3db"/><stop offset="1" stop-color="#5eafcf"/><animateTransform attributeName="gradientTransform" dur="10s" repeatCount="indefinite" type="rotate" values="5 32 32; -15 32 32; 5 32 32"/></linearGradient></defs><path fill="url(#a)" stroke="#72b9d5" stroke-linecap="round" stroke-linejoin="round" stroke-width=".5" d="M46.66 36.2a16.66 16.66 0 01-16.78-16.55 16.29 16.29 0 01.55-4.15A16.56 16.56 0 1048.5 36.1c-.61.06-1.22.1-1.84.1z"><animateTransform attributeName="transform" dur="10s" repeatCount="indefinite" type="rotate" values="-5 32 32; 15 32 32; -5 32 32"/></path></svg>
  `;
  if (icon == "thermometer")
    return `<svg enable-background="new 0 0 30 30" viewBox="0 0 30 26" xmlns="http://www.w3.org/2000/svg"><path d="m9.91 19.56c0-.85.2-1.64.59-2.38s.94-1.35 1.65-1.84v-9.92c0-.8.27-1.48.82-2.03s1.23-.84 2.03-.84c.81 0 1.49.28 2.04.83.55.56.83 1.23.83 2.03v9.92c.71.49 1.25 1.11 1.64 1.84s.58 1.53.58 2.38c0 .92-.23 1.78-.68 2.56s-1.07 1.4-1.85 1.85-1.63.68-2.56.68c-.92 0-1.77-.23-2.55-.68s-1.4-1.07-1.86-1.85-.68-1.63-.68-2.55zm1.76 0c0 .93.33 1.73.98 2.39s1.44.99 2.36.99c.93 0 1.73-.33 2.4-1s1.01-1.46 1.01-2.37c0-.62-.16-1.2-.48-1.73s-.76-.94-1.32-1.23l-.28-.14c-.1-.04-.15-.14-.15-.29v-10.76c0-.32-.11-.59-.34-.81-.23-.21-.51-.32-.85-.32-.32 0-.6.11-.83.32s-.34.48-.34.81v10.74c0 .15-.05.25-.14.29l-.27.14c-.55.29-.98.7-1.29 1.23s-.46 1.1-.46 1.74zm.78 0c0 .71.24 1.32.73 1.82s1.07.75 1.76.75 1.28-.25 1.79-.75.76-1.11.76-1.81c0-.63-.22-1.19-.65-1.67s-.96-.77-1.58-.85v-7.36c0-.06-.03-.13-.1-.19-.07-.07-.14-.1-.22-.1-.09 0-.16.03-.21.08-.05.06-.08.12-.08.21v7.34c-.61.09-1.13.37-1.56.85-.43.49-.64 1.04-.64 1.68z"/></svg>
  `;
  if (icon == "humidity")
    return `
    <svg enable-background="new 0 0 30 30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><path d="m7.56 17.19c0-.88.24-1.89.72-3.03s1.1-2.25 1.86-3.31c1.56-2.06 2.92-3.62 4.06-4.67l.75-.72c.25.26.53.5.83.72.41.42 1.04 1.11 1.88 2.09s1.57 1.85 2.17 2.65c.71 1.01 1.32 2.1 1.81 3.25s.74 2.16.74 3.03c0 1-.19 1.95-.58 2.86s-.91 1.7-1.57 2.36-1.45 1.19-2.37 1.58-1.89.59-2.91.59c-1 0-1.95-.19-2.86-.57s-1.7-.89-2.36-1.55c-.66-.65-1.19-1.44-1.58-2.35s-.59-1.89-.59-2.93zm2.26-2.93c0 .83.17 1.49.52 1.99.35.49.88.74 1.59.74.72 0 1.25-.25 1.61-.74.35-.49.53-1.15.54-1.99-.01-.84-.19-1.5-.54-2-.35-.49-.89-.74-1.61-.74-.71 0-1.24.25-1.59.74-.35.5-.52 1.16-.52 2zm1.57 0c0-.15 0-.27 0-.35s.01-.19.02-.33.02-.25.05-.32.05-.16.09-.24.09-.15.15-.18c.07-.04.14-.06.23-.06.14 0 .25.04.33.12s.14.21.17.38c.03.18.05.32.06.45s.01.3.01.52c0 .23 0 .4-.01.52s-.03.27-.06.45c-.03.17-.09.3-.17.38s-.19.12-.33.12c-.09 0-.16-.02-.23-.06s-.12-.1-.15-.18c-.04-.08-.07-.17-.09-.24-.02-.08-.04-.19-.05-.32-.01-.14-.02-.25-.02-.32s0-.19 0-.34zm.59 7.75h1.32l4.99-10.74h-1.35zm4.3-2.99c.01.84.2 1.5.55 2 .35.49.89.74 1.6.74.72 0 1.25-.25 1.6-.74s.52-1.16.53-2c-.01-.84-.18-1.5-.53-1.99s-.88-.74-1.6-.74c-.71 0-1.25.25-1.6.74-.36.49-.54 1.15-.55 1.99zm1.57 0c0-.23 0-.4.01-.52s.03-.27.06-.45.09-.3.17-.38.19-.12.33-.12c.09 0 .17.02.24.06s.12.1.16.19.07.17.1.24.04.18.05.32l.01.32v.34.35l-.01.32-.05.32-.1.24-.16.19-.24.06c-.14 0-.25-.04-.33-.12s-.14-.21-.17-.38c-.03-.18-.05-.33-.06-.45s-.01-.3-.01-.53z"/></svg>
  `;
  if (icon == "chanceOfRain")
    return `
    <svg enable-background="new 0 0 30 30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><path d="m4.64 16.91c0-1.15.36-2.17 1.08-3.07s1.63-1.47 2.73-1.73c.31-1.36 1.02-2.48 2.11-3.36s2.34-1.31 3.75-1.31c1.38 0 2.6.43 3.68 1.28s1.78 1.95 2.1 3.29h.32c.89 0 1.72.22 2.48.65s1.37 1.03 1.81 1.78.67 1.58.67 2.47c0 .88-.21 1.69-.63 2.44s-1 1.35-1.73 1.8-1.53.69-2.4.71c-.13 0-.2-.06-.2-.17v-1.33c0-.12.07-.18.2-.18.85-.04 1.58-.38 2.18-1.02s.9-1.39.9-2.26-.33-1.62-.98-2.26-1.42-.96-2.31-.96h-1.61c-.12 0-.18-.06-.18-.17l-.08-.58c-.11-1.08-.58-1.99-1.39-2.71-.82-.73-1.76-1.09-2.85-1.09s-2.05.36-2.85 1.09c-.81.73-1.26 1.63-1.36 2.71l-.07.53c0 .12-.07.19-.2.19l-.53.03c-.83.1-1.53.46-2.1 1.07s-.85 1.33-.85 2.16c0 .87.3 1.62.9 2.26s1.33.98 2.18 1.02c.11 0 .17.06.17.18v1.33c0 .11-.06.17-.17.17-1.34-.06-2.47-.57-3.4-1.53s-1.37-2.1-1.37-3.43zm5.35 6.69c0-.04.01-.11.04-.2l1.63-5.77c.06-.19.17-.34.32-.44s.31-.15.46-.15c.07 0 .15.01.24.03.24.04.42.17.54.37s.15.42.08.67l-1.63 5.73c-.12.43-.4.64-.82.64-.04 0-.07-.01-.11-.02-.06-.02-.09-.03-.1-.03-.22-.06-.38-.17-.49-.33-.11-.17-.16-.33-.16-.5zm2.62 2.81 2.44-8.77c.04-.19.14-.34.3-.44s.32-.15.49-.15c.09 0 .18.01.27.03.22.06.38.19.49.39s.13.41.07.64l-2.43 8.78c-.04.17-.13.31-.29.43s-.32.18-.51.18c-.09 0-.18-.02-.25-.05-.2-.05-.37-.18-.52-.39-.11-.18-.13-.39-.06-.65zm4.13-2.79c0-.04.01-.11.04-.23l1.63-5.77c.06-.19.16-.34.3-.44.15-.1.3-.15.46-.15.08 0 .17.01.26.03.21.06.36.16.46.31s.15.31.15.47c0 .03-.01.08-.02.14s-.02.1-.02.12l-1.63 5.73c-.04.19-.13.35-.28.46s-.32.17-.51.17l-.24-.05c-.2-.06-.35-.16-.46-.32-.09-.15-.14-.31-.14-.47z"/></svg>
  `;
  if (icon == "windSpeed")
    return `
    <svg enable-background="new 0 0 30 30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><path d="m3.1 16.97c0 .24.09.45.28.62.16.19.37.28.63.28h14.69c.29 0 .53.1.73.3s.3.45.3.74-.1.53-.3.72-.44.29-.74.29c-.29 0-.54-.1-.73-.29-.16-.18-.36-.26-.6-.26-.25 0-.46.09-.64.26s-.27.38-.27.61c0 .25.09.46.28.63.56.55 1.22.83 1.96.83.78 0 1.45-.27 2.01-.81s.83-1.19.83-1.97-.28-1.44-.84-2-1.23-.84-2-.84h-14.68c-.25 0-.46.09-.64.26s-.27.38-.27.63zm0-3.28c0 .23.09.43.28.61.17.18.38.26.63.26h20.04c.78 0 1.45-.27 2.01-.82.56-.54.84-1.2.84-1.97s-.28-1.44-.84-1.99-1.23-.83-2.01-.83c-.77 0-1.42.27-1.95.8-.18.16-.27.38-.27.67 0 .26.09.47.26.63s.38.24.63.24c.24 0 .45-.08.63-.24.19-.21.42-.31.7-.31.29 0 .53.1.73.3s.3.44.3.73-.1.53-.3.72-.44.29-.73.29h-20.04c-.25 0-.46.09-.64.26-.18.19-.27.4-.27.65z"/></svg>`;
}
