const formatTime = (date, symbol1, symbol2) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join(symbol1 || '/') + ' ' + [hour, minute, second].map(formatNumber).join(symbol2 || ':')
}

const formatTime_1 = (date, symbol1, symbol2) => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return [month, day].map(formatNumber).join(symbol1 || '/') + ' ' + [hour, minute].map(formatNumber).join(symbol2 || ':')
}


const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime,
  formatTime_1: formatTime_1
}

