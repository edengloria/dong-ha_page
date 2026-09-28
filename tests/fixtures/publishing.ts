import type { PublishingData } from '../../lib/publishing/query'
import type { BodyBlock, Post } from '../../lib/publishing/types'

// Synthetic, build-only content. DOCUMENT_VISUAL_TEST builds cannot be deployed.
const optics = { _id: 'fixture.topic.optics', title: 'Optics', slug: { current: 'optics' } }
const pytorch = { _id: 'fixture.tag.pytorch', title: 'PyTorch', slug: { current: 'pytorch' } }
const series = { _id: 'fixture.series.optics', title: 'Fourier Optics Notes', slug: { current: 'fourier-optics' } }
const paragraph = (key: string, text: string, style = 'normal'): BodyBlock => ({ _type: 'block', _key: key, style, markDefs: [], children: [{ _type: 'span', _key: `${key}-text`, text, marks: [] }] })
const body: BodyBlock[] = [
  paragraph('intro', '정적 HTML 검증용 기술 글입니다. Korean prose and English terminology remain readable without JavaScript.'),
  paragraph('theory', '전파 모델 / Propagation model', 'h2'),
  { _type: 'block', _key: 'inline', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 'inline-text', text: 'Inline equation: ', marks: [] }, { _type: 'inlineMath', _key: 'phase', latex: 'e^{ik_z z}' }] },
  { _type: 'equation', _key: 'propagation', latex: 'U_z=\\mathcal{F}^{-1}\\{\\mathcal{F}\\{U_0\\}H_z\\}', numbered: true },
  paragraph('implementation', '구현 / Implementation', 'h2'),
  { _type: 'codeBlock', _key: 'python', source: { code: 'import torch\nspectrum = torch.fft.fft2(field)', language: 'python', filename: 'propagation.py', highlightedLines: [2] } },
  { _type: 'table', _key: 'units', caption: 'Variables and units', header: true, rows: [{ _key: 'head', cells: ['Variable', 'Unit'] }, { _key: 'distance', cells: ['z', 'm'] }] },
  { _type: 'callout', _key: 'note', tone: 'note', title: '검증 조건', body: [paragraph('conditions', '이 예제는 브라우저·정적 렌더링 검증용이며 실험 결과가 아닙니다.') as Extract<BodyBlock, { _type: 'block' }>] },
  { _type: 'figure', _key: 'gaussian', asset: { _ref: 'image-d744e8477497d2428478953054d6336faed2ca0e-1200x800-png' }, caption: 'Analytical Gaussian reference used for layout validation.', alt: 'Normalized Gaussian intensity at three propagation distances.', layout: 'wide', numbered: true },
]
const base: Post = { _id: 'fixture.ko.asm', _type: 'post', title: 'Angular Spectrum Method 구현 노트', excerpt: '수식, Python 코드와 과학 그림을 포함하는 정적 렌더링 검증용 글입니다.', slug: { current: 'angular-spectrum-method' }, language: 'ko', articleType: 'tutorial', body, projects: ['pado'], topics: [optics], tags: [pytorch], series, seriesOrder: 1, authors: [{ _id: 'fixture.author', name: 'Dong-Ha Shin' }], references: [{ _id: 'fixture.paper', title: 'Band-Limited Angular Spectrum Method for Numerical Simulation of Free-Space Propagation in Far and Near Fields', authors: ['Kyoji Matsushima', 'Tomoyoshi Shimobaba'], venue: 'Optics Express', year: 2009, doi: '10.1364/OE.17.019662' }], publishedAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-02T00:00:00Z' }
export const publishingFixture: PublishingData = {
  posts: [base, { ...base, _id: 'fixture.en.asm', language: 'en', title: 'Angular Spectrum Method in PyTorch', excerpt: 'A static rendering fixture with equations, Python, and scientific figures.', translationOf: { _ref: base._id } }, { ...base, _id: 'fixture.ko.sampling', title: '전파 커널의 샘플링', slug: { current: 'propagation-sampling' }, articleType: 'research-note', seriesOrder: 2, publishedAt: '2026-09-03T00:00:00Z', updatedAt: '2026-09-03T00:00:00Z', body: [...body, { _type: 'demo', _key: 'asm-demo', kind: 'angular-spectrum', wavelength: 532, distance: 30 }] }],
  topics: [optics], tags: [pytorch], series: [series],
}
