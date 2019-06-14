const parse = (data) => { // parse to common data [event,payload]
	console.log(data)
  const [, event, message] = data.match(/(\w+)\s*(.*)/)
  if (event == 'c') return ['clear', []]
  if (event == 'd') return ['draw', message.split(' ').map(Number)]
  return [event, message.split(' ')]
}

const send = (event, payload) => { // [color,R,x,y]
  if (event === 'clear') return ['c', '']
  if (event === 'draw') return ['d', ...payload]
}

const emit = (event, payload) => ({ event, payload, skip: false })

module.exports = {
  parse, send, emit
}
