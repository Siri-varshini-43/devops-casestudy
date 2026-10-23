
const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "studymate-planner-v1";

function isDateValue(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;

    const [, year, month, day] = match.map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
}

function loadData() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (
            data &&
            Array.isArray(data.subjects) &&
            Array.isArray(data.sessions) &&
            Array.isArray(data.goals)
        ) {
            return {
                subjects: data.subjects.filter(subject =>
                    subject &&
                    typeof subject.id === "string" &&
                    typeof subject.name === "string"
                ),
                sessions: data.sessions.filter(session =>
                    session &&
                    typeof session.id === "string" &&
                    typeof session.topic === "string" &&
                    typeof session.subjectId === "string" &&
                    isDateValue(session.date) &&
                    Number.isFinite(Number(session.duration)) &&
                    Number(session.duration) > 0 &&
                    typeof session.completed === "boolean"
                ),
                goals: data.goals.filter(goal =>
                    goal &&
                    typeof goal.id === "string" &&
                    typeof goal.name === "string" &&
                    isDateValue(goal.date) &&
                    typeof goal.completed === "boolean"
                )
            };
        }
    } catch (error) {
        console.error("Could not load saved data:", error);
    }

    return { subjects: [], sessions: [], goals: [] };
}

let data = loadData();

function saveData(nextData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
        return true;
    } catch (error) {
        alert("Could not save data. Your browser storage may be full.");
        console.error(error);
        return false;
    }
}

function commitData(nextData) {
    if (!saveData(nextData)) return false;
    data = nextData;
    renderAll();
    return true;
}

function getLocalDateValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(dateValue) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function addButton(text, className, action) {
    const button = createElement("button", className, text);
    button.type = "button";
    button.addEventListener("click", action);
    return button;
}

function showEmpty(container, message) {
    container.replaceChildren(createElement("p", "empty-message", message));
}

function updateDate() {
    $("today").textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// SUBJECT MANAGEMENT

$("subjectForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = $("subjectName").value.trim();

    if (!name) return;

    const exists = data.subjects.some(
        subject => subject.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        alert("This subject already exists!");
        return;
    }

    const nextData = {
        ...data,
        subjects: [...data.subjects, {
            id: crypto.randomUUID(),
            name
        }]
    };

    if (commitData(nextData)) $("subjectForm").reset();
});

function deleteSubject(id) {
    const subject = data.subjects.find(item => item.id === id);
    if (!subject) return;

    const used = data.sessions.some(
        session => session.subjectId === id
    );

    if (used && !confirm(
        "This subject has study sessions. Delete the subject anyway?"
    )) {
        return;
    }

    const nextData = {
        ...data,
        subjects: data.subjects.filter(item => item.id !== id),
        sessions: data.sessions.map(session =>
            session.subjectId === id
                ? { ...session, subjectName: subject.name }
                : session
        )
    };
    commitData(nextData);
}

function renderSubjects() {
    const list = $("subjectList");
    const select = $("subjectSelect");

    list.replaceChildren();
    select.replaceChildren();

    select.add(new Option("Select subject", ""));

    data.subjects.forEach(subject => {
        select.add(new Option(subject.name, subject.id));

        const card = createElement("div", "subject-card");
        card.appendChild(createElement("strong", "", subject.name));
        card.appendChild(
            addButton("Delete", "delete-btn", () => deleteSubject(subject.id))
        );
        list.appendChild(card);
    });

    if (!data.subjects.length) {
        showEmpty(list, "No subjects added yet. Add your first subject!");
    }
}

// STUDY SESSION MANAGEMENT

$("sessionForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const topic = $("topic").value.trim();
    const subjectId = $("subjectSelect").value;
    const date = $("studyDate").value;
    const duration = Number($("duration").value);

    if (!data.subjects.some(subject => subject.id === subjectId)) {
        alert("Please add and select a valid subject first.");
        return;
    }

    if (!topic || !isDateValue(date) || !Number.isFinite(duration) || duration <= 0) {
        alert("Please enter valid session details.");
        return;
    }

    const subject = data.subjects.find(item => item.id === subjectId);
    const nextData = {
        ...data,
        sessions: [...data.sessions, {
            id: crypto.randomUUID(),
            topic,
            subjectId,
            subjectName: subject.name,
            date,
            duration,
            completed: false
        }]
    };

    if (commitData(nextData)) $("sessionForm").reset();
});

function toggleSession(id) {
    const session = data.sessions.find(item => item.id === id);
    if (!session) return;

    commitData({
        ...data,
        sessions: data.sessions.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        )
    });
}

