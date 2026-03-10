const habitForm = document.getElementById("habitForm");
const habitInput = document.getElementById("habitInput");
const habitCategory = document.getElementById("habitCategory");
const habitList = document.getElementById("habitList");
const emptyState = document.getElementById("emptyState");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const completionPercent = document.getElementById("completionPercent");
const bestStreak = document.getElementById("bestStreak");
const activeHabits = document.getElementById("activeHabits");
const summaryNote = document.getElementById("summaryNote");
const todayText = document.getElementById("todayText");
const ringProgress = document.getElementById("ringProgress");

const clearAllBtn = document.getElementById("clearAllBtn");

const STORAGE_KEY = "habit_tracker_v2";
const RING_CIRCUMFERENCE = 2 * Math.PI * 48;

let habits = readHabits();

function readHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function getTodayDate() {
  return new Date();
}

function toYMD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return toYMD(getTodayDate());
}

function formatToday() {
  return getTodayDate().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function addHabit(name, category) {
  habits.unshift({
    id: crypto.randomUUID(),
    name,
    category,
    streak: 0,
    createdAt: Date.now(),
    checkedDays: [],
  });

  saveHabits();
  render();
}

function toggleHabit(id) {
  const today = getTodayKey();

  habits = habits.map((habit) => {
    if (habit.id !== id) return habit;

    const hasToday = habit.checkedDays.includes(today);

    if (hasToday) {
      const newDays = habit.checkedDays.filter((day) => day !== today);
      return {
        ...habit,
        checkedDays: newDays,
        streak: Math.max(0, habit.streak - 1),
      };
    }

    return {
      ...habit,
      checkedDays: [...habit.checkedDays, today],
      streak: habit.streak + 1,
    };
  });

  saveHabits();
  render();
}

function deleteHabit(id) {
  habits = habits.filter((habit) => habit.id !== id);
  saveHabits();
  render();
}

function clearAllHabits() {
  const confirmed = window.confirm("Tüm alışkanlıkları silmek istediğine emin misin?");
  if (!confirmed) return;

  habits = [];
  saveHabits();
  render();
}

function isCompletedToday(habit) {
  return habit.checkedDays.includes(getTodayKey());
}

function getLast7Days() {
  const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = getTodayDate();
    d.setDate(d.getDate() - i);

    days.push({
      key: toYMD(d),
      label: labels[(d.getDay() + 6) % 7],
      isToday: toYMD(d) === getTodayKey(),
    });
  }

  return days;
}

function updateSummary() {
  const total = habits.length;
  const completed = habits.filter(isCompletedToday).length;
  const best = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;

  totalCount.textContent = total;
  completedCount.textContent = completed;
  completionPercent.textContent = `${percent}%`;
  bestStreak.textContent = best;
  activeHabits.textContent = total;
  todayText.textContent = formatToday();

  ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  ringProgress.style.strokeDashoffset = `${offset}`;

  if (total === 0) {
    summaryNote.textContent = "Bugün için ilk adımı at.";
  } else if (percent === 100) {
    summaryNote.textContent = "Harika. Bugünün tüm kayıtlarını tamamladın.";
  } else if (percent >= 50) {
    summaryNote.textContent = "İyi gidiyorsun. Kalanları da kapat.";
  } else {
    summaryNote.textContent = "Ritmi yakala. Bugün birkaç adım daha at.";
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createWeekTrack(habit) {
  const days = getLast7Days();

  return `
    <div class="week-track">
      ${days
        .map((day) => {
          const done = habit.checkedDays.includes(day.key);
          const todayClass = day.isToday ? "today" : "";

          return `
            <div class="day-box ${done ? "done" : ""} ${todayClass}">
              <span>${day.label}</span>
              <div class="day-dot"></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function createHabitItem(habit) {
  const completed = isCompletedToday(habit);

  const li = document.createElement("li");
  li.className = "habit-item";

  li.innerHTML = `
    <div class="habit-row">
      <div class="habit-main">
        <h3 class="habit-name">${escapeHtml(habit.name)}</h3>

        <div class="habit-tags">
          <span class="tag">${escapeHtml(habit.category)}</span>
          <span class="tag">Streak: ${habit.streak}</span>
          ${
            completed
              ? `<span class="tag success">Bugün tamamlandı</span>`
              : `<span class="tag">Bugün bekliyor</span>`
          }
        </div>
      </div>

      <div class="habit-actions">
        <button
          class="action-btn ${completed ? "completed" : ""}"
          data-action="toggle"
          data-id="${habit.id}"
        >
          ${completed ? "Geri Al" : "Tamamlandı"}
        </button>

        <button
          class="delete-btn"
          data-action="delete"
          data-id="${habit.id}"
        >
          Sil
        </button>
      </div>
    </div>

    ${createWeekTrack(habit)}
  `;

  return li;
}

function render() {
  habitList.innerHTML = "";

  if (habits.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    habits.forEach((habit) => {
      habitList.appendChild(createHabitItem(habit));
    });
  }

  updateSummary();
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = habitInput.value.trim();
  const category = habitCategory.value;

  if (!name) {
    habitInput.focus();
    return;
  }

  addHabit(name, category);
  habitInput.value = "";
  habitInput.focus();
});

habitList.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  const { action, id } = target.dataset;

  if (action === "toggle") toggleHabit(id);
  if (action === "delete") deleteHabit(id);
});

clearAllBtn.addEventListener("click", clearAllHabits);

render();