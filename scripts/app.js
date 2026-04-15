/* ============================================================
   COMP-6062 Final Project – app.js
   ============================================================ */

const { createApp } = Vue;

/* ── API URLs ── */
const USER_URL      = 'https://randomuser.me/api/';
const GEOCODE_URL   = 'https://nominatim.openstreetmap.org/search';
const WEATHER_URL   = 'https://api.open-meteo.com/v1/forecast';
const DICT_URL      = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/* ── WMO Weather Code → Description map ── */
const WMO_CODES = {
  0:  'Clear Sky',
  1:  'Mainly Clear',
  2:  'Partly Cloudy',
  3:  'Overcast',
  45: 'Fog',
  48: 'Icy Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Heavy Freezing Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snowfall',
  73: 'Moderate Snowfall',
  75: 'Heavy Snowfall',
  77: 'Snow Grains',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Slight Hail',
  99: 'Thunderstorm with Heavy Hail',
};

/* ── Helpers ── */

async function safeGet(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, data: null };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, data: null };
  }
}

function getCurrentHourIndex(times) {
  const now = new Date();
  const currentTime = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  for (let i = 0; i < times.length; i++) {
    if (times[i].startsWith(currentTime)) {
      return i;
    }
  }
  return 0;
}

function normaliseDefinition(raw) {
  if (!raw) return null;

  // dictionaryapi.dev returns an array
  if (Array.isArray(raw)) {
    const entry = raw[0];
    return {
      word:       entry.word ?? '?',
      phonetic:   entry.phonetic ?? entry.phonetics?.[0]?.text ?? '',
      definition: entry.meanings?.[0]?.definitions?.[0]?.definition ?? 'No definition found.',
    };
  }

 
  return {
    word:       raw.word       ?? raw.term  ?? '?',
    phonetic:   raw.phonetic   ?? raw.pronunciation ?? '',
    definition: raw.definition ?? raw.meaning ?? raw.definitions?.[0] ?? 'No definition found.',
  };
}

createApp({

  /* ── Data ── */
  data() {
    return {
      // User Profile
      user: null,
      userLoading: false,
      userError: '',

      // Weather
      weather: null,
      weatherLoading: false,
      weatherError: '',
      weatherCity: 'London',
      weatherProvince: 'Ontario',
      weatherCountry: 'Canada',

      // Dictionary
      definition: null,
      dictLoading: false,
      dictError: '',
      dictWord: '',
    };
  },

  /* ── Computed ── */
  computed: {
    fullName() {
      if (!this.user) return '';
      return `${this.user.firstName} ${this.user.lastName}`.trim();
    },
    weatherLocationLabel() {
      return [this.weatherCity, this.weatherProvince, this.weatherCountry]
        .filter(Boolean).join(', ');
    },
  },

  /* ── Methods ── */
  methods: {

    /* ─── Random User Profile ─── */
    async fetchUser() {
      this.userLoading = true;
      this.userError   = '';
      this.user        = null;

      const result = await safeGet(USER_URL);

      if (result.ok && result.data?.results?.[0]) {
        const r = result.data.results[0];
        this.user = {
          firstName: r.name?.first  ?? 'Unknown',
          lastName:  r.name?.last   ?? '',
          age:       r.dob?.age     ?? '?',
          avatar:    r.picture?.large ?? r.picture?.medium ?? '',
        };
      } else {
        this.userError = 'Could not load user profile. Please try again.';
      }

      this.userLoading = false;
    },

    
    async fetchWeather() {
      if (!this.weatherCity || !this.weatherCountry) {
        this.weatherError = 'Please enter at least a city and country.';
        return;
      }

      this.weatherLoading = true;
      this.weatherError   = '';
      this.weather        = null;

      const q = [this.weatherCity, this.weatherProvince, this.weatherCountry]
        .filter(Boolean).join('+');

      const geoResult = await safeGet(
        `${GEOCODE_URL}?addressdetails=1&q=${encodeURIComponent(q)}&format=jsonv2&limit=1`
      );

      if (!geoResult.ok || !geoResult.data?.length) {
        this.weatherError = `Could not find location: "${q}". Check spelling and try again.`;
        this.weatherLoading = false;
        return;
      }

      const { lat, lon } = geoResult.data[0];

      /*  Fetch weather from Open-Meteo */
      const weatherResult = await safeGet(
        `${WEATHER_URL}?latitude=${lat}&longitude=${lon}` +
        `&hourly=temperature_2m,weather_code,wind_speed_10m` +
        `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
      );

      if (!weatherResult.ok || !weatherResult.data?.hourly) {
        this.weatherError = 'Could not load weather data. Please try again.';
        this.weatherLoading = false;
        return;
      }

      const hourly = weatherResult.data.hourly;
      const idx = getCurrentHourIndex(hourly.time);

      const code = hourly.weather_code[idx];

      this.weather = {
        temperature: `${hourly.temperature_2m[idx]}°C`,
        wind: `${hourly.wind_speed_10m[idx]} km/h`,
        description: WMO_CODES[code] ?? `Weather code ${code}`,
      };

      this.weatherLoading = false;
    },
/* ─── Dictionary ─── */
async fetchDefinition() {
  const word = this.dictWord.trim();
  if (!word) {
    this.dictError = 'Please enter a word to define.';
    return;
  }

  this.dictLoading  = true;
  this.dictError    = '';
  this.definition   = null;

  const result = await safeGet(`${DICT_URL}/${encodeURIComponent(word)}`);

  if (result.ok && Array.isArray(result.data) && result.data.length) {
    const entry = result.data[0];
    this.definition = {
      word:       entry.word ?? word,
      phonetic:   entry.phonetic ?? entry.phonetics?.find(p => p.text)?.text ?? '',
      definition: entry.meanings?.[0]?.definitions?.[0]?.definition ?? 'No definition found.',
    };
  } else {
    this.dictError = `No definition found for "${word}".`;
  }

  this.dictLoading = false;
},

}).mount('#app');
