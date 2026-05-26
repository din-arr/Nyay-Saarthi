interface DocumentAnalysis {
  document_type: string
  parties: string[]
  key_dates: string[]
  key_clauses: string[]
  risk_score: number
  risk_level: string
  risk_factors: string[]
  suggested_questions: string[]
}

export async function exportAnalysisPdf(docName: string, analysis: DocumentAnalysis) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()

  // Green header
  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, W, 28, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text("Nyay-Saarthi — Legal Document Report", 14, 18)

  doc.setTextColor(30, 30, 30)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Document: ${docName}`, 14, 36)
  doc.text(`Type: ${analysis.document_type}`, 14, 43)
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 50)

  // Risk badge (top-right)
  const rc =
    analysis.risk_level === "Low"
      ? ([22, 163, 74] as const)
      : analysis.risk_level === "High"
      ? ([220, 38, 38] as const)
      : ([234, 88, 12] as const)
  doc.setFillColor(rc[0], rc[1], rc[2])
  doc.roundedRect(W - 68, 32, 54, 22, 2, 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(`${analysis.risk_score}/100`, W - 57, 43)
  doc.setFontSize(9)
  doc.text(`${analysis.risk_level} Risk`, W - 57, 50)
  doc.setTextColor(30, 30, 30)

  autoTable(doc, {
    startY: 60,
    head: [["Parties Involved"]],
    body: analysis.parties.map((p) => [p]),
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    theme: "grid",
  })

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Key Dates"]],
    body: analysis.key_dates.map((d) => [d]),
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, overflow: "linebreak" },
    margin: { left: 14, right: 14 },
    theme: "grid",
  })

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Key Clauses"]],
    body: analysis.key_clauses.map((c) => [c]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, overflow: "linebreak" },
    margin: { left: 14, right: 14 },
    theme: "grid",
  })

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Risk Factors"]],
    body: analysis.risk_factors.map((r) => [r]),
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, overflow: "linebreak" },
    margin: { left: 14, right: 14 },
    theme: "grid",
  })

  const pages = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Nyay-Saarthi Legal AI Platform  |  Page ${i} of ${pages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    )
  }

  doc.save(`${docName.replace(/[^a-zA-Z0-9]/g, "_")}_NyaySaarthi.pdf`)
}
