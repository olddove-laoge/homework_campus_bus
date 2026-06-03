const DEFAULT_STATION = '国威路(地铁)站'

function normalizeStationName(name) {
  return String(name || '')
    .replace(/\s*\((返程|终点)\)$/, '')
    .trim()
}

function distance(a, b) {
  const dx = (a.latitude - b.latitude) * 111000
  const dy = (a.longitude - b.longitude) * 85000
  return Math.sqrt(dx * dx + dy * dy)
}

function mapStationDocs(stations = []) {
  return (stations || []).map(item => ({
    name: item.stationName,
    latitude: item.latitude,
    longitude: item.longitude,
    aliases: item.aliases || []
  })).filter(item => item.name)
}

function getNearestStationName(stations, location) {
  const matched = (stations || [])
    .map(station => ({
      ...station,
      dist: distance(location, station)
    }))
    .sort((a, b) => a.dist - b.dist)[0]

  return normalizeStationName(matched?.name || DEFAULT_STATION)
}

module.exports = {
  DEFAULT_STATION,
  normalizeStationName,
  distance,
  mapStationDocs,
  getNearestStationName
}
