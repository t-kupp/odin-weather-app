const cityInput = document.querySelector("#cityInput");
const dataDisplay = document.querySelector("#dataDisplay");
const btnSearch = document.querySelector("#btnGetData");

// API functions
async function getWeatherData() {
  let cityName = cityInput.value;
  let date1 = getCurrentDate();
  let date2 = getDateInAWeek();
  let APIKey = "E6766K5TT6ACJQ7YGAGJ4ZKSP"; // free key, doesn't matter if leaked
  const requestURL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${cityName}/${date1}/${date2}/?key=${APIKey}`;
  try {
    const response = await fetch(requestURL);
    const json = await response.json();
    console.log(json);
    displayData(json);
  } catch (error) {
    console.log(error);
    dataDisplay.innerText = "Location could not be found.";
  }
}

// UI functions
btnSearch.addEventListener("click", () => {
  getWeatherData();
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    getWeatherData();
  }
});

function displayData(json) {
  let address = json.resolvedAddress;
  let temperature = json.currentConditions.temp;
  let celsius = fahrenheitToCelsius(temperature);
  let conditions = json.currentConditions.conditions;
  let description = json.description;
  dataDisplay.innerText = `The current temperature in ${address} is ${celsius}°C.\n
  It is ${conditions.toLowerCase()}.\n
  ${description}`;
  cityInput.value = "";
}

// helper functions
function fahrenheitToCelsius(number) {
  let result = ((number - 32) * 5) / 9;
  return parseFloat(result.toFixed(1));
}

function getCurrentDate() {
  const currentDate = new Date();
  return currentDate.toISOString();
}

function getDateInAWeek() {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + 7);
  return futureDate.toISOString();
}
