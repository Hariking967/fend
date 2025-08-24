"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Trash2, Search, Plus } from "lucide-react";

type Todo = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
};

const API = "http://localhost:5000/api/todos";

export default function Home() {
  const [search, setSearch] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [showForm, setShowForm] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch(`${API}`, { cache: "no-store" });
      const data = await res.json();
      setTodos(data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchByName(name: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/name/${encodeURIComponent(name)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setTodos(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!search.trim()) fetchAll();
  }, [search]);

  async function handleSearch() {
    if (search.trim()) {
      await fetchByName(search.trim());
    } else {
      await fetchAll();
    }
  }

  async function toggleComplete(todo: Todo) {
    const res = await fetch(`${API}/${todo.id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    if (res.ok) {
      await (search.trim() ? fetchByName(search) : fetchAll());
    }
  }

  async function deleteTodo(id: number) {
    if (!confirm("Delete this todo?")) return;
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (res.ok) {
      await (search.trim() ? fetchByName(search) : fetchAll());
    }
  }

  async function saveTodo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
    };

    let res;
    if (editTodo) {
      res = await fetch(`${API}/${editTodo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`${API}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (res.ok) {
      setShowForm(false);
      setEditTodo(null);
      setSearch("");
      await fetchAll();
    }
  }

  const upcoming = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 720, marginBottom: 16 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 0.4,
            marginBottom: 8,
            color: "#111827",
          }}
        >
          🗒️ Todo Manager
        </h1>

        {/* Search Row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              outline: "none",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} style={btnStyle("#6366f1", "#8b5cf6")}>
            <Search size={18} /> Search
          </button>

          <button
            onClick={() => {
              setEditTodo(null);
              setShowForm(true);
            }}
            style={btnStyle("#10b981", "#34d399")}
          >
            <Plus size={18} /> New
          </button>
        </div>
      </div>

      {/* Upcoming */}
      <Section title="Upcoming" items={upcoming}>
        {upcoming.map((t) => (
          <TodoCard
            key={t.id}
            todo={t}
            onToggle={() => toggleComplete(t)}
            onEdit={() => {
              setEditTodo(t);
              setShowForm(true);
            }}
            onDelete={() => deleteTodo(t.id)}
          />
        ))}
      </Section>

      {/* Completed */}
      <Section title="Completed" items={completed}>
        {completed.map((t) => (
          <TodoCard
            key={t.id}
            todo={t}
            onToggle={() => toggleComplete(t)}
            onEdit={() => {
              setEditTodo(t);
              setShowForm(true);
            }}
            onDelete={() => deleteTodo(t.id)}
          />
        ))}
      </Section>

      {/* Modal Form */}
      {showForm && (
        <div style={modalOverlay}>
          <form style={modalBox} onSubmit={saveTodo}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 12,
                color: "#000", // black text
              }}
            >
              {editTodo ? "Edit Todo" : "Create Todo"}
            </h2>

            <h2 style={{ color: "#000", fontSize: 16, fontWeight: 600 }}>
              Title
            </h2>
            <input
              name="title"
              placeholder="Title"
              defaultValue={editTodo?.title || ""}
              required
              style={{ ...inputStyle, color: "#000" }}
            />

            <h2 style={{ color: "#000", fontSize: 16, fontWeight: 600 }}>
              Description
            </h2>
            <textarea
              name="description"
              placeholder="Description"
              defaultValue={editTodo?.description || ""}
              style={{
                ...inputStyle,
                height: 80,
                resize: "none",
                color: "#000", // black text inside
              }}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="submit" style={btnStyle("#3b82f6", "#2563eb")}>
                Save
              </button>
              <button
                type="button"
                style={btnStyle("#ef4444", "#dc2626")}
                onClick={() => {
                  setShowForm(false);
                  setEditTodo(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  children,
}: {
  title: string;
  items: Todo[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 720, marginBottom: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No todos here.</div>
      ) : (
        children
      )}
    </div>
  );
}

function TodoCard({
  todo,
  onToggle,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { title, description, createdAt, completed } = todo;

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(255,255,255,0.8)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: completed ? "#6b7280" : "#111827",
            textDecoration: completed ? "line-through" : "none",
          }}
        >
          {title}
        </div>
        {description && (
          <div style={{ color: "#4b5563", marginBottom: 4 }}>{description}</div>
        )}
        <div style={{ color: "#6366f1", fontSize: 12, fontWeight: 600 }}>
          {new Date(createdAt).toLocaleString()}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {!completed && (
          <>
            <IconButton label="Complete" onClick={onToggle}>
              <Check size={18} />
            </IconButton>
            <IconButton label="Edit" onClick={onEdit}>
              <Pencil size={18} />
            </IconButton>
          </>
        )}
        <IconButton label="Delete" onClick={onDelete}>
          <Trash2 size={18} />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#fff",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ==== STYLES ==== */
const btnStyle = (c1: string, c2: string) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: `linear-gradient(135deg, ${c1}, ${c2})`,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
});

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
};

const modalOverlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalBox = {
  background: "#fff",
  padding: 24,
  borderRadius: 12,
  width: "100%",
  maxWidth: 400,
};
