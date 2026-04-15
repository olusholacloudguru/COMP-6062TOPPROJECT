# COMP-6062 Final Project

A Vue.js 3 web application that demonstrates API integration with multiple external services.

## Features

### 1. Random User Profile
- Fetches a random user profile from [Random User API](https://randomuser.me/)
- Displays name, age, and avatar
- Auto-loads on page initialization

### 2. Weather Information
- Geocodes location using [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/)
- Fetches current weather from [Open-Meteo](https://open-meteo.com/)
- Displays temperature, wind speed, and weather description
- Uses WMO weather codes for accurate descriptions
- Auto-loads weather for London, Ontario, Canada on page load

### 3. Dictionary Lookup
- Searches word definitions using [Free Dictionary API](https://dictionaryapi.dev/)
- Displays word, phonetic pronunciation, and definition
- Handles cases where no definition is found

## Technologies Used

- **Vue.js 3** - Reactive frontend framework
- **JavaScript (ES6+)** - Modern JavaScript with async/await
- **HTML5 & CSS3** - Structure and styling
- **Fetch API** - HTTP requests to external APIs
- **CDN Delivery** - Vue.js loaded via CDN for simplicity

## Project Structure

```
COMP-6062TOPPROJECT/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Application styles
├── scripts/
│   └── app.js          # Vue.js application logic
└── README.md           # This file
```

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/olusholacloudguru/COMP-6062TOPPROJECT.git
   cd COMP-6062TOPPROJECT
   ```

2. Open `index.html` in a web browser

3. Alternatively, serve with a local server:
   ```bash
   python -m http.server 8000
   ```
   Then open http://localhost:8000

## API Usage

The application makes requests to the following APIs:
- Random User API: No API key required
- Nominatim: No API key required (respect rate limits)
- Open-Meteo: No API key required
- Free Dictionary API: No API key required

## Browser Compatibility

Works in all modern browsers that support:
- ES6 modules
- Fetch API
- Async/await

## Development Notes

- Uses Vue 3 Composition API (via CDN)
- Error handling for all API calls
- Responsive design considerations
- Clean, maintainable code structure

## Author

TAIWO OLUSHOLA PETER - COMP-6062 Final Project

## License

This project is for educational purposes.</content>
<parameter name="filePath">c:\Users\user\Documents\GitHub\COMP-6062TOPPROJECT\README.md