const habitForm = document.getElementById("habitForm");
const habitInput = document.getElementById("habitInput");
const habitList = document.getElementById("habitList");
const emptyState = document.getElementById("emptyState");

const totalHabits = document.getElementById("totalHabits");
const completedHabits = document.getElementById("completedHabits");
const bestStreak = document.getElementById("bestStreak");

const clearAllBtn = document.getElementById("clearAllBtn");

const STORAGE_KEY = "habit_tracker_v1";

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

function addHabit(name) {
  habits.unshift({
    id: crypto.randomUUID(),
    name,
    streak: 0,
    completedToday: false,
    createdAt: Date.now(),
  });

  saveHabits();
  render();
}

function toggleHabit(id) {
  habits = habits.map((habit) => {
    if (habit.id !== id) return habit;

    if (habit.completedToday) {
      return {
        ...habit,
        streak: Math.max(0, habit.streak - 1),
        completedToday: false,
      };
    }

    return {
      ...habit,
      streak: habit.streak + 1,
      completedToday: true,
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

function updateStats() {
  const total = habits.length;
  const completed = habits.filter((habit) => habit.completedToday).length;
  const best = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);

  totalHabits.textContent = total;
  completedHabits.textContent = completed;
  bestStreak.textContent = best;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createHabitItem(habit) {
  const li = document.createElement("li");
  li.className = "habit-item";

  li.innerHTML = `
    <div class="habit-main">
      <h3 class="habit-name">${escapeHtml(habit.name)}</h3>
      <div class="habit-meta">
        <span class="meta-pill">Streak: ${habit.streak}</span>
        ${
          habit.completedToday
            ? `<span class="meta-pill success">Bugün tamamlandı</span>`
            : `<span class="meta-pill">Bugün bekliyor</span>`
        }
      </div>
    </div>

    <div class="habit-actions">
      <button
        class="done-btn ${habit.completedToday ? "completed" : ""}"
        data-action="toggle"
        data-id="${habit.id}"
      >
        ${habit.completedToday ? "Geri Al" : "Tamamlandı"}
      </button>

      <button
        class="delete-btn"
        data-action="delete"
        data-id="${habit.id}"
      >
        Sil
      </button>
    </div>
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

  updateStats();
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = habitInput.value.trim();

  if (!name) {
    habitInput.focus();
    return;
  }

  addHabit(name);
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