// One instanced draw for all beams. Keep the same seven gradient stops as Canvas 2D.
const VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec4 geometry;
layout(location=1) in vec4 appearance;
uniform vec2 viewport;
out vec4 color;
const float stops[7] = float[7](0., .1, .28, .5, .72, .9, 1.);
const float saturation[7] = float[7](.58, .56, .54, .52, .54, .56, .58);
const float lightness[7] = float[7](.42, .48, .54, .60, .54, .48, .42);
const float opacity[7] = float[7](0., .12, .42, .72, .42, .12, 0.);
vec3 hsl(float h, float s, float l) {
  vec3 rgb = clamp(abs(mod(h * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.);
  return l + (rgb - .5) * (1. - abs(2. * l - 1.)) * s;
}
void main() {
  int stop = gl_VertexID / 2;
  vec2 local = vec2((float(gl_VertexID % 2) - .5) * geometry.z, stops[stop] * geometry.w);
  float c = cos(appearance.x), s = sin(appearance.x);
  vec2 position = geometry.xy + mat2(c, s, -s, c) * local;
  gl_Position = vec4(position / viewport * vec2(2., -2.) + vec2(-1., 1.), 0., 1.);
  color = vec4(hsl(appearance.y / 360., saturation[stop], lightness[stop]), opacity[stop] * appearance.z);
}`

const FRAGMENT = `#version 300 es
precision highp float;
in vec4 color;
out vec4 outputColor;
void main() {
  outputColor = vec4(color.rgb * color.a, color.a);
}`

export interface BeamRenderer {
  begin: (width: number, height: number) => void
  beam: (x: number, y: number, width: number, length: number, angle: number, hue: number, opacity: number) => void
  end: () => void
  clear: () => void
  dispose: () => void
}

export function createBeamRenderer(canvas: HTMLCanvasElement, capacity: number): BeamRenderer | null {
  let gl: WebGL2RenderingContext | null = null
  try {
    gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false, // The existing CSS blur smooths the beam edges.
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: true,
    })
  } catch {
    return null
  }
  if (!gl) return null
  const context = gl
  const shaders: WebGLShader[] = []
  const program = gl.createProgram()
  const buffer = gl.createBuffer()
  const vao = gl.createVertexArray()
  const dispose = () => {
    shaders.forEach((shader) => context.deleteShader(shader))
    context.deleteProgram(program)
    context.deleteBuffer(buffer)
    context.deleteVertexArray(vao)
  }

  try {
    if (!program || !buffer || !vao) throw new Error("WebGL allocation failed")
    for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]] as const) {
      const shader = gl.createShader(type)
      if (!shader) throw new Error("Shader allocation failed")
      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader compilation failed")
      gl.attachShader(program, shader)
    }
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Shader linking failed")

    const data = new Float32Array(capacity * 8)
    let count = 0
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
    for (let attribute = 0; attribute < 2; attribute += 1) {
      gl.enableVertexAttribArray(attribute)
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 32, attribute * 16)
      gl.vertexAttribDivisor(attribute, 1)
    }
    gl.useProgram(program)
    const viewport = gl.getUniformLocation(program, "viewport")
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    return {
      begin(width, height) {
        count = 0
        context.viewport(0, 0, canvas.width, canvas.height)
        context.uniform2f(viewport, width, height)
        context.clear(context.COLOR_BUFFER_BIT)
      },
      beam(x, y, width, length, angle, hue, opacity) {
        if (count >= capacity) return
        const offset = count++ * 8
        data[offset] = x
        data[offset + 1] = y
        data[offset + 2] = width
        data[offset + 3] = length
        data[offset + 4] = angle
        data[offset + 5] = hue
        data[offset + 6] = opacity
      },
      end() {
        if (!count) return
        context.bufferSubData(context.ARRAY_BUFFER, 0, data, 0, count * 8)
        context.drawArraysInstanced(context.TRIANGLE_STRIP, 0, 14, count)
      },
      clear() { context.clear(context.COLOR_BUFFER_BIT) },
      dispose,
    }
  } catch {
    dispose()
    return null
  }
}
