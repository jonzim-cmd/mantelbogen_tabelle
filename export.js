document.getElementById("generatePDF").addEventListener("click", function(){
  const originalTable = document.getElementById("resultTable");
  const tableClone = originalTable.cloneNode(true);

  // Überschreibe alle Styles im Klon, sodass ein helles Layout (weiß mit schwarzer Schrift) entsteht
  tableClone.style.background = "#ffffff";
  tableClone.style.color = "#000000";
  tableClone.querySelectorAll('*').forEach(el => {
    el.style.backgroundColor = "#ffffff";
    el.style.color = "#000000";
  });

  // Temporärer, versteckter Container
  const hiddenContainer = document.createElement("div");
  hiddenContainer.style.position = "fixed";
  hiddenContainer.style.top = "-10000px";
  hiddenContainer.style.left = "-10000px";
  hiddenContainer.appendChild(tableClone);
  document.body.appendChild(hiddenContainer);

  html2canvas(tableClone).then(function(canvas) {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth  = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 70.87; // ca. 2,5 cm Rand
    const availableWidth = pdfWidth - 2 * margin;
    const availableHeight = pdfHeight - 2 * margin;
    const imgProps = pdf.getImageProperties(imgData);
    const originalImgWidth  = imgProps.width;
    const originalImgHeight = imgProps.height;
    const scale = Math.min(availableWidth / originalImgWidth, availableHeight / originalImgHeight);
    const imgDisplayWidth = originalImgWidth * scale;
    const imgDisplayHeight = originalImgHeight * scale;
    const x = margin + (availableWidth - imgDisplayWidth) / 2;
    const y = margin + (availableHeight - imgDisplayHeight) / 2;
    pdf.addImage(imgData, 'PNG', x, y, imgDisplayWidth, imgDisplayHeight);
    pdf.save("Notenauswertung.pdf");
    document.body.removeChild(hiddenContainer);
  });
});
