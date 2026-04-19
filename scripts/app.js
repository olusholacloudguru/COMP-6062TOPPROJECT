/* ============================================================
   COMP-6062 Final Project – app.js
    1212292-Taiwo olushola
   ============================================================ */

const { createApp } = Vue;

/* ── API URLs ── */
const USER_URL      = 'https://randomuser.me/api/';

const WEATHER_BASE = 'https://wttr.in'; // 
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
    const res = await fetch(url);
    if (!res.ok) return { data: null, ok: false };
    const data = await res.json();
    return { data, ok: true };
  } catch (e) {
    return { data: null, ok: false };
  }
}

/**
 * Find the index in the hourly time array closest to right now.
 * Open-Meteo times are ISO strings like "2024-04-07T14:00".
 */
function getCurrentHourIndex(times) {
  const now = new Date();
  let closest = 0;
  let minDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t) - now);
    if (diff < minDiff) { minDiff = diff; closest = i; }
  });
  return closest;
}

/* ============================================================ */

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

    /* ─── 1. Random User Profile ─── */
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

    /* ───  Weather (wttr.in) ─── */
    async fetchWeather() {
      if (!this.weatherCity || !this.weatherCountry) {
        this.weatherError = 'Please enter at least a city and country.';
        return;
      }

      this.weatherLoading = true;
      this.weatherError   = '';
      this.weather        = null;

      // Build location string and fetch from wttr.in in one step — no geocoding needed
      const location = [this.weatherCity, this.weatherProvince, this.weatherCountry]
        .filter(Boolean).join(',');

      const result = await safeGet(`${WEATHER_BASE}/${encodeURIComponent(location)}?format=j1`);

      if (result.ok && result.data?.current_condition?.[0]) {
        const cond = result.data.current_condition[0];
        this.weather = {
          temperature: `${cond.temp_C}°C`,
          wind:        `${cond.windspeedKmph} km/h`,
          description: cond.weatherDesc?.[0]?.value ?? 'Unknown',
        };
      } else {
        this.weatherError = 'Could not load weather data. Check the location and try again.';
      }

      this.weatherLoading = false;
    },

    /* ─── 4. Dictionary ─── */
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
  },

  /* ── Lifecycle ── */
  mounted() {
    this.fetchUser();    // Auto-load a random profile on page load
    this.fetchWeather(); // Auto-load London, Ontario, Canada weather on page load
  },

}).mount('#app');