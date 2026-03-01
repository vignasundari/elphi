import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaClock } from 'react-icons/fa';

const API_BASE = 'http://localhost:5000';

// ===== Helper: get user email =====
const getUserEmail = () => {
  const user = JSON.parse(localStorage.getItem('elphiUser'));
  return user?.email || '';
};

// ===== Helper: build user-specific localStorage key =====
const getUserStorageKey = (dateKey) => {
  const email = getUserEmail();
  return `tasks-${email}-${dateKey}`;
};

// ===== Helper: save tasks to both localStorage and backend =====
const saveTasks = (storageKey, dateKey, tasks) => {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
  const email = getUserEmail();
  if (email) {
    fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, dateKey, tasks }),
    }).catch(err => console.error('Failed to sync tasks to DB:', err));
  }
};

// ===== TaskCell =====
const STATUS_ORDER = ['Not Started', 'In Progress', 'Done'];
const getNextStatus = (current) =>
  STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];

const TaskCell = ({ date, selectedDate, setSelectedDate, tasksState, setTasksState }) => {
  const dateKey = date.toDateString();
  const storageKey = getUserStorageKey(dateKey);
  const [showForm, setShowForm] = useState(false);
  const [taskName, setTaskName] = useState('');

  const tasks = tasksState[storageKey] || [];

  useEffect(() => {
    // Load from localStorage first (fast cache)
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setTasksState(prev => ({ ...prev, [storageKey]: JSON.parse(stored) }));
      } catch (err) {
        console.error('Failed to parse tasks', err);
      }
    }
  }, [storageKey, setTasksState]);

  const addTask = () => {
    if (!taskName.trim()) return;
    const newTasks = [...tasks, { name: taskName.trim(), status: 'Not Started' }];
    setTasksState(prev => ({ ...prev, [storageKey]: newTasks }));
    saveTasks(storageKey, dateKey, newTasks);
    setTaskName('');
    setShowForm(false);
  };

  const updateStatus = (index) => {
    const newTasks = [...tasks];
    newTasks[index].status = getNextStatus(newTasks[index].status);
    setTasksState(prev => ({ ...prev, [storageKey]: newTasks }));
    saveTasks(storageKey, dateKey, newTasks);
  };

  const isSelected =
    selectedDate.getDate() === date.getDate() &&
    selectedDate.getMonth() === date.getMonth() &&
    selectedDate.getFullYear() === date.getFullYear();

  return (
    <div
      style={{
        border: '1px solid #333',
        padding: 4,
        borderRadius: 6,
        marginBottom: 4,
        background: isSelected ? '#3b82f6' : '#1f1f1f',
        color: '#fff',
        cursor: 'pointer',
      }}
      onClick={() => setSelectedDate(date)}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#2b2b2b'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1f1f1f'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span>{date.getDate()}</span>
        {!showForm && (
          <button
            style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setShowForm(true); }}
          >+</button>
        )}
      </div>

      {tasks.map((task, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 2,
            marginBottom: 2,
            background: '#2b2b2b',
            borderRadius: 4,
          }}
        >
          <span>{task.name}</span>
          <span
            onClick={() => updateStatus(idx)}
            style={{
              cursor: 'pointer',
              padding: '0 4px',
              borderRadius: 4,
              background: '#7c3aed',
              fontSize: 12,
            }}
            title="Click to change status"
          >
            {task.status}
          </span>
        </div>
      ))}

      {showForm && (
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <input
            type="text"
            value={taskName}
            placeholder="Task name"
            onChange={(e) => setTaskName(e.target.value)}
            style={{
              flex: 1,
              padding: 4,
              borderRadius: 4,
              border: '1px solid #333',
              background: '#181818',
              color: '#fff',
            }}
          />
          <button
            onClick={addTask}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ✔
          </button>
        </div>
      )}
    </div>
  );
};

