const monthLabel = document.getElementById("monthLabel");
const calendarDays = document.getElementById("calendarDays");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const form = document.getElementById("appointmentForm");
const submitButton = form.querySelector("button[type='submit']");
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
const appointmentDateInput = form.querySelector("input[name='appointmentDate']");
const appointmentTimeInput = form.querySelector("input[name='appointmentTime']");

const STORAGE_KEY = "appointments";

let current = new Date();
let selectedDate = null;
let editingId = null;
let dateFiltersActive = false;

const seedAppointments = [
  {
    id: "seed-1",
    patient: "Henry James",
    doctor: "James Marry",
    hospital: "Salus Center (General Hospital)",
    specialty: "Dermatology",
    date: "2026-04-18",
    time: "09:00",
    reason: "",
  },
  {
    id: "seed-2",
    patient: "Henry James",
    doctor: "James Marry",
    hospital: "Ultracare (General Hospital)",
    specialty: "Dermatology",
    date: "2026-04-21",
    time: "13:30",
    reason: "",
  },
];

let appointments = loadAppointments();

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `appt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(dateObj) {
  if (!dateObj) return "";
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
}

function parseISODate(value) {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseDMYDate(value) {
  if (!value) return "";
  const parts = value.split("/").map(Number);
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  if (!day || !month || !year) return "";
  return `${year}-${pad(month)}-${pad(day)}`;
}

function normalizeAppointment(item) {
  const rawDate = item.date || item.appointmentDate || "";
  const normalizedDate = rawDate.includes("/") ? parseDMYDate(rawDate) : rawDate;
  return {
    id: item.id || createId(),
    patient: item.patient || item.patientName || "",
    doctor: item.doctor || item.doctorName || "",
    hospital: item.hospital || item.hospitalName || "",
    specialty: item.specialty || "",
    date: normalizedDate,
    time: item.time || item.appointmentTime || "",
    reason: item.reason || "",
  };
}

function loadAppointments() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAppointments));
    return seedAppointments.map(normalizeAppointment);
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return seedAppointments.map(normalizeAppointment);
    }
    return parsed.map(normalizeAppointment);
  } catch (error) {
    return seedAppointments.map(normalizeAppointment);
  }
}

function saveAppointments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function formatDateDisplay(value) {
  const parsed = parseISODate(value);
  if (!parsed) return value || "";
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

function formatTimeDisplay(value) {
  if (!value) return "";
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 || 12;
  return `${normalizedHour}:${minutes} ${period}`;
}

function timeToMinutes(value) {
  if (!value) return null;
  const trimmed = value.split("-")[0].trim();
  const match24 = trimmed.match(/^(\d{2}):(\d{2})$/);
  if (match24) {
    return Number(match24[1]) * 60 + Number(match24[2]);
  }
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match12) return null;
  let hours = Number(match12[1]);
  const minutes = Number(match12[2]);
  const period = match12[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function compareAppointments(a, b) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const aMinutes = timeToMinutes(a.time);
  const bMinutes = timeToMinutes(b.time);
  if (aMinutes === null || bMinutes === null) {
    return a.time.localeCompare(b.time);
  }
  return aMinutes - bMinutes;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function renderTable(data) {
  if (!appointmentsBody) return;
  const minRows = 10;
  const rows = data
    .map(
      (item) => `
        <div class="appointments-row" role="row" data-id="${item.id}">
          <div role="cell" data-label="Patient">${item.patient}</div>
          <div role="cell" data-label="Doctor">${item.doctor}</div>
          <div role="cell" data-label="Hospital">${item.hospital}</div>
          <div role="cell" data-label="Specialty">${item.specialty}</div>
          <div role="cell" data-label="Select Date">${formatDateDisplay(item.date)}</div>
          <div role="cell" data-label="Select Time">${formatTimeDisplay(item.time)}</div>
          <div role="cell" data-label="Action" class="appointments-actions">
            <button class="icon-btn icon-btn--edit" type="button" aria-label="Edit appointment" data-id="${item.id}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" fill="none" stroke-width="1.6"/>
                <path d="M14 6l4 4" stroke="currentColor" fill="none" stroke-width="1.6"/>
              </svg>
            </button>
            <button class="icon-btn icon-btn--delete" type="button" aria-label="Delete appointment" data-id="${item.id}">
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
          <div role="cell" data-label="Patient">&nbsp;</div>
          <div role="cell" data-label="Doctor">&nbsp;</div>
          <div role="cell" data-label="Hospital">&nbsp;</div>
          <div role="cell" data-label="Specialty">&nbsp;</div>
          <div role="cell" data-label="Select Date">&nbsp;</div>
          <div role="cell" data-label="Select Time">&nbsp;</div>
          <div role="cell" data-label="Action" class="appointments-actions">&nbsp;</div>
        </div>
      `
    )
    .join("");

  appointmentsBody.innerHTML = rows + emptyMarkup;
}

function getFilteredAppointments() {
  const patientValue = patientSearch?.value.trim().toLowerCase() || "";
  const doctorValue = doctorSearch?.value.trim().toLowerCase() || "";
  const startValue = dateFiltersActive && startDate?.value ? parseISODate(startDate.value) : null;
  const endValue = dateFiltersActive && endDate?.value ? parseISODate(endDate.value) : null;

  return appointments
    .filter((item) => {
      const matchesPatient = item.patient.toLowerCase().includes(patientValue);
      const matchesDoctor = item.doctor.toLowerCase().includes(doctorValue);
      const itemDate = parseISODate(item.date);
      const afterStart = !startValue || (itemDate && itemDate >= startValue);
      const beforeEnd = !endValue || (itemDate && itemDate <= endValue);
      return matchesPatient && matchesDoctor && afterStart && beforeEnd;
    })
    .sort(compareAppointments);
}

function renderCalendar(data) {
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

  const appointmentsByDate = data.reduce((acc, item) => {
    if (!item.date) return acc;
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  Object.keys(appointmentsByDate).forEach((key) => {
    appointmentsByDate[key].sort(compareAppointments);
  });

  const prevMonthEnd = new Date(current.getFullYear(), current.getMonth(), 0);
  for (let i = startDay; i > 0; i -= 1) {
    const dayNum = prevMonthEnd.getDate() - i + 1;
    calendarDays.appendChild(createDayCell(dayNum, true));
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cellDate = new Date(current.getFullYear(), current.getMonth(), day);
    const dateKey = toDateKey(cellDate);
    const isToday = isSameDate(cellDate, new Date());
    const isSelected = selectedDate && isSameDate(cellDate, selectedDate);
    const dayAppointments = appointmentsByDate[dateKey] || [];
    calendarDays.appendChild(
      createDayCell(day, false, isToday, isSelected, cellDate, dayAppointments)
    );
  }

  const totalCells = startDay + totalDays;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i += 1) {
    calendarDays.appendChild(createDayCell(i, true));
  }
}

function createDayCell(dayNum, muted, isToday, isSelected, dateObj, dayAppointments = []) {
  const cell = document.createElement("div");
  cell.className = "day";
  if (muted) cell.classList.add("muted");
  if (isToday) cell.classList.add("today");
  if (isSelected) cell.classList.add("selected");

  const number = document.createElement("div");
  number.className = "day-number";
  number.textContent = dayNum;
  cell.appendChild(number);

  if (!muted && dayAppointments.length) {
    const events = document.createElement("div");
    events.className = "day-events";
    dayAppointments.forEach((item) => {
      const event = document.createElement("div");
      event.className = "day-event";

      const time = document.createElement("div");
      time.className = "event-time";
      time.textContent = formatTimeDisplay(item.time);

      const meta = document.createElement("div");
      meta.className = "event-meta";
      meta.textContent = `${item.patient} - ${item.doctor}`;

      event.appendChild(time);
      event.appendChild(meta);
      events.appendChild(event);
    });
    cell.appendChild(events);
  }

  if (!muted && dateObj) {
    cell.addEventListener("click", () => {
      selectedDate = dateObj;
      const dateKey = toDateKey(dateObj);
      appointmentDateInput.type = "date";
      appointmentDateInput.value = dateKey;
      applyFilters();
    });
  }

  return cell;
}

function clearErrors() {
  form.querySelectorAll(".error").forEach((error) => {
    error.textContent = "";
  });
}

function resetInputTypes() {
  dateTimeInputs.forEach((input) => {
    input.type = "text";
  });
}

function openCreateModal() {
  clearErrors();
  form.reset();
  resetInputTypes();
  editingId = null;
  modalTitle.textContent = "Schedule Appointment";
  submitButton.textContent = "Save";

  if (selectedDate) {
    appointmentDateInput.type = "date";
    appointmentDateInput.value = toDateKey(selectedDate);
  }

  modal.setAttribute("aria-hidden", "false");
  const focusTarget = form.querySelector("input[name='patientName']");
  if (focusTarget) focusTarget.focus();
}

function openEditModal(appointment) {
  if (!appointment) return;
  clearErrors();
  form.reset();
  resetInputTypes();
  editingId = appointment.id;
  modalTitle.textContent = "Edit Appointment";
  submitButton.textContent = "Update";

  form.querySelector("input[name='patientName']").value = appointment.patient;
  form.querySelector("input[name='doctorName']").value = appointment.doctor;
  form.querySelector("input[name='hospitalName']").value = appointment.hospital;
  form.querySelector("input[name='specialty']").value = appointment.specialty;
  form.querySelector("textarea[name='reason']").value = appointment.reason || "";

  if (appointment.date) {
    appointmentDateInput.type = "date";
    appointmentDateInput.value = appointment.date;
  }

  if (appointment.time && /^\d{2}:\d{2}$/.test(appointment.time)) {
    appointmentTimeInput.type = "time";
    appointmentTimeInput.value = appointment.time;
  }

  modal.setAttribute("aria-hidden", "false");
  const focusTarget = form.querySelector("input[name='patientName']");
  if (focusTarget) focusTarget.focus();
}

function closeAppointmentModal() {
  modal.setAttribute("aria-hidden", "true");
  form.reset();
  clearErrors();
  resetInputTypes();
  editingId = null;
  modalTitle.textContent = "Schedule Appointment";
  submitButton.textContent = "Save";
}

function applyFilters() {
  const filtered = getFilteredAppointments();
  renderTable(filtered);
  renderCalendar(filtered);
}

prevMonth.addEventListener("click", () => {
  current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
  applyFilters();
});

nextMonth.addEventListener("click", () => {
  current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  applyFilters();
});

todayBtn.addEventListener("click", () => {
  current = new Date();
  applyFilters();
});

openModal.addEventListener("click", openCreateModal);
closeModal.addEventListener("click", closeAppointmentModal);
cancelModal.addEventListener("click", closeAppointmentModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeAppointmentModal();
  }
});

form.addEventListener("input", (event) => {
  const fieldName = event.target.name;
  if (!fieldName) return;
  const fieldError = form.querySelector(`[data-error-for='${fieldName}']`);
  if (fieldError) {
    fieldError.textContent = "";
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
  const reason = formData.get("reason").trim();

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
  if (hasErrors) return;

  const payload = {
    id: editingId || createId(),
    patient: patientName,
    doctor: doctorName,
    hospital: hospitalName,
    specialty,
    date: appointmentDate,
    time: appointmentTime,
    reason,
  };

  if (editingId) {
    appointments = appointments.map((item) => (item.id === editingId ? payload : item));
  } else {
    appointments = [...appointments, payload];
  }

  saveAppointments();
  closeAppointmentModal();
  applyFilters();
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

appointmentsBody.addEventListener("click", (event) => {
  const editButton = event.target.closest(".icon-btn--edit");
  const deleteButton = event.target.closest(".icon-btn--delete");

  if (editButton) {
    const id = editButton.getAttribute("data-id");
    const appointment = appointments.find((item) => item.id === id);
    openEditModal(appointment);
    return;
  }

  if (deleteButton) {
    const id = deleteButton.getAttribute("data-id");
    if (!id) return;
    const confirmed = window.confirm("Delete this appointment?");
    if (!confirmed) return;
    appointments = appointments.filter((item) => item.id !== id);
    saveAppointments();
    applyFilters();
  }
});

if (patientSearch) {
  patientSearch.addEventListener("input", applyFilters);
}

if (doctorSearch) {
  doctorSearch.addEventListener("input", applyFilters);
}

if (startDate) {
  startDate.addEventListener("change", () => {
    dateFiltersActive = true;
    applyFilters();
  });
}

if (endDate) {
  endDate.addEventListener("change", () => {
    dateFiltersActive = true;
    applyFilters();
  });
}

if (updateFilters) {
  updateFilters.addEventListener("click", () => {
    dateFiltersActive = true;
    applyFilters();
  });
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
    collapseBtn.textContent = isCollapsed ? ">>" : "<<";
  });
}

applyFilters();
