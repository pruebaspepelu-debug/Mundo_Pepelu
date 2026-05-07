let currentDate = new Date();

export function initCalendar() {
    renderCalendar();
}

export function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

export function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

export function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const label = document.getElementById('calendarMonthLabel');
    if (!container || !label) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    label.innerText = `${monthNames[month]} ${year}`;

    container.innerHTML = '';

    const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.innerText = day;
        dayHeader.style.textAlign = 'center';
        dayHeader.style.color = '#94a3b8';
        dayHeader.style.fontWeight = 'bold';
        container.appendChild(dayHeader);
    });

    const firstDayOfMonth = new Date(year, month, 1);
    let startDay = firstDayOfMonth.getDay();
    // En JS, el Domingo es 0, Lunes es 1... Queremos que el Lunes sea 0
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const isCurrentMonth = (today.getMonth() === month && today.getFullYear() === year);

    // Días vacíos al principio del mes
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.background = 'rgba(0,0,0,0.1)';
        emptyCell.style.borderRadius = '8px';
        emptyCell.style.minHeight = '60px';
        container.appendChild(emptyCell);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.innerText = i;
        dayCell.style.background = 'rgba(0,0,0,0.2)';
        dayCell.style.borderRadius = '8px';
        dayCell.style.minHeight = '60px';
        dayCell.style.display = 'flex';
        dayCell.style.alignItems = 'center';
        dayCell.style.justifyContent = 'center';
        dayCell.style.color = '#e2e8f0';
        dayCell.style.fontWeight = 'bold';
        dayCell.style.transition = 'all 0.2s';
        dayCell.style.cursor = 'pointer';
        
        dayCell.onclick = () => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (window.loadSpecificDay) window.loadSpecificDay(dateStr);
            else console.error("loadSpecificDay no está definido en window");
        };

        // Resaltar día actual
        if (isCurrentMonth && i === today.getDate()) {
            dayCell.style.background = 'rgba(16, 185, 129, 0.2)';
            dayCell.style.border = '2px solid #10b981';
            dayCell.style.color = '#10b981';
            dayCell.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.4)';
        } else {
            // Un poco de hover en días normales (efecto opcional)
            dayCell.onmouseenter = () => { dayCell.style.background = 'rgba(255,255,255,0.1)'; };
            dayCell.onmouseleave = () => { dayCell.style.background = 'rgba(0,0,0,0.2)'; };
        }

        container.appendChild(dayCell);
    }
}
