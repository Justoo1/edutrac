import { Document, Page, pdf, Font } from '@react-pdf/renderer'

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.ttf', fontWeight: 'bold' },
  ],
})

export async function generatePDF(element: React.ReactElement) {
  const blob = await pdf(element).toBlob()
  return blob
} 