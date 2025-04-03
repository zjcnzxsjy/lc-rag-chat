export type DocMetaType = {
  type: string
  id: string
}

export interface IRagInstance {
  addText: (text: string, meta: DocMetaType) => Promise<void>
  query: (question: string) => Promise<string>
}
