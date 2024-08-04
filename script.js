const locationInput = document.querySelector("#locationInput");
const dataDisplay = document.querySelector("#dataDisplay");
const searchBtn = document.querySelector("#searchBtn");

// API functions
async function getWeatherData() {
  let cityName = locationInput.value;
  let date1 = getCurrentDate();
  let date2 = getDateInAWeek();
  let APIKey = "E6766K5TT6ACJQ7YGAGJ4ZKSP"; // free key, doesn't matter if clearly displayed
  const requestURL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${cityName}/${date1}/${date2}/?key=${APIKey}`;
  try {
    const response = await fetch(requestURL);
    const json = await response.json();
    console.log(json);
    filterData(json);
  } catch (error) {
    console.log(error);
    dataDisplay.innerText = "Location could not be found.";
  }
}

let weatherData = [
  { id: "today" },
  { id: "todayPlusOne" },
  { id: "todayPlusTwo" },
  { id: "todayPlusThree" },
  { id: "todayPlusFour" },
  { id: "todayPlusFive" },
  { id: "todayPlusSix" },
  { id: "todayPlusSeven" },
];

function filterData(json) {
  weatherData[0].currentTemp = json.currentConditions.temp;
  weatherData[0].feelsLike = json.currentConditions.feelslike;
  weatherData[0].humidity = json.currentConditions.humidity;
  weatherData[0].chanceOfRain = json.currentConditions.precipprob;
  weatherData[0].windSpeed = json.currentConditions.windspeed;

  for (let i = 0; i < weatherData.length; i++) {
    weatherData[i].weekday = getWeekdayFromDate(json.days[i].datetime);
    weatherData[i].tempMax = json.days[i].tempmax;
    weatherData[i].tempMin = json.days[i].tempmin;
    weatherData[i].icon = json.days[i].icon;
  }
  console.log(weatherData);
}

// UI functions
searchBtn.addEventListener("click", () => {
  getWeatherData();
});

locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    getWeatherData();
  }
});

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

function getWeekdayFromDate(date) {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const d = new Date(date);
  return weekday[d.getDay()];
}
