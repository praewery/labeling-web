import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink, ListTodo } from "lucide-react";

export default function LabelerDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error("Failed to load items:", data);
          setItems([]);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error fetching items:", e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-slate-500">
        Loading items...
      </div>
    );
  }

  const completedCount = items.filter((i) => i.status === "complete").length;
  const progress = items.length
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ListTodo className="text-orange-600" />
          Tasks
        </h1>
        <div className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          {completedCount} / {items.length} Completed ({progress}%)
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No items to label. Ask the admin to upload some tasks.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/labeler/${item.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {item.status === "complete" ? (
                      <CheckCircle2 className="text-emerald-500" size={20} />
                    ) : (
                      <Circle
                        className="text-slate-300 group-hover:text-orange-400 transition-colors"
                        size={20}
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <span
                        className={`font-medium ${item.status === "complete" ? "text-slate-600 line-through" : "text-slate-900"}`}
                      >
                        {item.url}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${item.status === "complete" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {item.status === "complete" ? "Complete" : "Incomplete"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 group-hover:text-orange-600 transition-colors">
                    <span className="text-sm font-medium">Label</span>
                    <ExternalLink size={16} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
