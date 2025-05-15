/* Hilfsfunktionen zum Runden auf halbe Punktwerte */
function roundUpToNearestHalf(value) {
  const v = Number(value.toFixed(8));   // IEEE-754-Reste abschneiden
  return Math.ceil(v * 2) / 2;
}
function roundDownToNearestHalf(value) {
  const v = Number(value.toFixed(8));
  return Math.floor(v * 2) / 2;
}

/* Funktion zur Berechnung der Notenauswertung */
function calculateGrades() {
  // Ausgewähltes Notenschema ermitteln
  const schema = document.querySelector('input[name="notenschema"]:checked').value;
  const maxPointsVal = document.getElementById("maxPoints").value;
  const maxPoints = parseFloat(maxPointsVal);

  // Noteneingaben aus den Textareas (Erwartung: ausschließlich Noten zwischen 1 und 6)
  const hauptText = document.getElementById("haupttermin").value.trim();
  const nachText  = document.getElementById("nachtermin").value.trim();

  // --- VALIDIERUNG DER EINGABEN ---
  let errorMessages = [];
  // Funktion, die Zeile für Zeile prüft, ob genau eine Zahl zwischen 1 und 6 vorliegt.
  function validateInput(text, fieldName) {
    let lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line === "") continue; // Leere Zeilen überspringen
      // Regex prüft, ob die Zeile exakt eine Ziffer zwischen 1 und 6 enthält.
      if (!/^[1-6]$/.test(line)) {
        errorMessages.push(
          fieldName + ": Ungültige Eingabe in Zeile " + (i + 1) +
          " ('" + line + "'). Es muss genau eine Zahl zwischen 1 und 6 pro Zeile stehen."
        );
      }
    }
  }
  
  validateInput(hauptText, "Ergebnisse Haupttermin");
  validateInput(nachText, "Ergebnisse Nachtermin");

  // Falls Fehler gefunden wurden, Fehlermeldung anzeigen und Verarbeitung abbrechen.
  const errorDiv = document.getElementById("errorMessage");
  if (errorMessages.length > 0) {
    errorDiv.innerHTML = errorMessages.join("<br>");
    return;  // Abbruch der weiteren Verarbeitung, solange die Eingaben fehlerhaft sind.
  } else {
    errorDiv.innerHTML = "";
  }
  // --- ENDE DER VALIDIERUNG ---

  // Zeilenweise einlesen; dabei werden eventuelle deutsche Dezimaltrennzeichen (Komma) konvertiert
  const parseLines = (text) => {
    return text ? text.split(/\r?\n/).map(x => parseFloat(x.replace(',', '.'))).filter(n => !isNaN(n)) : [];
  };

  const hauptNotes = parseLines(hauptText);
  const nachNotes  = parseLines(nachText);

  // Zählung der Noten (von 1 bis 6)
  const countH = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
  const countN = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};

  hauptNotes.forEach(note => {
    const grade = Math.round(note);
    if (grade >= 1 && grade <= 6) { countH[grade]++; }
  });
  nachNotes.forEach(note => {
    const grade = Math.round(note);
    if (grade >= 1 && grade <= 6) { countN[grade]++; }
  });

  // Gesamtzahlen ermitteln und in den Zellen anzeigen
  let totalHCount = 0, totalNCount = 0;
  for (let i = 1; i <= 6; i++) {
    totalHCount += countH[i];
    totalNCount += countN[i];
    // Badge-Elemente in den entsprechenden Zellen
    const badgeH = document.querySelector(".count-h-" + i + " .badge");
    const badgeN = document.querySelector(".count-n-" + i + " .badge");
    
    badgeH.textContent = countH[i] || 0;
    badgeN.textContent = countN[i] || 0;
    
    // Falls der Wert 0 ist, füge die Klasse "zero" hinzu, ansonsten entferne sie
    if ((countH[i] || 0) === 0) {
      badgeH.classList.add("zero");
    } else {
      badgeH.classList.remove("zero");
    }
    if ((countN[i] || 0) === 0) {
      badgeN.classList.add("zero");
    } else {
      badgeN.classList.remove("zero");
    }
  }
  const totalCount = totalHCount + totalNCount;

  // Durchschnittsberechnung (auf zwei Nachkommastellen, Komma als Dezimaltrennzeichen)
  const avgH = hauptNotes.length ? (hauptNotes.reduce((sum, val) => sum + val, 0) / hauptNotes.length).toFixed(2).replace('.', ',') : "0,00";
  const allNotes = hauptNotes.concat(nachNotes);
  const avgAll = allNotes.length ? (allNotes.reduce((sum, val) => sum + val, 0) / allNotes.length).toFixed(2).replace('.', ',') : "0,00";

  document.getElementById("avgH").textContent = avgH;
  document.getElementById("avgAll").textContent = avgAll;

  // Fülle die Gesamtzahlen-Zeile
  document.getElementById("totalRow").textContent =
    "Schülerzahlen – Haupttermin: " + totalHCount +
    " | Nachtermin: " + totalNCount +
    " | Gesamt: " + totalCount;

  // Notenschlüssel (Punkterange) berechnen
  const rangeCells = {
    1: document.querySelector(".range-1"),
    2: document.querySelector(".range-2"),
    3: document.querySelector(".range-3"),
    4: document.querySelector(".range-4"),
    5: document.querySelector(".range-5"),
    6: document.querySelector(".range-6")
  };

  let noteBoundaries;
  if (schema === "ihk") {
    noteBoundaries = [
      { note: 1, min: 0.92 },
      { note: 2, min: 0.81 },
      { note: 3, min: 0.67 },
      { note: 4, min: 0.50 },
      { note: 5, min: 0.30 },
      { note: 6, min: 0.00 }
    ];
  } else {
    noteBoundaries = [
      { note: 1, min: 0.85 },
      { note: 2, min: 0.70 },
      { note: 3, min: 0.55 },
      { note: 4, min: 0.41 },
      { note: 5, min: 0.20 },
      { note: 6, min: 0.00 }
    ];
  }

  if (!isNaN(maxPoints) && maxPoints > 0) {
    noteBoundaries.forEach((boundary, idx) => {
      const note   = boundary.note;
      const pctText = (boundary.min * 100).toFixed(2) + "%";
      const lowerPoints = roundUpToNearestHalf(maxPoints * boundary.min).toFixed(1);
      let upperPoints;
      if (idx === 0) {
        upperPoints = roundDownToNearestHalf(maxPoints).toFixed(1);
      } else {
        upperPoints = roundDownToNearestHalf(maxPoints * noteBoundaries[idx - 1].min - 0.1).toFixed(1);
      }
      rangeCells[note].textContent = "ab " + pctText + " (" + lowerPoints + " bis " + upperPoints + " Punkte)";
    });
  } else {
    for (let i = 1; i <= 6; i++) {
      rangeCells[i].textContent = "";
    }
  }

  // Dynamische Skalierung der Badge-Breite:
  // Ermittele den höchsten Zählwert aus allen Badges (Haupt- und Nachtermin)
  let maxBadgeCount = 0;
  for (let i = 1; i <= 6; i++) {
    maxBadgeCount = Math.max(maxBadgeCount, countH[i] || 0, countN[i] || 0);
  }
  // Definiere Mindest- und Maximalbreite (in Pixel)
  const minBadgeWidth = 16; 
  const maxBadgeWidth = 100; // Maximale Breite, ohne die Tabelle zu erweitern

  // Setze die Breite für jede Badge anhand des Anteils am Maximalwert
  for (let i = 1; i <= 6; i++) {
    const badgeH = document.querySelector(".count-h-" + i + " .badge");
    const badgeN = document.querySelector(".count-n-" + i + " .badge");
    let widthH = minBadgeWidth;
    let widthN = minBadgeWidth;
    if (maxBadgeCount > 0) {
      widthH += (countH[i] / maxBadgeCount) * (maxBadgeWidth - minBadgeWidth);
      widthN += (countN[i] / maxBadgeCount) * (maxBadgeWidth - minBadgeWidth);
    }
    badgeH.style.width = widthH + "px";
    badgeN.style.width = widthN + "px";
  }

  // PDF-Button nur anzeigen, wenn Noteneingaben vorliegen
  if (hauptNotes.length + nachNotes.length > 0) {
    document.getElementById("generatePDF").style.display = "inline-block";
  } else {
    document.getElementById("generatePDF").style.display = "none";
  }
}

