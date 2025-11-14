/* Konstante für numerische Robustheit und Schrittweite */
const EPS = 1e-8;
const POINT_STEP = 0.5;

/* Hilfsfunktionen zum Runden auf halbe Punktwerte */
function roundUpToNearestHalf(value) {
  const v = Number(value.toFixed(8));   // IEEE-754-Reste abschneiden
  return Math.ceil(v * 2) / 2;
}
function roundDownToNearestHalf(value) {
  const v = Number(value.toFixed(8));
  return Math.floor(v * 2) / 2;
}

/* Notenschemata (wie im Notenrechner) */
const ihkThresholds = {
  1: 0.92,
  2: 0.81,
  3: 0.67,
  4: 0.50,
  5: 0.30,
  6: 0.00
};

const apThresholds = {
  1: 0.86,
  2: 0.71,
  3: 0.56,
  4: 0.41,
  5: 0.20,
  6: 0.00
};

/* Prozentberechnung und Notenlogik wie im Notenrechner */
function percentFromPoints(achieved, max) {
  // Einheitliche Rundung auf 2 Nachkommastellen
  return parseFloat(((achieved / max) * 100).toFixed(2));
}

function gradeFromPercent(pct, thresholds) {
  for (let g = 1; g <= 6; g++) {
    if (pct >= thresholds[g] * 100) return g;
  }
  return 6;
}

function gradeFromPoints(max, achieved, thresholds) {
  return gradeFromPercent(percentFromPoints(achieved, max), thresholds);
}

/* Diskrete 0,5er-Buckets (identisch zur Logik im Notenrechner) */
function computeHalfStepRanges(max, thresholds) {
  const ranges = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  const cap = roundDownToNearestHalf(Number(max));

  const steps = Math.floor((cap + EPS) / POINT_STEP);
  for (let i = 0; i <= steps; i++) {
    const p = Number((i * POINT_STEP).toFixed(8));
    const g = gradeFromPoints(max, p, thresholds);
    if (!ranges[g]) ranges[g] = { min: p, max: p };
    else ranges[g].max = p;
  }

  // Falls max z.B. 12,7 ist, wird dieser Wert ebenfalls gebucketet
  if (Math.abs(max - cap) > EPS) {
    const g = gradeFromPoints(max, max, thresholds);
    if (!ranges[g]) ranges[g] = { min: max, max: max };
    else ranges[g].max = Math.max(ranges[g].max, max);
  }
  return ranges;
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

  // Notenschlüssel (Punkterange) berechnen – Logik wie im Notenrechner
  const rangeCells = {
    1: document.querySelector(".range-1"),
    2: document.querySelector(".range-2"),
    3: document.querySelector(".range-3"),
    4: document.querySelector(".range-4"),
    5: document.querySelector(".range-5"),
    6: document.querySelector(".range-6")
  };

  let currentThresholds = (schema === "ihk") ? ihkThresholds : apThresholds;

  if (!isNaN(maxPoints) && maxPoints > 0) {
    const ranges = computeHalfStepRanges(maxPoints, currentThresholds);

    // Noten 1–5: "ab xx,xx% (von x,x bis y,y Punkte)"
    for (let grade = 1; grade <= 5; grade++) {
      const pctText = (currentThresholds[grade] * 100).toFixed(2).replace('.', ',') + "%";
      const r = ranges[grade];

      if (r) {
        const lowerStr = r.min.toFixed(1).replace('.', ',');
        const upperStr = r.max.toFixed(1).replace('.', ',');
        rangeCells[grade].textContent =
          "ab " + pctText + " (von " + lowerStr + " bis " + upperStr + " Punkte)";
      } else {
        rangeCells[grade].textContent =
          "ab " + pctText + " (—)";
      }
    }

    // Note 6: unter Schwelle der Note 5, "von 0,0 bis x,x Punkte"
    const r6 = ranges[6];
    if (r6) {
      const lower6 = r6.min.toFixed(1).replace('.', ','); // i.d.R. 0,0
      const upper6 = r6.max.toFixed(1).replace('.', ',');
      const underPct = (currentThresholds[5] * 100).toFixed(2).replace('.', ',') + "%";
      rangeCells[6].textContent =
        "unter " + underPct + " (von " + lower6 + " bis " + upper6 + " Punkte)";
    } else {
      rangeCells[6].textContent = "";
    }
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
