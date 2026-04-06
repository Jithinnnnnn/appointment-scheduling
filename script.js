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

let current = new Date();
let selectedDate = null;

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
  monthLabel.textContent = label;

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

renderCalendar();

if (collapseBtn && sidebar && layout) {
  collapseBtn.addEventListener("click", () => {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    layout.style.gridTemplateColumns = isCollapsed
      ? "var(--sidebar-collapsed) 1fr"
      : "var(--sidebar) 1fr";
    collapseBtn.textContent = isCollapsed ? "»" : "«";
  });
}
