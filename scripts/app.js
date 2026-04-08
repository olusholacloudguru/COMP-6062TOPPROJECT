/* ============================================================
   COMP-6062 Final Project – app.js
   Vue 3 Application (Global CDN build)
   ============================================================ */

const { createApp } = Vue;

/* ── API base URLs ── */
const BASE        = '';
const USER_URL    = `${BASE}/random-user-data`;
const WEATHER_URL = `${BASE}/weather-data`;
const DICT_URL    = `${BASE}/api/define`;

/* ── Fallback public APIs (used when course server is unavailable) ── */
const FB_USER = 'https://randomuser.me/api/?results=1';

/* ── Helpers ── */

/**
 * Safely fetch JSON. Returns { data, ok }.
 */
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
 * Normalise user profile from either the course API or randomuser.me.
 *
 * Course API may return:
 *   { firstName, lastName, age, avatar }        (camelCase)
 *   { first_name, last_name, age, picture }     (snake_case)
 *
 * randomuser.me returns:
 *   { results: [{ name:{first,last}, dob:{age}, picture:{large} }] }
 */
function normaliseUser(raw) {
  if (!raw) return null;

  // randomuser.me
  if (raw.results && Array.isArray(raw.results)) {
    const r = raw.results[0];
    return {
      firstName: r.name?.first  ?? 'Unknown',
      lastName:  r.name?.last   ?? '',
      age:       r.dob?.age     ?? '?',
      avatar:    r.picture?.large ?? r.picture?.medium ?? '',
    };
  }

  // Course API
  return {
    firstName: raw.firstName ?? raw.first_name ?? raw.name?.first ?? 'Unknown',
    lastName:  raw.lastName  ?? raw.last_name  ?? raw.name?.last  ?? '',
    age:       raw.age       ?? raw.dob?.age   ?? '?',
    avatar:    raw.avatar    ?? raw.picture     ?? raw.profileImage ?? raw.photo ?? '',
  };
}

/**
 * Normalise weather from either the course API or wttr.in (format=j1).
 *
 * Course API expected shape:
 *   { temperature, wind, description }
 *
 * wttr.in j1 shape:
 *   { current_condition: [{ temp_C, temp_F, windspeedKmph, weatherDesc:[{value}] }] }
 */
function normaliseWeather(raw) {
  if (!raw) return null;

  // wttr.in format=j1
  if (raw.current_condition) {
    const c = raw.current_condition[0];
    return {
      temperature: `${c.temp_C}°C (${c.temp_F}°F)`,
      wind:        `${c.windspeedKmph} km/h`,
      description: c.weatherDesc?.[0]?.value ?? 'N/A',
    };
  }

  // Course API (various possible field names)
  return {
    temperature: raw.temperature ?? raw.temp ?? raw.temp_c ?? raw.Temperature ?? '?',
    wind:        raw.wind        ?? raw.windSpeed ?? raw.wind_speed ?? raw.Wind ?? '?',
    description: raw.description ?? raw.desc ?? raw.condition ?? raw.Description ?? '?',
  };
}

/**
 * Normalise dictionary entry from course API or dictionaryapi.dev.
 *
 * Course API flat shape:
 *   { word, phonetic, definition }
 *
 * dictionaryapi.dev returns an array:
 *   [{ word, phonetic, meanings:[{ definitions:[{definition}] }] }]
 */
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

  // Course API flat shape
  return {
    word:       raw.word       ?? raw.term  ?? '?',
    phonetic:   raw.phonetic   ?? raw.pronunciation ?? '',
    definition: raw.definition ?? raw.meaning ?? raw.definitions?.[0] ?? 'No definition found.',
  };
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

    /* ─── Random User Profile ─── */
    async fetchUser() {
      this.userLoading = true;
      this.userError   = '';
      this.user        = null;

      // 1st: try the course API
      let result = await safeGet(USER_URL);

      // 2nd: fallback to randomuser.me
      if (!result.ok || !result.data) {
        result = await safeGet(FB_USER);
      }

      if (result.ok && result.data) {
        this.user = normaliseUser(result.data);
        if (!this.user) this.userError = 'Unexpected API response format.';
      } else {
        this.userError = 'Could not load user profile. Please try again.';
      }

      this.userLoading = false;
    },

    /* ─── Weather ─── */
    async fetchWeather() {
      if (!this.weatherCity || !this.weatherCountry) {
        this.weatherError = 'Please enter at least a city and country.';
        return;
      }

      this.weatherLoading = true;
      this.weatherError   = '';
      this.weather        = null;

      // 1st: try the course API
      const params = new URLSearchParams({
        city:     this.weatherCity,
        province: this.weatherProvince,
        country:  this.weatherCountry,
      });
      let result = await safeGet(`${WEATHER_URL}?${params}`);

      // 2nd: fallback to wttr.in (free, no key needed)
      if (!result.ok || !result.data) {
        const loc = encodeURIComponent(
          [this.weatherCity, this.weatherProvince, this.weatherCountry]
            .filter(Boolean).join('+')
        );
        result = await safeGet(`https://wttr.in/${loc}?format=j1`);
      }

      if (result.ok && result.data) {
        this.weather = normaliseWeather(result.data);
        if (!this.weather) this.weatherError = 'Unexpected weather API response.';
      } else {
        this.weatherError = 'Could not load weather data. Please try again.';
      }

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

      // 1st: try the course API
      let result = await safeGet(`${DICT_URL}?word=${encodeURIComponent(word)}`);

      // 2nd: fallback to dictionaryapi.dev (free, no key needed)
      if (!result.ok || !result.data) {
        result = await safeGet(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );
      }

      if (result.ok && result.data) {
        this.definition = normaliseDefinition(result.data);
        if (!this.definition) this.dictError = 'Could not parse definition data.';
      } else {
        this.dictError = `No definition found for "${word}".`;
      }

      this.dictLoading = false;
    },
  },

  /* ── Lifecycle ── */
  mounted() {
    this.fetchUser();    // Auto-load a random profile on page load
    this.fetchWeather(); // Auto-load London, Ontario weather on page load
  },

}).mount('#app');
