// Tomorrow.io integration for weather alerts

import axios from 'axios'

export async function fetchWeatherAlerts(latitude: number, longitude: number) {
  const response = await axios.get(`https://api.tomorrow.io/v4/timelines`, {
    params: {
      location: `${latitude},${longitude}`,
      fields: ['weatherCode', 'temperature'],
      timesteps: '1h',
      units: 'metric',
      apikey: process.env.TOMORROW_API_KEY,
    },
  })
  return response.data
}