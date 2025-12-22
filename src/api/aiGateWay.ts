import axios from 'axios'

export const aiGateway = axios.create({
  baseURL: 'https://zipppier-henry-bananas.ngrok-free.dev/',
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
})

export async function generateDescriptionFromImage(
  imageUrl: string,
  prompt: string
): Promise<string> {
  // tải ảnh hiện tại về blob
  const imgRes = await fetch(imageUrl)
  const blob = await imgRes.blob()

  const file = new File([blob], 'image.jpg', { type: blob.type })

  const formData = new FormData()
  formData.append('image', file)
  formData.append('prompt', prompt)

  const res = await aiGateway.post('custom_describe', formData)

  return res.data.result
}
