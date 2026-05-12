import PDFDocument from 'pdfkit'

export const streamPayslipPdf = ({ res, payslip }) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=payslip-${payslip.payslipNumber || payslip._id}.pdf`
    )
    doc.pipe(res)
    doc.fontSize(18).text(payslip.schoolSnapshot?.name || 'School', {
        align: 'center',
    })
    doc.moveDown()
        .fontSize(13)
        .text(`Payslip: ${payslip.month}/${payslip.year}`)
    doc.text(
        `Employee: ${payslip.employeeSnapshot?.name || payslip.employeeId}`
    )
    doc.text(`Code: ${payslip.employeeSnapshot?.employeeCode || '-'}`)
    doc.moveDown().fontSize(12).text('Earnings')
    ;(payslip.earnings || []).forEach((line) =>
        doc.text(`${line.name}: INR ${Number(line.amount || 0).toFixed(2)}`)
    )
    doc.moveDown().text('Deductions')
    ;(payslip.deductions || []).forEach((line) =>
        doc.text(`${line.name}: INR ${Number(line.amount || 0).toFixed(2)}`)
    )
    doc.moveDown()
        .fontSize(14)
        .text(`Net Payable: INR ${Number(payslip.netPayable || 0).toFixed(2)}`)
    doc.text(`Payment Status: ${payslip.paymentStatus}`)
    doc.end()
}

export const queuePayslipEmail = async () => ({
    queued: false,
    message: 'TODO: connect school email module for payslip delivery.',
})
