const socket = io.connect('http://localhost:8000');
const canvas = document.createElement('canvas')

const display = document.createElement('canvas')
const LCD_X_SIZE = canvas.width = display.width = 480
const LCD_Y_SIZE = canvas.height = display.height = 272
display.style.border = 'solid 1px'
document.body.append(display)
const c = canvas.getContext('2d')
const d = display.getContext('2d')

socket.on('draw', (data) => {
  const [r, g, b, R, x, y] = data
  c.beginPath()
  c.arc(x, y, R, 0, 2 * Math.PI)
  c.fillStyle = `rgb(${r},${g},${b})`
  c.fill()
})
socket.on('clear', () => {
  c.fillStyle = '#f1f1f1'
  c.fillRect(0, 0, LCD_X_SIZE, LCD_Y_SIZE)
  c.fillStyle = '#f00'
})

let mouse_down = false, mouse_x = -1000, mouse_y = -1000, last_mouse_x, last_mouse_y
display.addEventListener('mousemove', e => {
  mouse_x = e.offsetX
  mouse_y = e.offsetY
})

window.addEventListener('mouseup', e => {
  mouse_down = false
})

display.addEventListener('mousedown', e => {
  mouse_x = e.offsetX
  mouse_y = e.offsetY
  mouse_down = true
})

function hslToRgb(h, s, l) {
  h /= 360
  s /= 100
  l /= 100
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

let size = 10
let color = [230, 78, 77]
let last_i = -1

const in_range = (min, max, val) => val >= min && val <= max

c.fillStyle = '#f1f1f1'
c.fillRect(0, 0, LCD_X_SIZE, LCD_Y_SIZE)
c.fillStyle = '#f00'
function draw() {
  d.fillStyle = '#f1f1f1'
  d.drawImage(canvas, 0, 0)
  c.fillStyle = '#d3d3d3'
  for (let i = 0; i < 2; i++) {
    d.fillStyle = '#d3d3d3'
    d.fillRect(5, i * 25 + 5, 20, 20)
  }
  d.fillStyle = `rgb(${hslToRgb(...color)})`
  d.fillRect(5, 2 * 25 + 5, 20, 20)
  d.fillStyle = `hsl(${color[0]}, 100%, 50%)`
  d.fillRect(5, 5 + (0 + 3) * 25, 20, 20)
  d.fillStyle = `hsl(${color[0]}, ${color[1]}%, 50%)`
  d.fillRect(5, 5 + (1 + 3) * 25, 20, 20)
  d.fillStyle = `hsl(0, 0%, ${color[2]}%)`
  d.fillRect(5, 5 + (2 + 3) * 25, 20, 20)
  if (mouse_down) {
    if (in_range(5, 30, mouse_x)) {
      let i = Math.round((mouse_y - 5) / 30)
      if (i == 0) size++
      else if (i == 1) size = Math.max(3, size - 1)
      else if (i == 2 && last_i != 2) socket.emit('clear')
      else if (i == 3) color[0] = (color[0] + 1) % 360
      else if (i == 4) color[1] = (color[1] + 1) % 100
      else if (i == 5) color[2] = (color[2] + 1) % 100
      last_i = i
    }
    else if (mouse_x != last_mouse_x || mouse_y != last_mouse_y) {
      socket.emit('draw', [...hslToRgb(...color), size, mouse_x, mouse_y])
      last_mouse_x = mouse_x
      last_mouse_y = mouse_y
    }
  } else if (!in_range(5, 30, mouse_x)) {

    d.strokeStyle = '#1f1f1f'
    d.beginPath()
    d.arc(mouse_x, mouse_y, size, 0, 2 * Math.PI)
    d.closePath()
    d.stroke()
  }
  requestAnimationFrame(draw)
}

draw()