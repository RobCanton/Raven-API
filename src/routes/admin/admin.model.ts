export interface NewsTopic {
  name: string
  queryItems:NewsTopicQueryItem[]
}

export interface NewsTopicQueryItem {
  key:string
  value: string
}
