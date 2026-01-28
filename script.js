/**
 * Arc footer gradient – canvas animation ported from AnimatedGradient.tsx.
 * Speed and colors controlled via UI (speed select, colors textarea, eyedropper).
 */
(function () {
  var canvas = document.getElementById('gradient-canvas')
  if (!canvas) return

  var ctx = canvas.getContext('2d')
  if (!ctx) return

  var speedSelect = document.getElementById('speed-select')
  var speedDial = document.getElementById('speed-dial')
  var speedValueEl = document.getElementById('speed-value')
  var colorsTextarea = document.getElementById('colors-textarea')
  var colorPickersEl = document.getElementById('color-pickers')
  var hueDial = document.getElementById('hue-dial')
  var saturationDial = document.getElementById('saturation-dial')
  var lightnessDial = document.getElementById('lightness-dial')
  var hueValueEl = document.getElementById('hue-value')
  var saturationValueEl = document.getElementById('saturation-value')
  var lightnessValueEl = document.getElementById('lightness-value')

  function updateCanvasSize() {
    var wrap = canvas.parentElement
    if (wrap) {
      var rect = wrap.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
  }

  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)

  var startTime = performance.now()
  var duration = 9000
  var defaultHexes = [
    '#8B5CF6', '#B464C8', '#DC2626', '#FA8072',
    '#FF9A66', '#FF8C50', '#3B82F6', '#87CEFA'
  ]

  var colors = defaultHexes.map(hexToRgb).filter(Boolean)

  function hexToRgb(hex) {
    var m = (hex || '').trim().replace(/^#/, '').match(/^([0-9A-Fa-f]{6})$/)
    if (!m) return null
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16)
    }
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (x) {
      var s = Math.max(0, Math.min(255, Math.round(x))).toString(16)
      return s.length === 1 ? '0' + s : s
    }).join('')
  }

  function rgbToHsl(r, g, b) {
    r /= 255
    g /= 255
    b /= 255
    var max = Math.max(r, g, b)
    var min = Math.min(r, g, b)
    var h, s, l = (max + min) / 2
    if (max === min) {
      h = s = 0
    } else {
      var d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        default: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  function hslToRgb(h, s, l) {
    h = h / 360
    s = s / 100
    l = l / 100
    var r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s
      var p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  var speedSnapValues = [3000, 6000, 9000, 12000, 15000]

  function getDurationMs() {
    if (speedDial) {
      var n = parseInt(speedDial.value, 10)
      if (!isNaN(n)) return n
    }
    if (speedSelect) {
      var n = parseInt(speedSelect.value, 10)
      if (!isNaN(n)) return n
    }
    return duration
  }

  function msToLabel(ms) {
    return (ms / 1000) + 's'
  }

  function nearestSnapValue(ms) {
    var best = speedSnapValues[0]
    var bestDiff = Math.abs(ms - best)
    for (var i = 0; i < speedSnapValues.length; i++) {
      var d = Math.abs(ms - speedSnapValues[i])
      if (d < bestDiff) {
        bestDiff = d
        best = speedSnapValues[i]
      }
    }
    return best
  }

  function updateSpeedDisplay() {
    var ms = getDurationMs()
    if (speedValueEl) speedValueEl.textContent = msToLabel(ms)
    if (speedDial) speedDial.value = ms
    if (speedSelect) {
      speedSelect.value = String(nearestSnapValue(ms))
    }
  }

  function onSpeedDialInput() {
    var ms = parseInt(speedDial && speedDial.value, 10) || 9000
    if (speedValueEl) speedValueEl.textContent = msToLabel(ms)
    if (speedSelect) speedSelect.value = String(nearestSnapValue(ms))
    startTime = performance.now()
  }

  function onSpeedDialChange() {
    var ms = parseInt(speedDial && speedDial.value, 10) || 9000
    var snapped = nearestSnapValue(ms)
    if (speedDial) speedDial.value = snapped
    if (speedSelect) speedSelect.value = String(snapped)
    if (speedValueEl) speedValueEl.textContent = msToLabel(snapped)
    startTime = performance.now()
  }

  function onSpeedSelectChange() {
    var ms = parseInt(speedSelect && speedSelect.value, 10) || 9000
    if (speedDial) speedDial.value = ms
    if (speedValueEl) speedValueEl.textContent = msToLabel(ms)
    duration = ms
    startTime = performance.now()
  }

  function syncTextareaFromColors() {
    if (!colorsTextarea) return
    colorsTextarea.value = colors.map(function (c) {
      return rgbToHex(c.r, c.g, c.b)
    }).join(', ')
  }

  function parseTextareaIntoColors() {
    if (!colorsTextarea) return
    var parts = colorsTextarea.value.split(',').map(function (s) { return s.trim() }).filter(Boolean)
    var next = []
    for (var i = 0; i < parts.length; i++) {
      var rgb = hexToRgb(parts[i])
      if (rgb) next.push(rgb)
    }
    if (next.length > 0) {
      colors.length = 0
      colors.push.apply(colors, next)
      renderColorPickers()
    }
  }

  function getHslAdjust() {
    return {
      hueOffset: parseInt(hueDial && hueDial.value, 10) || 0,
      satScale: parseInt(saturationDial && saturationDial.value, 10) || 100,
      lightScale: parseInt(lightnessDial && lightnessDial.value, 10) || 100
    }
  }

  function applyGlobalHsl(c, hueOffset, satScale, lightScale) {
    var hsl = rgbToHsl(c.r, c.g, c.b)
    var h = (hsl.h + hueOffset) % 360
    if (h < 0) h += 360
    var s = Math.max(0, Math.min(100, (hsl.s * satScale) / 100))
    var l = Math.max(0, Math.min(100, (hsl.l * lightScale) / 100))
    return hslToRgb(h, s, l)
  }

  function getAdjustedColors() {
    var adj = getHslAdjust()
    return colors.map(function (c) {
      return applyGlobalHsl(c, adj.hueOffset, adj.satScale, adj.lightScale)
    })
  }

  function updateHslValueDisplays() {
    var adj = getHslAdjust()
    if (hueValueEl) hueValueEl.textContent = adj.hueOffset
    if (saturationValueEl) saturationValueEl.textContent = adj.satScale + '%'
    if (lightnessValueEl) lightnessValueEl.textContent = adj.lightScale + '%'
  }

  function onHslDialsInput() {
    updateHslValueDisplays()
  }

  var supportsEyeDropper = typeof window !== 'undefined' && window.EyeDropper

  function renderColorPickers() {
    if (!colorPickersEl) return
    colorPickersEl.innerHTML = ''
    for (var i = 0; i < colors.length; i++) {
      (function (index) {
        var c = colors[index]
        var hex = rgbToHex(c.r, c.g, c.b)
        var slot = document.createElement('div')
        slot.className = 'color-slot'
        slot.setAttribute('data-index', index)
        var input = document.createElement('input')
        input.type = 'color'
        input.value = hex
        input.setAttribute('aria-label', 'Color ' + (index + 1))
        input.addEventListener('input', function () {
          var hexNew = input.value
          var rgb = hexToRgb(hexNew)
          if (rgb) {
            colors[index] = rgb
            syncTextareaFromColors()
          }
        })
        slot.appendChild(input)
        if (supportsEyeDropper) {
          var btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'eyedropper-btn'
          btn.setAttribute('aria-label', 'Pick color from screen')
          btn.textContent = '⌖'
          btn.addEventListener('click', function () {
            var dropper = new window.EyeDropper()
            dropper.open().then(function (result) {
              var rgb = hexToRgb(result.sRGBHex)
              if (rgb) {
                colors[index] = rgb
                input.value = result.sRGBHex
                syncTextareaFromColors()
              }
            }).catch(function () {})
          })
          slot.appendChild(btn)
        }
        colorPickersEl.appendChild(slot)
      })(i)
    }
  }

  if (colorsTextarea) {
    syncTextareaFromColors()
    colorsTextarea.addEventListener('input', parseTextareaIntoColors)
    colorsTextarea.addEventListener('change', parseTextareaIntoColors)
  }

  if (speedDial) {
    speedDial.addEventListener('input', onSpeedDialInput)
    speedDial.addEventListener('change', onSpeedDialChange)
  }
  if (speedSelect) {
    speedSelect.addEventListener('change', onSpeedSelectChange)
  }

  var speedRestore = document.getElementById('speed-restore')
  if (speedRestore) {
    speedRestore.addEventListener('click', function (e) {
      e.preventDefault()
      if (speedDial) speedDial.value = 9000
      if (speedSelect) speedSelect.value = '9000'
      duration = 9000
      startTime = performance.now()
      updateSpeedDisplay()
    })
  }

  updateSpeedDisplay()

  var colorsRestore = document.getElementById('colors-restore')
  if (colorsRestore) {
    colorsRestore.addEventListener('click', function (e) {
      e.preventDefault()
      colors.length = 0
      colors.push.apply(colors, defaultHexes.map(hexToRgb).filter(Boolean))
      syncTextareaFromColors()
      renderColorPickers()
    })
  }

  var adjustRestore = document.getElementById('adjust-restore')
  if (adjustRestore) {
    adjustRestore.addEventListener('click', function (e) {
      e.preventDefault()
      if (hueDial) hueDial.value = 0
      if (saturationDial) saturationDial.value = 100
      if (lightnessDial) lightnessDial.value = 100
      updateHslValueDisplays()
    })
  }

  if (hueDial) hueDial.addEventListener('input', onHslDialsInput)
  if (saturationDial) saturationDial.addEventListener('input', onHslDialsInput)
  if (lightnessDial) lightnessDial.addEventListener('input', onHslDialsInput)

  renderColorPickers()
  updateHslValueDisplays()

  var animationFrame

  function drawGradient() {
    var durationMs = getDurationMs()
    var width = canvas.width
    var height = canvas.height
    var centerX = width / 2
    var centerY = height

    ctx.clearRect(0, 0, width, height)

    var adjustedColors = getAdjustedColors()
    var numColors = adjustedColors.length
    if (numColors === 0) {
      animationFrame = requestAnimationFrame(drawGradient)
      return
    }

    var smallerDimension = Math.min(width, height)
    var isMobile = width < 768
    var mobileScaleFactor = isMobile ? 1.5 : 1.0
    var maxRadius = smallerDimension * 1.2825 * mobileScaleFactor

    var gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)

    var elapsed = (performance.now() - startTime) % durationMs
    var progress = elapsed / durationMs
    var reverseProgress = 1 - progress

    var colorStart = 0.0
    var outerColorEnd = 0.5
    var colorRange = outerColorEnd - colorStart
    var numSteps = 100
    var outerFadeZone = 0.3

    for (var i = 0; i <= numSteps; i++) {
      var t = i / numSteps
      var position = colorStart + t * colorRange
      var colorShift = reverseProgress * (numColors - 1)
      var colorT = (t * (numColors - 1) + colorShift) % (numColors - 1)
      var colorIndex1 = Math.floor(colorT)
      var colorIndex2 = (colorIndex1 + 1) % numColors
      var blendFactor = colorT - colorIndex1

      var color1 = adjustedColors[colorIndex1]
      var color2 = adjustedColors[colorIndex2]
      if (!color1 || !color2) continue
      var r = Math.round(color1.r + (color2.r - color1.r) * blendFactor)
      var g = Math.round(color1.g + (color2.g - color1.g) * blendFactor)
      var b = Math.round(color1.b + (color2.b - color1.b) * blendFactor)

      var distanceFromOuter = outerColorEnd - position
      var opacity = 1
      if (distanceFromOuter < outerFadeZone && distanceFromOuter >= 0) {
        var fadeProgress = distanceFromOuter / outerFadeZone
        opacity = Math.pow(fadeProgress, 1.5)
      }
      opacity = Math.max(0, Math.min(1, opacity))
      if (opacity > 0.01) {
        gradient.addColorStop(position, 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')')
      }
    }

    if (numSteps > 0 && numColors > 0) {
      var firstColorT = (reverseProgress * (numColors - 1)) % (numColors - 1)
      var firstColorIndex1 = Math.floor(firstColorT)
      var firstColorIndex2 = (firstColorIndex1 + 1) % numColors
      var firstBlendFactor = firstColorT - firstColorIndex1
      var firstColor1 = adjustedColors[firstColorIndex1]
      var firstColor2 = adjustedColors[firstColorIndex2]
      if (firstColor1 && firstColor2) {
        var firstR = Math.round(firstColor1.r + (firstColor2.r - firstColor1.r) * firstBlendFactor)
        var firstG = Math.round(firstColor1.g + (firstColor2.g - firstColor1.g) * firstBlendFactor)
        var firstB = Math.round(firstColor1.b + (firstColor2.b - firstColor1.b) * firstBlendFactor)
        gradient.addColorStop(0, 'rgba(' + firstR + ',' + firstG + ',' + firstB + ',1)')
      }
    }

    gradient.addColorStop(outerColorEnd, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    var overlayMaxRadius = smallerDimension * 1.2825 * mobileScaleFactor
    var overlayGradient = ctx.createRadialGradient(
      centerX, centerY, overlayMaxRadius * 0.1,
      centerX, centerY, overlayMaxRadius
    )
    overlayGradient.addColorStop(0, 'rgba(0,0,0,0)')
    overlayGradient.addColorStop(0.15, 'rgba(0,0,0,0)')
    overlayGradient.addColorStop(0.28, 'rgba(0,0,0,0.01)')
    overlayGradient.addColorStop(0.38, 'rgba(0,0,0,0.025)')
    overlayGradient.addColorStop(0.46, 'rgba(0,0,0,0.045)')
    overlayGradient.addColorStop(0.53, 'rgba(0,0,0,0.07)')
    overlayGradient.addColorStop(0.59, 'rgba(0,0,0,0.1)')
    overlayGradient.addColorStop(0.64, 'rgba(0,0,0,0.14)')
    overlayGradient.addColorStop(0.69, 'rgba(0,0,0,0.19)')
    overlayGradient.addColorStop(0.73, 'rgba(0,0,0,0.25)')
    overlayGradient.addColorStop(0.77, 'rgba(0,0,0,0.32)')
    overlayGradient.addColorStop(0.81, 'rgba(0,0,0,0.4)')
    overlayGradient.addColorStop(0.84, 'rgba(0,0,0,0.48)')
    overlayGradient.addColorStop(0.87, 'rgba(0,0,0,0.57)')
    overlayGradient.addColorStop(0.9, 'rgba(0,0,0,0.66)')
    overlayGradient.addColorStop(0.92, 'rgba(0,0,0,0.74)')
    overlayGradient.addColorStop(0.94, 'rgba(0,0,0,0.81)')
    overlayGradient.addColorStop(0.96, 'rgba(0,0,0,0.87)')
    overlayGradient.addColorStop(0.97, 'rgba(0,0,0,0.91)')
    overlayGradient.addColorStop(0.98, 'rgba(0,0,0,0.94)')
    overlayGradient.addColorStop(0.99, 'rgba(0,0,0,0.97)')
    overlayGradient.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = overlayGradient
    ctx.fillRect(0, 0, width, height)

    animationFrame = requestAnimationFrame(drawGradient)
  }

  drawGradient()

  window.addEventListener('beforeunload', function () {
    if (animationFrame) cancelAnimationFrame(animationFrame)
  })
})()
