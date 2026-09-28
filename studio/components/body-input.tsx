import type { PortableTextInputProps } from 'sanity'
import './writing.css'

export function BodyInput(props: PortableTextInputProps) {
  return <div className="research-editor">{props.renderDefault(props)}</div>
}
