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
let dateFiltersTouched = false;

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
  const minRows = 9;
  const highlightMatches = hasActiveFilters() && data.length > 0;
  const rows = data
    .map(
      (item) => `
        <div class="appointments-row${highlightMatches ? " appointments-row--match" : ""}" role="row" data-id="${item.id}">
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

function hasActiveFilters() {
  const hasPatient = Boolean(patientSearch?.value.trim());
  const hasDoctor = Boolean(doctorSearch?.value.trim());
  const hasDate = Boolean(dateFiltersActive && (startDate?.value || endDate?.value));
  return hasPatient || hasDoctor || hasDate;
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
      event.setAttribute("data-id", item.id);

      const info = document.createElement("div");
      info.className = "day-event-info";

      const patient = document.createElement("div");
      patient.className = "event-patient";
      patient.textContent = item.patient;

      const doctor = document.createElement("div");
      doctor.className = "event-doctor";
      doctor.textContent = item.doctor;

      const time = document.createElement("div");
      time.className = "event-time";
      time.textContent = formatTimeDisplay(item.time);

      info.appendChild(patient);
      info.appendChild(doctor);
      info.appendChild(time);

      const actions = document.createElement("div");
      actions.className = "day-event-actions";
      actions.appendChild(createEventActionButton("edit", item.id));
      actions.appendChild(createEventActionButton("delete", item.id));
      actions.appendChild(createEventActionButton("note", item.id));

      event.appendChild(info);
      event.appendChild(actions);
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

function createEventActionButton(type, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `day-event-btn day-event-btn--${type}`;
  button.setAttribute("data-id", id);

  const labels = {
    edit: "Edit appointment",
    delete: "Delete appointment",
    note: "Add note",
  };
  button.setAttribute("aria-label", labels[type] || "Appointment action");

  if (type === "edit") {
    button.innerHTML = `
      <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3.33333 11.8751H4.276L10.4853 6.0538L9.54267 5.17005L3.33333 10.9913V11.8751ZM14 13.1251H2V10.4732L10.9567 2.0763C11.0817 1.95913 11.2512 1.89331 11.428 1.89331C11.6048 1.89331 11.7743 1.95913 11.8993 2.0763L13.7853 3.84443C13.9103 3.96163 13.9805 4.12057 13.9805 4.2863C13.9805 4.45203 13.9103 4.61097 13.7853 4.72818L6.162 11.8751H14V13.1251ZM10.4853 4.2863L11.428 5.17005L12.3707 4.2863L11.428 3.40255L10.4853 4.2863Z" fill="#2E2E2E" fill-opacity="0.9"/>
      </svg>
    `;
  }

  if (type === "delete") {
    button.innerHTML = `
      <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4.66669 13.125C4.30002 13.125 3.98624 13.0027 3.72535 12.7581C3.46402 12.5131 3.33335 12.2188 3.33335 11.875V3.75C3.14446 3.75 2.98602 3.69021 2.85802 3.57062C2.73046 3.45062 2.66669 3.30208 2.66669 3.125C2.66669 2.94792 2.73046 2.79938 2.85802 2.67938C2.98602 2.55979 3.14446 2.5 3.33335 2.5H6.00002C6.00002 2.32292 6.06402 2.17437 6.19202 2.05437C6.31958 1.93479 6.4778 1.875 6.66669 1.875H9.33335C9.52224 1.875 9.68069 1.93479 9.80869 2.05437C9.93624 2.17437 10 2.32292 10 2.5H12.6667C12.8556 2.5 13.0138 2.55979 13.1414 2.67938C13.2694 2.79938 13.3334 2.94792 13.3334 3.125C13.3334 3.30208 13.2694 3.45062 13.1414 3.57062C13.0138 3.69021 12.8556 3.75 12.6667 3.75V11.875C12.6667 12.2188 12.5362 12.5131 12.2754 12.7581C12.014 13.0027 11.7 13.125 11.3334 13.125H4.66669ZM4.66669 3.75V11.875H11.3334V3.75H4.66669ZM6.00002 10C6.00002 10.1771 6.06402 10.3254 6.19202 10.445C6.31958 10.565 6.4778 10.625 6.66669 10.625C6.85558 10.625 7.01402 10.565 7.14202 10.445C7.26958 10.3254 7.33335 10.1771 7.33335 10V5.625C7.33335 5.44792 7.26958 5.29937 7.14202 5.17937C7.01402 5.05979 6.85558 5 6.66669 5C6.4778 5 6.31958 5.05979 6.19202 5.17937C6.06402 5.29937 6.00002 5.44792 6.00002 5.625V10ZM8.66669 10C8.66669 10.1771 8.73069 10.3254 8.85869 10.445C8.98624 10.565 9.14447 10.625 9.33335 10.625C9.52224 10.625 9.68069 10.565 9.80869 10.445C9.93624 10.3254 10 10.1771 10 10V5.625C10 5.44792 9.93624 5.29937 9.80869 5.17937C9.68069 5.05979 9.52224 5 9.33335 5C9.14447 5 8.98624 5.05979 8.85869 5.17937C8.73069 5.29937 8.66669 5.44792 8.66669 5.625V10Z" fill="#2E2E2E" fill-opacity="0.9"/>
      </svg>
    `;
  }

  if (type === "note") {
    button.innerHTML = `
      <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M7.33335 9.375V10.625C7.33335 10.8021 7.39735 10.9504 7.52535 11.07C7.65291 11.19 7.81113 11.25 8.00002 11.25C8.18891 11.25 8.34735 11.19 8.47535 11.07C8.60291 10.9504 8.66669 10.8021 8.66669 10.625V9.375H10C10.1889 9.375 10.3474 9.315 10.4754 9.195C10.6029 9.07542 10.6667 8.92708 10.6667 8.75C10.6667 8.57292 10.6029 8.42437 10.4754 8.30437C10.3474 8.18479 10.1889 8.125 10 8.125H8.66669V6.875C8.66669 6.69792 8.60291 6.54937 8.47535 6.42937C8.34735 6.30979 8.18891 6.25 8.00002 6.25C7.81113 6.25 7.65291 6.30979 7.52535 6.42937C7.39735 6.54937 7.33335 6.69792 7.33335 6.875V8.125H6.00002C5.81113 8.125 5.65291 8.18479 5.52535 8.30437C5.39735 8.42437 5.33335 8.57292 5.33335 8.75C5.33335 8.92708 5.39735 9.07542 5.52535 9.195C5.65291 9.315 5.81113 9.375 6.00002 9.375H7.33335ZM4.00002 13.75C3.63335 13.75 3.31958 13.6277 3.05869 13.3831C2.79735 13.1381 2.66669 12.8437 2.66669 12.5V2.5C2.66669 2.15625 2.79735 1.86187 3.05869 1.61687C3.31958 1.37229 3.63335 1.25 4.00002 1.25H8.78335C8.96113 1.25 9.13069 1.28125 9.29202 1.34375C9.45291 1.40625 9.59447 1.49479 9.71669 1.60938L12.95 4.64062C13.0722 4.75521 13.1667 4.88792 13.2334 5.03875C13.3 5.19 13.3334 5.34896 13.3334 5.51562V12.5C13.3334 12.8437 13.2029 13.1381 12.942 13.3831C12.6807 13.6277 12.3667 13.75 12 13.75H4.00002ZM8.66669 5V2.5H4.00002V12.5H12V5.625H9.33335C9.14447 5.625 8.98624 5.565 8.85869 5.445C8.73069 5.32542 8.66669 5.17708 8.66669 5Z" fill="#2E2E2E" fill-opacity="0.9"/>
      </svg>
    `;
  }

  return button;
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

function setDateFilterActive() {
  const hasStart = Boolean(startDate?.value);
  const hasEnd = Boolean(endDate?.value);
  dateFiltersActive = dateFiltersTouched && (hasStart || hasEnd);
}

function validatePatientSearchRequired() {
  if (!patientSearch) return true;
  const value = patientSearch.value.trim();
  if (!value) {
    patientSearch.setCustomValidity("Patient name is required");
    patientSearch.reportValidity();
    return false;
  }
  patientSearch.setCustomValidity("");
  return true;
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

calendarDays.addEventListener("click", (event) => {
  const actionButton = event.target.closest(".day-event-btn");
  if (!actionButton) return;
  event.stopPropagation();

  const id = actionButton.getAttribute("data-id");
  const appointment = appointments.find((item) => item.id === id);
  if (!appointment) return;

  if (actionButton.classList.contains("day-event-btn--edit")) {
    openEditModal(appointment);
    return;
  }

  if (actionButton.classList.contains("day-event-btn--delete")) {
    const confirmed = window.confirm("Delete this appointment?");
    if (!confirmed) return;
    appointments = appointments.filter((item) => item.id !== id);
    saveAppointments();
    applyFilters();
    return;
  }

  if (actionButton.classList.contains("day-event-btn--note")) {
    openEditModal(appointment);
    const noteField = form.querySelector("textarea[name='reason']");
    if (noteField) noteField.focus();
  }
});

if (patientSearch) {
  patientSearch.addEventListener("input", applyFilters);
  patientSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  });
  patientSearch.addEventListener("input", () => {
    patientSearch.setCustomValidity("");
  });
}

if (doctorSearch) {
  doctorSearch.addEventListener("input", applyFilters);
  doctorSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  });
}

if (startDate) {
  startDate.addEventListener("change", () => {
    dateFiltersTouched = true;
    setDateFilterActive();
  });
}

if (endDate) {
  endDate.addEventListener("change", () => {
    dateFiltersTouched = true;
    setDateFilterActive();
  });
}

if (updateFilters) {
  updateFilters.addEventListener("click", (event) => {
    event.preventDefault();
    const isValid = validatePatientSearchRequired();
    if (!isValid) return;
    setDateFilterActive();
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