function deleteSession(id) {
    commitData({
        ...data,
        sessions: data.sessions.filter(item => item.id !== id)
    });
}

function renderSessions() {
    const list = $("sessionList");
    list.replaceChildren();

    // Show the nearest study dates first.
    const sessions = [...data.sessions].sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    if (!sessions.length) {
        showEmpty(list, "No study sessions yet. Plan your first session!");
        return;
    }

    sessions.forEach(session => {
        const subject = data.subjects.find(
            item => item.id === session.subjectId
        );

        const card = createElement(
            "div",
            `session-card${session.completed ? " completed" : ""}`
        );

        const info = createElement("div", "session-info");
        info.appendChild(createElement("h3", "", session.topic));
        info.appendChild(createElement(
            "p",
            "",
            `Subject: ${subject ? subject.name : (session.subjectName || "Deleted subject")}`
        ));
        info.appendChild(createElement(
            "p",
            "",
            `Date: ${formatDate(session.date)} • Duration: ${session.duration} minutes`
        ));
        info.appendChild(createElement(
            "p",
            "",
            session.completed ? "✓ Completed" : "○ Pending"
        ));

        const actions = createElement("div", "session-actions");

        actions.appendChild(addButton(
            session.completed ? "Undo" : "Complete",
            "complete-btn",
            () => toggleSession(session.id)
        ));

        actions.appendChild(addButton(
            "Delete",
            "delete-btn",
            () => deleteSession(session.id)
        ));

        card.append(info, actions);
        list.appendChild(card);
    });
}

// DAILY GOALS

$("goalForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = $("goalName").value.trim();
    if (!name) return;

    const nextData = {
        ...data,
        goals: [...data.goals, {
            id: crypto.randomUUID(),
            name,
            completed: false,
            date: getLocalDateValue()
        }]
    };

    if (commitData(nextData)) $("goalForm").reset();
});

function toggleGoal(id, checked) {
    const goal = data.goals.find(item => item.id === id);
    if (!goal) return;

    commitData({
        ...data,
        goals: data.goals.map(item =>
            item.id === id ? { ...item, completed: checked } : item
        )
    });
}

function deleteGoal(id) {
    commitData({
        ...data,
        goals: data.goals.filter(item => item.id !== id)
    });
}

function renderGoals() {
    const list = $("goalList");
    list.replaceChildren();

    const today = getLocalDateValue();
    const todaysGoals = data.goals.filter(goal => goal.date === today);
    const completed = todaysGoals.filter(goal => goal.completed).length;

    const progress = todaysGoals.length
        ? Math.round(completed / todaysGoals.length * 100)
        : 0;

    $("progressText").textContent = `${progress}%`;
    $("progressFill").style.width = `${progress}%`;

    if (!data.goals.length) {
        showEmpty(list, "Add your daily goals to stay on track!");
        return;
    }

    // Show today's goals first, followed by older goals.
    const goals = [...data.goals].sort((a, b) =>
        b.date.localeCompare(a.date)
    );

    goals.forEach(goal => {
        const item = createElement(
            "div",
            `goal-item${goal.completed ? " done" : ""}`
        );

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = goal.completed;
        checkbox.setAttribute("aria-label", `Complete ${goal.name}`);
        checkbox.addEventListener("change", event => {
            toggleGoal(goal.id, event.target.checked);
        });

        const details = createElement("div", "goal-text");
        details.appendChild(createElement("span", "", goal.name));
        details.appendChild(createElement(
            "p",
            "goal-date",
            goal.date === today ? "Today" : formatDate(goal.date)
        ));

        item.append(
            checkbox,
            details,
            addButton("Delete", "delete-btn", () => deleteGoal(goal.id))
        );

        list.appendChild(item);
    });
}

// DASHBOARD STATISTICS

function renderDashboard() {
    $("subjectCount").textContent = data.subjects.length;
    $("sessionCount").textContent = data.sessions.length;

    $("completedCount").textContent = data.sessions.filter(
        session => session.completed
    ).length;

    const today = getLocalDateValue();

    $("pendingGoals").textContent = data.goals.filter(
        goal => goal.date === today && !goal.completed
    ).length;
}

// RENDER EVERYTHING

function renderAll() {
    renderSubjects();
    renderSessions();
    renderGoals();
    renderDashboard();
}

updateDate();
$("studyDate").value = getLocalDateValue();
$("studyDate").min = getLocalDateValue();
renderAll();
