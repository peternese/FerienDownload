        // Automatisch Dropdown mit Jahreszahlen füllen
        const yearSelect = document.getElementById("yearSelect");
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            let option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
            option.selected = i === currentYear; // Aktuelles Jahr vorauswählen
        }

        // Mapping der Bundesland-Kürzel zu Namen
        const stateMap = {
            "-": "Alle Bundesländer",
            "BB": "Brandenburg",
            "BE": "Berlin",
            "BW": "Baden-Württemberg",
            "BY": "Bayern",
            "HB": "Bremen",
            "HE": "Hessen",
            "HH": "Hamburg",
            "MV": "Mecklenburg-Vorpommern",
            "NI": "Niedersachsen",
            "NW": "Nordrhein-Westfalen",
            "RP": "Rheinland-Pfalz",
            "SH": "Schleswig-Holstein",
            "SL": "Saarland",
            "SN": "Sachsen",
            "ST": "Sachsen-Anhalt",
            "TH": "Thüringen"
        };

        // StateCode-Dropdown mit vollständigen Namen füllen
        const stateSelect = document.getElementById("stateSelect");
        Object.keys(stateMap).forEach(stateCode => {
            let option = document.createElement("option");
            option.value = stateCode;
            option.textContent = stateMap[stateCode]; // Anzeigenamen setzen
            stateSelect.appendChild(option);
            option.selected = stateCode === "NW"; // Alle Bundesländer vorauswählen
        });

        let currentHolidays = [];

        async function fetchHolidays() {
            let selectedYear = yearSelect.value;
            let selectedState = stateSelect.value;
            let url = "https://ferien-api.de/api/v1/holidays.json";

            try {
                let response = await fetch(url);
                let data = await response.json();

                // Erst nach Jahr filtern
                currentHolidays = data.filter(holiday => holiday.year == selectedYear);

                // Falls ein bestimmtes Bundesland gewählt wurde, weiter filtern
                if (selectedState !== "-") {
                    currentHolidays = currentHolidays.filter(holiday => holiday.stateCode === selectedState);
                }

                // Anzeige aktualisieren
                let holidayHead = document.getElementById("holidayHead");
                holidayHead.innerHTML = "Ferienzeiten:";
                let holidayList = document.getElementById("holidayList");
                holidayList.innerHTML = ""; // Vorherige Einträge löschen

                if (currentHolidays.length === 0) {
                    holidayList.innerHTML = `<li>Keine Einträge für ${selectedYear} ${selectedState !== "-" ? " in " + stateMap[selectedState] : ""} gefunden.</li>`;
                    document.getElementById("calendarButton").style.display = "none";
                } else {
                    currentHolidays.forEach(holiday => {
                        let li = document.createElement("li");
                        li.textContent = `${holiday.start} - ${holiday.end} (${toTitleCase(holiday.name)})`;
                        holidayList.appendChild(li);
                    });

                    document.getElementById("calendarButton").style.display = "inline-block"; // Button sichtbar machen
                }
            } catch (error) {
                console.error("Fehler beim Laden der Daten:", error);
            }
        }

        function addToCalendar() {
            if (currentHolidays.length === 0) {
                alert("Keine Ferien gefunden!");
                return;
            }

            let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Ferien API//DE`;

            currentHolidays.forEach(holiday => {
                let startDate = formatDate(holiday.start);
                let endDate = formatDate(holiday.end, true); // +1 Tag für Enddatum
                let title = toTitleCase(holiday.name);

                icsContent += `
BEGIN:VEVENT
UID:${new Date().getTime()}-${Math.random()}@ferien-api
DTSTAMP:${formatDate(new Date())}
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${endDate}
SUMMARY:${title}
END:VEVENT`;
            });

            icsContent += `
END:VCALENDAR`;

            let blob = new Blob([icsContent], { type: "text/calendar" });
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "ferien.ics";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function formatDate(dateString, isEndDate = false) {
            let date = new Date(dateString);
            if (isEndDate) {
                date.setDate(date.getDate() + 1); // Enddatum ist am letzten Tag um 00:00, daher +1 Tag
            }
            return date.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
        }

        function toTitleCase(str) {
            return str.toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase())  // Anfangsbuchstaben groß
                      .replace(/-\w/g, (char) => char.toUpperCase())   // Buchstaben nach Bindestrich groß
                      .replace(/ü\w/g, (char) => char.toLowerCase())   // Fix für Umlaute
                      .replace(/ö\w/g, (char) => char.toLowerCase())
                      .replace(/ä\w/g, (char) => char.toLowerCase());
        }
