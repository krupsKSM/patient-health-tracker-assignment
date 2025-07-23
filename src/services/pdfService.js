const PDFDocument = require('pdfkit')
const fs = require('fs')

/**
 * Generates a dummy PDF report and saves it to destPath.
 * @param {string} patientName - Patient's name to display in PDF
 * @param {string} destPath - File path to save the PDF
 */
function generateDummyPDF(patientName, destPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument()
      const stream = fs.createWriteStream(destPath)
      doc.pipe(stream)

      doc.fontSize(22).text('Patient Nutrition Report', { align: 'center' })
      doc.moveDown()
      doc.fontSize(14).text(`Patient Name: ${patientName}`)
      doc.text('This is a dummy PDF report generated automatically.')
      doc.end()

      stream.on('finish', resolve)
      stream.on('error', reject)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = { generateDummyPDF }