/* Alle Eingaben zurücksetzen */
function resetAll() {
  document.getElementById("maxPoints").value = "";
  document.getElementById("haupttermin").value = "";
  document.getElementById("nachtermin").value  = "";
  document.querySelector('input[name="notenschema"][value="ihk"]').checked = true;
  calculateGrades();
}

/* Nur Noteneingaben zurücksetzen */
function resetGrades() {
  document.getElementById("haupttermin").value = "";
  document.getElementById("nachtermin").value = "";
  calculateGrades();
}

/* Live-Aktualisierung */
document.getElementById("maxPoints").addEventListener("input", calculateGrades);
document.getElementById("haupttermin").addEventListener("input", calculateGrades);
document.getElementById("nachtermin").addEventListener("input", calculateGrades);
document.querySelectorAll('input[name="notenschema"]').forEach(elem => {
  elem.addEventListener("change", calculateGrades);
});

/* Initialer Aufruf */
calculateGrades();

/* Export-Code */
document.getElementById("generatePDF").addEventListener("click", function(){
  const originalTable = document.getElementById("resultTable");
  const tableClone = originalTable.cloneNode(true);

  // Überschreibe alle Styles im Klon so, dass ein helles Layout (weiß mit schwarzer Schrift) entsteht,
  // aber lasse Elemente mit der Klasse "badge" unberührt.
  tableClone.style.background = "#fff";
  tableClone.style.color = "#000";
  tableClone.querySelectorAll('*').forEach(el => {
    if (!el.classList.contains("badge")) {
      el.style.backgroundColor = "#fff";
      el.style.color = "#000";
    }
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

/* Erweiterung: Vergrößerung der Textareas beim Fokussieren und Wiederherstellung der ursprünglichen Größe */
window.addEventListener("DOMContentLoaded", function() {
  const haupttermin = document.getElementById("haupttermin");
  const nachtermin = document.getElementById("nachtermin");

  // Speichere die ursprüngliche Höhe der Textareas
  const originalHeightH = haupttermin.clientHeight;
  const originalHeightN = nachtermin.clientHeight;

  haupttermin.addEventListener("focus", function() {
    haupttermin.style.height = "35em";
  });
  haupttermin.addEventListener("blur", function() {
    haupttermin.style.height = originalHeightH + "px";
  });

  nachtermin.addEventListener("focus", function() {
    nachtermin.style.height = "15em";
  });
  nachtermin.addEventListener("blur", function() {
    nachtermin.style.height = originalHeightN + "px";
  });
});
