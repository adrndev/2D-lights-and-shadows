const canvas = document.querySelector('#canvas')

const polygons = [
  [
    { x:100, y:100 },
    { x:200, y:100 },
    { x:200, y:200 },
    { x:100, y:200 }
  ],
  [
    { x:250, y:250 },
    { x:250, y:350 },
    { x:350, y:350 },
    { x:350, y:150 },
    { x:250, y:250 }
  ],
  [
    { x:75, y:350 },
    { x:280, y:410 },
    { x:140, y:450 },
    { x:32, y:350 }
  ]
]

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  moving: {
    left: false,
    right: false,
    up: false,
    down: false
  },
  fov: 150,
  setMovement(btn, state) {
    const directions = {
      'KeyD': 'right',
      'KeyA': 'left',
      'KeyW': 'up',
      'KeyS': 'down'
    }
    const direction = directions[btn]

    this.moving[direction] = state
  }
}

const mouse = {
  x: 0,
  y: 0
}

const drawPolygons = () => {
  const ctx = canvas.getContext('2d')

  for (let polygon of polygons) {
    ctx.beginPath()

    for (let [pointIndex, point] of polygon.entries()) {
      if (pointIndex === 0)
        ctx.moveTo(point.x, point.y)
      else
        ctx.lineTo(point.x, point.y)
    }

    ctx.lineTo(polygon[0].x, polygon[0].y)
    ctx.fillStyle = 'lightgray'
    ctx.fill()
    ctx.closePath()
  }
}

const drawDarkness = () => {
  const ctx = canvas.getContext('2d')

  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "rgba(0,0,0,0.5)"
  ctx.fill()
}

const drawLight = (rays) => {
  const ctx = canvas.getContext('2d')

  let lastLine = null

  ctx.beginPath()

  for (let ray of rays) {
    ctx.strokeStyle = "transparent"
    ctx.moveTo(player.x, player.y)
    ctx.lineTo(ray.x, ray.y)

    if (lastLine !== null) {
      ctx.lineTo(lastLine.x, lastLine.y)
    }

    ctx.stroke()

    lastLine = {
      x: ray.x,
      y: ray.y
    }
  }

  ctx.save()
  ctx.globalCompositeOperation = "lighter"

  const angle = Math.atan2(player.x - mouse.x, player.y - mouse.y)
  const gradient = ctx.createRadialGradient(
    player.x,
    player.y,
    1,
    player.x + angle,
    player.y + angle,
    300
  )

  gradient.addColorStop(0, "rgba(255,255,224, 0.4)")
  gradient.addColorStop(1, "transparent")

  ctx.fillStyle = gradient
  ctx.fill()
  ctx.restore()
  ctx.closePath()
}

const drawCanvas = () => {
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawPolygons()
  drawDarkness()

  const rays = castRays()
  drawLight(rays)
}

const init = () => {
  document.addEventListener('keyup', (ev) => player.setMovement(ev.code, false))
  document.addEventListener('keydown', (ev) => player.setMovement(ev.code, true))
  document.addEventListener('mousemove', (ev) => {
    mouse.x = ev.clientX
    mouse.y = ev.clientY
  })

  update()
}

const isIntersecting = (a, b, c, d) => {
    const denominator = ((b.X - a.X) * (d.Y - c.Y)) - ((b.Y - a.Y) * (d.X - c.X))
    const numerator1 = ((a.Y - c.Y) * (d.X - c.X)) - ((a.X - c.X) * (d.Y - c.Y))
    const numerator2 = ((a.Y - c.Y) * (b.X - a.X)) - ((a.X - c.X) * (b.Y - a.Y))

    if (denominator == 0) return numerator1 == 0 && numerator2 == 0

    const r = numerator1 / denominator
    const s = numerator2 / denominator

    return {
        x: a.X + (r * (b.X - a.X)),
        y: a.Y + (r * (b.Y - a.Y)),
        seg1: r >= 0 && r <= 1,
        seg2: s >= 0 && s <= 1
    }
}

function getIntersections(dx, dy) {
  const intersections = []

  for (let polygon of polygons) {
    for(let [pointIndex, point] of polygon.entries()) {
      const nextPointIndex = pointIndex === polygon.length - 1 ? 0 : pointIndex + 1

      let intersection = isIntersecting(
        { X: player.x, Y: player.y },
        { X: dx, Y: dy },
        { X: point.x, Y: point.y },
        { X: polygon[nextPointIndex].x, Y: polygon[nextPointIndex].y }
      )

      if(intersection.seg1 == true && intersection.seg2 == true) {
        intersections.push({ square: point, x: intersection.x, y: intersection.y })
      }
    }
  }

  return intersections
}

const castRays = () => {
  const rays = []

  let angle = Math.atan2(player.x - mouse.x, player.y - mouse.y)

  for (let i = 0; i < 240; i++) {
    let dirX = 200 * Math.cos(-angle + 150) + player.x,
        dirY = 200 * Math.sin(-angle + 150) + player.y

    angle += 0.005
    let intersections = getIntersections(dirX, dirY)
    
    if (intersections.length > 0) {
      for (let intersection of intersections) {
        intersection.distance = Math.sqrt(
          Math.pow(player.x - intersection.x, 2) + Math.pow(player.y - intersection.y, 2)
        )
      }

      intersections.sort(function(a, b) {
        return parseFloat(a.distance) - parseFloat(b.distance)
      })

      rays.push({ x: intersections[0].x, y: intersections[0].y })
    } else {
      rays.push({ x: dirX, y: dirY })
    }
  }

  return rays
}

const update = () => {
  requestAnimationFrame(update)

  for (let [direction, value] of Object.entries(player.moving)) {
    if (value === true) {
      if (direction === 'left' || direction === 'right') {
        player.x += direction === 'left' ? -1 : 1
      }

      if (direction === 'up' || direction === 'down') {
        player.y += direction === 'up' ? -1 : 1
      }
    }
  }

  drawCanvas()
}

document.body.onload = init