// ===== CalendarPanel =====
const CalendarPanel = ({ show, onClose, selectedDate, setSelectedDate, tasksState, setTasksState }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDay = startOfMonth.getDay();

  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let d = 1; d <= endOfMonth.getDate(); d++) {
    daysArray.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d));
  }

  const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  return show ? (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.7)', zIndex: 9999, overflowY: 'auto', padding: 20,
      }}
    >
      <div style={{ background: '#1f1f1f', borderRadius: 10, padding: 20, maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#fff' }}>{monthName} {year}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, color: '#fff', cursor: 'pointer' }}>×</button>
        </div>

        {/* Month navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 18 }}><FaChevronLeft /></button>
          <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 18 }}><FaChevronRight /></button>
        </div>

        {/* Weekdays */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 8, color: '#9ca3af', fontWeight: 500 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
        </div>

        {/* Days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 16 }}>
          {daysArray.map((date, idx) =>
            date ? (
              <TaskCell key={idx} date={date} selectedDate={selectedDate} setSelectedDate={setSelectedDate} tasksState={tasksState} setTasksState={setTasksState} />
            ) : <div key={idx}></div>
          )}
        </div>
      </div>
    </div>
  ) : null;
};

// ===== Status color helper =====
const getStatusColor = (status) => {
  switch (status) {
    case 'Done': return '#4ade80';
    case 'In Progress': return '#fbbf24';
    default: return '#94a3b8';
  }
};

const getStatusBg = (status) => {
  switch (status) {
    case 'Done': return 'rgba(74, 222, 128, 0.15)';
    case 'In Progress': return 'rgba(251, 191, 36, 0.15)';
    default: return 'rgba(148, 163, 184, 0.1)';
  }
};

// ===== Upcoming Tasks Section =====
const UpcomingTasks = ({ upcomingTasks }) => {
  if (!upcomingTasks || upcomingTasks.length === 0) {
    return (
      <div style={{ padding: '16px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        <FaCalendarAlt style={{ fontSize: 20, marginBottom: 6, opacity: 0.5 }} />
        <p>No upcoming tasks</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {upcomingTasks.map((doc, docIdx) => {
        const dateObj = new Date(doc.dateKey);
        const isToday = new Date().toDateString() === dateObj.toDateString();
        const dayLabel = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        return (
          <div key={docIdx}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 6, fontSize: 12, fontWeight: 600,
              color: isToday ? '#a78bfa' : '#64748b',
            }}>
              <FaClock style={{ fontSize: 10 }} />
              {dayLabel}
            </div>
            {doc.tasks.filter(t => t.status !== 'Done').map((task, tIdx) => (
              <div key={tIdx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', marginBottom: 4,
                borderRadius: 8, background: getStatusBg(task.status),
                borderLeft: `3px solid ${getStatusColor(task.status)}`,
              }}>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>{task.name}</span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 10,
                  background: getStatusColor(task.status), color: '#0f172a', fontWeight: 600,
                }}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ===== Main Component =====
const CalendarAndTasks = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksState, setTasksState] = useState({});
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  // Load tasks from backend on mount
  const loadTasksFromDB = useCallback(async () => {
    const email = getUserEmail();
    if (!email) return;
    try {
      const now = new Date();
      const res = await fetch(
        `${API_BASE}/api/tasks/month?email=${encodeURIComponent(email)}&year=${now.getFullYear()}&month=${now.getMonth()}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.tasks && Object.keys(data.tasks).length > 0) {
          // Re-key with user-specific localStorage keys
          const remapped = {};
          Object.entries(data.tasks).forEach(([key, tasks]) => {
            // key from backend is like "tasks-Mon Feb 24 2026"
            const dateKey = key.replace('tasks-', '');
            const userKey = getUserStorageKey(dateKey);
            remapped[userKey] = tasks;
            localStorage.setItem(userKey, JSON.stringify(tasks));
          });
          setTasksState(prev => ({ ...prev, ...remapped }));
        }
      }
    } catch (err) {
      console.error('Failed to load tasks from DB:', err);
    }
  }, []);

  // Load upcoming tasks
  const loadUpcomingTasks = useCallback(async () => {
    const email = getUserEmail();
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/upcoming?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setUpcomingTasks(data.upcoming || []);
      }
    } catch (err) {
      console.error('Failed to load upcoming tasks:', err);
    }
  }, []);

  useEffect(() => {
    loadTasksFromDB();
    loadUpcomingTasks();
  }, [loadTasksFromDB, loadUpcomingTasks]);

  // Refresh upcoming tasks when tasksState changes (user added/updated a task)
  useEffect(() => {
    loadUpcomingTasks();
  }, [tasksState, loadUpcomingTasks]);

  const togglePanel = () => setShowPanel(prev => !prev);

  return (
    <div style={{ padding: '20px 20px 8px' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 20, color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#a78bfa' }}>Task Calendar</h2>

        {/* Calendar shown above Add Task */}
        <CalendarPanel show={showPanel} onClose={togglePanel} selectedDate={selectedDate} setSelectedDate={setSelectedDate} tasksState={tasksState} setTasksState={setTasksState} />

        <button
          onClick={togglePanel}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            background: '#7c3aed',
            color: '#fff',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          <FaPlus /> Add Task
        </button>

        {/* ===== Upcoming Tasks Section ===== */}
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaCalendarAlt style={{ fontSize: 13 }} /> Upcoming Tasks
          </h3>
          <UpcomingTasks upcomingTasks={upcomingTasks} />
        </div>
      </div>
    </div>
  );
};

export default CalendarAndTasks;
