/** Idempotent, draft-only authoring fixture. Never publishes or replaces an edited draft. */
import { getCliClient } from 'sanity/cli'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { apiVersion } from '../lib/publishing/types'

const client = getCliClient({ apiVersion })
if (await client.getDocument('drafts.authoring-proof-asm')) {
  console.log('Authoring draft already exists; preserving all editor changes.')
} else {
  const w0 = 0.08e-3, wavelength = 532e-9, rayleigh = Math.PI * w0 ** 2 / wavelength
  const curves = [0, 0.03, 0.06].map((z, index) => {
    const broadening = 1 + (z / rayleigh) ** 2
    const points = Array.from({ length: 400 }, (_, i) => {
      const x = (i / 399 - 0.5) * 1e-3
      const intensity = Math.exp(-2 * x ** 2 / (w0 ** 2 * broadening)) / broadening
      return `${110 + i / 399 * 930},${630 - intensity * 450}`
    }).join(' ')
    const color = ['#233e94', '#7746ad', '#cd6b35'][index]
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="4"/><text x="770" y="${160 + index * 40}" fill="${color}" font-size="24">z = ${z * 1000} mm</text>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="white"/><g font-family="Arial,sans-serif" fill="#25253b"><text x="110" y="70" font-size="32" font-weight="bold">Gaussian beam: analytic reference</text><text x="110" y="108" font-size="22">w0 = 80 um; wavelength = 532 nm; intensity relative to input peak</text>${[0,.25,.5,.75,1].map(t=>`<line x1="110" x2="1040" y1="${630-t*450}" y2="${630-t*450}" stroke="#dedede"/><text x="60" y="${638-t*450}" font-size="21">${t}</text>`).join('')}<path d="M110 160V630H1040" stroke="#333" stroke-width="2" fill="none"/>${[-.5,-.25,0,.25,.5].map(t=>`<text x="${110+(t+.5)*930}" y="670" text-anchor="middle" font-size="22">${t}</text>`).join('')}${curves}<text x="560" y="720" text-anchor="middle" font-size="26">x [mm]</text><text x="110" y="772" font-size="18" fill="#666">Analytic paraxial Gaussian model; not an experimental measurement or an ASM benchmark.</text></g></svg>`
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  const folder = resolve('../.visual-baseline/authoring')
  await mkdir(folder, { recursive: true })
  await writeFile(resolve(folder, 'gaussian-reference.png'), png)
  const asset = await client.assets.upload('image', png, { filename: 'gaussian-reference.png', contentType: 'image/png' })
  await client.createIfNotExists({ _id: 'reference-band-limited-asm', _type: 'referenceRecord', title: 'Band-limited angular spectrum method for numerical simulation of free-space propagation in far and near fields', authors: ['Kyoji Matsushima', 'Tomoyoshi Shimobaba'], venue: 'Optics Express', year: 2009, doi: '10.1364/OE.17.019662', url: 'https://doi.org/10.1364/OE.17.019662' })
  await client.createIfNotExists({ _id: 'reference-pytorch-fft', _type: 'referenceRecord', title: 'torch.fft — PyTorch documentation', authors: ['PyTorch contributors'], url: 'https://docs.pytorch.org/docs/stable/fft.html' })
  let count = 0
  const span = (text: string, marks: string[] = []) => ({ _type: 'span', _key: `s${++count}`, text, marks })
  const p = (text: string, style = 'normal') => ({ _type: 'block', _key: `b${++count}`, style, markDefs: [], children: [span(text)] })
  const python = `import math
import torch

def angular_spectrum(u0, wavelength, dx, z):
    """Propagate a sampled complex field; evanescent waves are discarded.

    u0: complex tensor [..., height, width]
    wavelength, dx, z: SI units; z >= 0
    """
    if not u0.is_complex() or u0.ndim < 2:
        raise ValueError("u0 must be a 2D or batched complex field")
    if wavelength <= 0 or dx <= 0 or z < 0:
        raise ValueError("Expected wavelength > 0, dx > 0, z >= 0")
    height, width = u0.shape[-2:]
    fy = torch.fft.fftfreq(height, dx, device=u0.device,
                          dtype=u0.real.dtype)[:, None]
    fx = torch.fft.fftfreq(width, dx, device=u0.device,
                          dtype=u0.real.dtype)[None, :]
    q = 1 - (wavelength * fx)**2 - (wavelength * fy)**2
    kz = (2 * math.pi / wavelength) * torch.sqrt(q.clamp_min(0))
    transfer = torch.polar(torch.ones_like(kz), kz * z) * (q >= 0)
    spectrum = torch.fft.fft2(u0, norm="ortho")
    return torch.fft.ifft2(spectrum * transfer, norm="ortho")`
  await client.createIfNotExists({
    _id: 'drafts.authoring-proof-asm', _type: 'post',
    title: 'Angular Spectrum Method를 PyTorch로 구현하기',
    slug: { _type: 'slug', current: 'angular-spectrum-method-pytorch' }, language: 'ko', articleType: 'tutorial',
    excerpt: '복소 광장의 공간 주파수 표현부터 PyTorch 구현까지. 샘플링과 경계 조건을 명시하고, Gaussian beam을 기준으로 계산을 점검하는 기술 글 작성 예제입니다.',
    authors: [{ _type: 'reference', _ref: 'author-dong-ha-shin', _key: 'author' }],
    topics: ['optics', 'programming'].map(slug => ({ _type: 'reference', _ref: `topic-${slug}`, _key: slug })),
    tags: ['pytorch', 'wave-optics'].map(slug => ({ _type: 'reference', _ref: `tag-${slug}`, _key: slug })),
    references: ['band-limited-asm', 'pytorch-fft'].map(id => ({ _type: 'reference', _ref: `reference-${id}`, _key: id })),
    body: [
      { _type: 'callout', _key: 'scope', tone: 'note', title: '작성 환경 검증용 초안', body: [p('이 글은 CMS에서 수식, 그림, 코드, 표와 인용을 함께 작성하는 흐름을 확인하기 위한 예제입니다. 그림은 해석적 모델로 생성했으며, 실험 결과나 실제 PyTorch 실행 성능을 보고하는 글이 아닙니다.')] },
      p('1. 복소 광장을 전파한다', 'h2'),
      p('Angular Spectrum Method(ASM)는 광장을 평면파의 합으로 표현하고 각 공간 주파수 성분에 전파 위상을 곱하는 방법이다. 여기서는 균일한 매질에서의 단색 scalar field를 다룬다. 편광 결합이나 미세구조 내부의 전자기 상호작용까지 계산하는 full-wave 해석은 아니다.'),
      { _type: 'block', _key: 'inline-example', style: 'normal', markDefs: [], children: [span('시간 의존성을 '), { _type: 'inlineMath', _key: 'time-convention', latex: 'e^{-i\\omega t}' }, span('로 두면, +z 방향으로 진행하는 성분의 전파 인자는 '), { _type: 'inlineMath', _key: 'propagator-inline', latex: 'e^{ik_z z}' }, span('이다. FFT의 주파수 배열 순서와 이 부호를 함께 확인하는 것이 중요하다.')] },
      p('2. 전파 커널과 단위', 'h2'),
      { _type: 'equation', _key: 'asm-equation', latex: 'U(x,y;z)=\\mathcal{F}^{-1}\\!\\left[\\mathcal{F}\\{U(x,y;0)\\}\\exp\\!\\left(i\\frac{2\\pi z}{\\lambda}\\sqrt{1-(\\lambda f_x)^2-(\\lambda f_y)^2}\\right)\\right]', numbered: true, label: 'Angular spectrum propagation' },
      p('파장, 픽셀 간격, 전파 거리는 모두 m 단위로 넣는다. fftfreq는 cycles/m 단위의 공간 주파수를 반환하므로, 파수로 바꿀 때 2π가 필요하다. 아래 구현은 전파 가능한 성분만 남기고 evanescent 성분은 제거한다.'),
      { _type: 'table', _key: 'units', header: true, caption: '구현에서 사용하는 변수와 단위', rows: [{ _type: 'tableRow', _key: 'head', cells: ['변수', '의미', '단위'] }, { _type: 'tableRow', _key: 'lambda', cells: ['wavelength', '매질 내 파장', 'm'] }, { _type: 'tableRow', _key: 'dx', cells: ['dx', '등방성 샘플 간격', 'm / pixel'] }, { _type: 'tableRow', _key: 'z', cells: ['z', '전파 거리', 'm'] }] },
      p('3. PyTorch 구현', 'h2'),
      p('torch.fft.fft2와 fftfreq는 모두 shift하지 않은 배열 순서를 사용한다. 따라서 여기에서는 fftshift를 넣지 않는다. 시각화를 위해 spectrum을 중앙 정렬하더라도 실제 전파 계산에 쓰는 배열과 구분해야 한다.'),
      { _type: 'codeBlock', _key: 'python-asm', source: { _type: 'code', language: 'python', filename: 'angular_spectrum.py', code: python, highlightedLines: [19, 20, 21] }, caption: '기본 ASM 예제. 배열 경계의 주기성과 aliasing을 자동으로 해결하는 구현은 아니다.' },
      { _type: 'callout', _key: 'sampling-warning', tone: 'warning', title: 'FFT 경계와 전파 커널 샘플링', body: [p('이산 FFT는 계산 창을 주기적으로 반복한 신호로 해석한다. 전파된 광장이 창 밖으로 퍼지면 반대쪽으로 감겨 들어올 수 있다. Zero padding, 출력 영역 제한, band-limited ASM 등은 목적과 샘플링 조건에 맞게 별도로 설계해야 한다.')] },
      p('4. 해석적 기준과 비교하기', 'h2'),
      p('먼저 충분히 넓은 계산 창에서 Gaussian beam을 전파하고 paraxial 해석해와 비교할 수 있다. 아래 그림은 해석해 자체를 그린 참고 그림이다. 실제 ASM 오차를 평가하려면 같은 입력과 샘플 간격으로 계산한 결과를 별도로 비교해야 한다.'),
      { _type: 'figure', _key: 'gaussian-figure', asset: { _type: 'reference', _ref: asset._id }, alt: '532 nm, waist 80 micrometer Gaussian beam의 0, 30, 60 mm 전파 거리별 정규화 intensity 곡선. 거리가 증가하면 폭이 넓어지고 중심 intensity가 낮아진다.', caption: 'Paraxial Gaussian beam의 해석적 기준. 입력 중심 intensity로 정규화했으며, 각 곡선을 독립적으로 재정규화하지 않았다.', credit: 'Generated for the dhsh.in authoring proof', layout: 'wide', numbered: true, expandable: true },
      { _type: 'equation', _key: 'rayleigh-equation', latex: 'w(z)=w_0\\sqrt{1+\\left(\\frac{z}{z_R}\\right)^2},\\qquad z_R=\\frac{\\pi w_0^2}{\\lambda}', numbered: true, label: 'Gaussian beam width' },
      p('5. 다음 단계', 'h2'),
      { _type: 'block', _key: 'citation-example', style: 'normal', markDefs: [{ _type: 'citation', _key: 'cite-blasm', reference: { _type: 'reference', _ref: 'reference-band-limited-asm' } }], children: [span('전파 거리가 길어질 때 커널의 빠른 위상 변화를 어떻게 샘플링할지 검토하려면 band-limited ASM 문헌을 함께 읽는 것이 좋다.', ['cite-blasm'])] },
      { _type: 'block', _key: 'pytorch-link', style: 'normal', markDefs: [{ _type: 'link', _key: 'torch-link', href: 'https://docs.pytorch.org/docs/stable/fft.html' }], children: [span('FFT API의 정확한 정규화 규칙과 데이터 형식은 '), span('PyTorch 공식 문서', ['torch-link']), span('에서 확인한다.')] },
    ],
  })
  console.log(`Authoring draft created with an original scientific figure: ${asset.url}`)
}
