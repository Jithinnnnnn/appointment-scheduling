const monthLabel = document.getElementById("monthLabel");
const calendarDays = document.getElementById("calendarDays");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");
const modal = document.getElementById("modal");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const form = document.getElementById("appointmentForm");
const collapseBtn = document.getElementById("collapseBtn");
const sidebar = document.getElementById("sidebar");
const layout = document.querySelector(".layout");
const dateTimeInputs = form.querySelectorAll("[data-input-type]");
const navItems = document.querySelectorAll(".nav-item[data-view]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const patientSearch = document.getElementById("patientSearch");
const doctorSearch = document.getElementById("doctorSearch");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const updateFilters = document.getElementById("updateFilters");
const appointmentsBody = document.getElementById("appointmentsBody");

let current = new Date();
let selectedDate = null;

const appointments = [
  {
    patient: "Henry James",
    doctor: "James Marry",
    hospital: "Salus Center (General Hospital)",
    specialty: "Dermatology",
    date: "18/12/2025",
    time: "12:00 AM - 12:15 AM",
  },
  {
    patient: "Henry James",
    doctor: "James Marry",
    hospital: "Ultracare (General Hospital)",
    specialty: "Dermatology",
    date: "18/12/2025",
    time: "12:00 AM - 12:15 AM",
  },
];

function parseDateDMY(value) {
  if (!value) return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function renderTable(data) {
  if (!appointmentsBody) return;
  const minRows = 10;
  const rows = data
    .map(
      (item) => `
        <div class="appointments-row" role="row">
          <div role="cell">${item.patient}</div>
          <div role="cell">${item.doctor}</div>
          <div role="cell">${item.hospital}</div>
          <div role="cell">${item.specialty}</div>
          <div role="cell">${item.date}</div>
          <div role="cell">${item.time}</div>
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell" class="appointments-actions">
            <button class="icon-btn icon-btn--edit" type="button" aria-label="Edit appointment">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" fill="none" stroke-width="1.6"/>
                <path d="M14 6l4 4" stroke="currentColor" fill="none" stroke-width="1.6"/>
              </svg>
            </button>
            <button class="icon-btn icon-btn--delete" type="button" aria-label="Delete appointment">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16" stroke="currentColor" fill="none" stroke-width="1.6"/>
                <path d="M9 7V5h6v2" stroke="currentColor" fill="none" stroke-width="1.6"/>
                <path d="M7 7l1 12h8l1-12" stroke="currentColor" fill="none" stroke-width="1.6"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" fill="none" stroke-width="1.6"/>
              </svg>
            </button>
          </div>
        </div>
      `
    )
    .join("");

  const emptyRows = Math.max(0, minRows - data.length);
  const emptyMarkup = Array.from({ length: emptyRows })
    .map(
      () => `
        <div class="appointments-row appointments-row--empty" role="row">
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell">&nbsp;</div>
          <div role="cell" class="appointments-actions">&nbsp;</div>
        </div>
      `
    )
    .join("");

  appointmentsBody.innerHTML = rows + emptyMarkup;
}

function filterAppointments() {
  const patientValue = patientSearch?.value.trim().toLowerCase() || "";
  const doctorValue = doctorSearch?.value.trim().toLowerCase() || "";
  const startValue = startDate?.value ? new Date(startDate.value) : null;
  const endValue = endDate?.value ? new Date(endDate.value) : null;

  const filtered = appointments.filter((item) => {
    const matchesPatient = item.patient.toLowerCase().includes(patientValue);
    const matchesDoctor = item.doctor.toLowerCase().includes(doctorValue);
    const itemDate = parseDateDMY(item.date);
    const afterStart = !startValue || (itemDate && itemDate >= startValue);
    const beforeEnd = !endValue || (itemDate && itemDate <= endValue);
    return matchesPatient && matchesDoctor && afterStart && beforeEnd;
  });

  renderTable(filtered);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function renderCalendar() {
  calendarDays.innerHTML = "";

  const start = startOfMonth(current);
  const end = endOfMonth(current);
  const startDay = start.getDay();
  const totalDays = end.getDate();

  const label = start.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const monthText = monthLabel.querySelector(".month-text");
  if (monthText) {
    monthText.textContent = label;
  }

  const prevMonthEnd = new Date(current.getFullYear(), current.getMonth(), 0);
  for (let i = startDay; i > 0; i -= 1) {
    const dayNum = prevMonthEnd.getDate() - i + 1;
    calendarDays.appendChild(createDayCell(dayNum, true));
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cellDate = new Date(current.getFullYear(), current.getMonth(), day);
    const isToday = isSameDate(cellDate, new Date());
    const isSelected = selectedDate && isSameDate(cellDate, selectedDate);
    calendarDays.appendChild(createDayCell(day, false, isToday, isSelected, cellDate));
  }

  const totalCells = startDay + totalDays;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i += 1) {
    calendarDays.appendChild(createDayCell(i, true));
  }
}

function createDayCell(dayNum, muted, isToday, isSelected, dateObj) {
  const cell = document.createElement("div");
  cell.className = "day";
  if (muted) cell.classList.add("muted");
  if (isToday) cell.classList.add("today");
  if (isSelected) cell.classList.add("selected");
  cell.textContent = dayNum;

  if (!muted && dateObj) {
    cell.addEventListener("click", () => {
      selectedDate = dateObj;
      renderCalendar();
      const dateField = form.querySelector("input[name='appointmentDate']");
      dateField.value = dateObj.toISOString().slice(0, 10);
    });
  }

  return cell;
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

prevMonth.addEventListener("click", () => {
  current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  renderCalendar();
});

todayBtn.addEventListener("click", () => {
  current = new Date();
  renderCalendar();
});

openModal.addEventListener("click", () => {
  modal.setAttribute("aria-hidden", "false");
});

function closeAppointmentModal() {
  modal.setAttribute("aria-hidden", "true");
}

closeModal.addEventListener("click", closeAppointmentModal);
cancelModal.addEventListener("click", closeAppointmentModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeAppointmentModal();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const errors = {
    patientName: "",
    doctorName: "",
    hospitalName: "",
    specialty: "",
    appointmentDate: "",
    appointmentTime: "",
  };

  const patientName = formData.get("patientName").trim();
  const doctorName = formData.get("doctorName").trim();
  const hospitalName = formData.get("hospitalName").trim();
  const specialty = formData.get("specialty").trim();
  const appointmentDate = formData.get("appointmentDate");
  const appointmentTime = formData.get("appointmentTime");

  if (!patientName) {
    errors.patientName = "Patient name is required";
  }

  if (!doctorName) {
    errors.doctorName = "Doctor name is required";
  }

  if (!hospitalName) {
    errors.hospitalName = "Hospital name is required";
  }

  if (!specialty) {
    errors.specialty = "Specialty is required";
  }

  if (!appointmentDate) {
    errors.appointmentDate = "Date is required";
  }

  if (!appointmentTime) {
    errors.appointmentTime = "Time is required";
  }

  Object.keys(errors).forEach((key) => {
    const fieldError = form.querySelector(`[data-error-for='${key}']`);
    if (fieldError) {
      fieldError.textContent = errors[key];
    }
  });

  const hasErrors = Object.values(errors).some((message) => message);
  if (!hasErrors) {
    form.reset();
    closeAppointmentModal();
  }
});

dateTimeInputs.forEach((input) => {
  const inputType = input.getAttribute("data-input-type");

  input.addEventListener("focus", () => {
    input.type = inputType;
  });

  input.addEventListener("blur", () => {
    if (!input.value) {
      input.type = "text";
    }
  });
});

renderCalendar();

renderTable(appointments);

if (updateFilters) {
  updateFilters.addEventListener("click", filterAppointments);
}

function setActiveView(viewName) {
  viewPanels.forEach((panel) => {
    const isActive = panel.getAttribute("data-view-panel") === viewName;
    panel.classList.toggle("active", isActive);
  });

  navItems.forEach((item) => {
    const isActive = item.getAttribute("data-view") === viewName;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    const viewName = item.getAttribute("data-view");
    if (viewName) {
      setActiveView(viewName);
    }
  });
});

if (collapseBtn && sidebar && layout) {
  collapseBtn.addEventListener("click", () => {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    layout.style.gridTemplateColumns = isCollapsed
      ? "var(--sidebar-collapsed) 1fr"
      : "var(--sidebar) 1fr";
    collapseBtn.textContent = isCollapsed ? "»" : "«";
  });
}
