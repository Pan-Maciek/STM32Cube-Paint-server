const net = require('net')
const express = require('express')
const app = require('express')()
const path = require('path')
const os = require('os')
const transform = require(path.resolve('./transform.js'))
const http_server = require('http').Server(app)
const io = require('socket.io')(http_server)
const middleware = require('socketio-wildcard')()
let tcp_port = 3000
let http_port = 8000

io.use(middleware)
app.use(express.static('app'))
app.get('/', (_, res) => res.sendFile(path.resolve(__dirname, 'app/index.html')))


const ips = (() => {
  const addresses = []
  const interfaces = os.networkInterfaces()
  for (let interface in interfaces) {
    for (let address of interfaces[interface]) {
      if (address.family === 'IPv4')
        addresses[interface] = address
    }
  }
  return addresses
})()
console.clear()
console.table(ips)
process.argv.filter(x => x.startsWith('--')).map(x => x.match(/--(\w+)=(.+)/).slice(1, 3)).forEach(([name, value]) => {
  if (name == 'http') http_port = value
  if (name == 'tcp') tcp_port = value
})

const sockets = []
const io_sockets = []
let last_id = 1

const emit = (raw_event, raw_payload) => {
  const { event, payload, skip = false } = transform.emit(raw_event, raw_payload)
  if (skip) return
  io_sockets.forEach(socket => socket.emit(event, payload))
  sockets.forEach(socket => socket.write(Buffer.from(`${transform.send(event, payload).join(' ')}\n`)))
}

const removeValue = (value, array) => () => {
  const index = array.findIndex(val => val === value)
  if (index != -1) array.splice(index, 1)
}

const tcp_server = net.createServer(socket => {
  emit('clear', '')
  sockets.push(socket)

  socket.on('close', removeValue(socket, sockets))
  socket.on('error', removeValue(socket, sockets))

  socket.id = last_id++
  socket.on('data', data => emit(...transform.parse(data.toString('utf8'))))
})

io.on('connection', socket => {
  emit('clear', '')
  io_sockets.push(socket)

  socket.on('disconnect', removeValue(socket, io_sockets))
  socket.on('*', ({ data: [event, data] }) => emit(event, data))
})

tcp_server.listen(tcp_port)
console.log(`TCP is now listening on port ${tcp_port}`)

http_server.listen(http_port);
console.log(`HTTP is now listening on port http://localhost:${http_port}`)