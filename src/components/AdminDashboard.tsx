import React, { useState, useEffect } from "react";
import {
  Plus,
  MinusCircle,
  Copy,
  Trash2,
  Upload,
  Download,
  Save,
  Settings,
  ListPlus,
  Edit2,
  X,
  Check,
  Eye,
  GripVertical,
  Link as LinkIcon,
  Eraser,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

type FieldType = "text" | "textarea" | "select" | "date" | "group";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For select
  required: boolean;
  multiple?: boolean;
  fields?: FormField[]; // For group
}

const SortableFieldEditor = ({
  field,
  onChange,
  onDelete,
  onDuplicate,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? 1.02 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className={`p-4 border rounded-lg bg-white shadow-sm flex gap-4 items-start group transition-all duration-200 ${isDragging ? 'border-orange-400 shadow-lg ring-2 ring-orange-100' : 'border-slate-200 hover:border-orange-200'}`}>
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
        >
          <GripVertical size={20} />
        </div>
        <FieldEditor field={field} onChange={onChange} onDelete={onDelete} onDuplicate={onDuplicate} />
      </div>
    </div>
  );
};

const FieldEditor = ({
  field,
  onChange,
  onDelete,
  onDuplicate,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const addSubField = (type: FieldType) => {
    onChange({
      ...field,
      fields: [
        ...(field.fields || []),
        {
          id: crypto.randomUUID(),
          label: `New ${type}`,
          type,
          required: false,
          options: type === "select" ? ["Option 1", "Option 2"] : undefined,
        },
      ],
    });
  };

  const updateSubField = (idx: number, updated: FormField) => {
    const newFields = [...(field.fields || [])];
    newFields[idx] = updated;
    onChange({ ...field, fields: newFields });
  };

  const removeSubField = (idx: number) => {
    const newFields = [...(field.fields || [])];
    newFields.splice(idx, 1);
    onChange({ ...field, fields: newFields });
  };

  const duplicateSubField = (idx: number) => {
    const newFields = [...(field.fields || [])];
    const original = newFields[idx];
    
    // Deep clone helper for nested groups
    const cloneField = (f: FormField): FormField => ({
      ...f,
      id: crypto.randomUUID(),
      label: `${f.label} (Copy)`,
      fields: f.fields ? f.fields.map(cloneField) : undefined
    });

    newFields.splice(idx + 1, 0, cloneField(original));
    onChange({ ...field, fields: newFields });
  };

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-3">
        <span className="bg-slate-100 text-slate-500 text-xs font-mono px-2 py-1 rounded">
          {field.type}
        </span>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="flex-1 font-medium text-slate-900 border-none focus:ring-0 p-0 text-sm bg-transparent"
          placeholder="Field Label"
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            className="rounded text-orange-600 focus:ring-orange-500"
          />
          Required
        </label>
        <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={field.multiple || false}
            onChange={(e) => onChange({ ...field, multiple: e.target.checked })}
            className="rounded text-orange-600 focus:ring-orange-500"
          />
          Allow Multiple
        </label>
      </div>

      {field.type === "select" && (
        <div className="pt-2">
          <label className="text-xs text-slate-500 font-medium mb-1 block">
            Options (comma separated)
          </label>
          <input
            type="text"
            value={field.options?.join(", ") || ""}
            onChange={(e) =>
              onChange({
                ...field,
                options: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            className="w-full text-sm border-slate-200 rounded-md focus:border-orange-500 focus:ring-orange-500"
            placeholder="Option 1, Option 2"
          />
        </div>
      )}

      {field.type === "group" && (
        <div className="pt-4 pl-4 border-l-2 border-slate-200 space-y-4">
          {(field.fields || []).map((subField, idx) => (
            <div
              key={subField.id}
              className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 flex gap-3 items-start group/sub"
            >
              <FieldEditor
                field={subField}
                onChange={(f) => updateSubField(idx, f)}
                onDelete={() => removeSubField(idx)}
                onDuplicate={() => duplicateSubField(idx)}
              />
              <div className="flex flex-col gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                <button
                  onClick={() => duplicateSubField(idx)}
                  className="text-slate-300 hover:text-orange-500 transition-colors p-1"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => removeSubField(idx)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  title="Remove"
                >
                  <MinusCircle size={14} />
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => addSubField("text")}
              className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50"
            >
              + Text
            </button>
            <button
              onClick={() => addSubField("textarea")}
              className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50"
            >
              + Multiline
            </button>
            <button
              onClick={() => addSubField("select")}
              className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50"
            >
              + Dropdown
            </button>
            <button
              onClick={() => addSubField("date")}
              className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50"
            >
              + Date
            </button>
            <button
              onClick={() => addSubField("group")}
              className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50"
            >
              + Group
            </button>
          </div>
        </div>
      )}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDuplicate}
          className="text-slate-300 hover:text-orange-500 transition-colors p-1"
          title="Duplicate"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={onDelete}
          className="text-slate-300 hover:text-red-500 transition-colors p-1"
          title="Remove"
        >
          <MinusCircle size={18} />
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [urlsInput, setUrlsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [viewingData, setViewingData] = useState<any>(null);

  const completedCount = items.filter(i => i.status === 'complete').length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const fetchItems = () => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .catch((e) => console.error("Error fetching items:", e));
  };

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setFields(data.fields || []));
    fetchItems();
  }, []);

  const addField = (type: FieldType) => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(),
        label: `New ${type} field`,
        type,
        required: false,
        options: type === "select" ? ["Option 1", "Option 2"] : undefined,
      },
    ]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const duplicateField = (id: string) => {
    const originalIdx = fields.findIndex(f => f.id === id);
    if (originalIdx === -1) return;
    
    const original = fields[originalIdx];
    
    const cloneField = (f: FormField): FormField => ({
      ...f,
      id: crypto.randomUUID(),
      label: `${f.label} (Copy)`,
      fields: f.fields ? f.fields.map(cloneField) : undefined
    });

    const newFields = [...fields];
    newFields.splice(originalIdx + 1, 0, cloneField(original));
    setFields(newFields);
  };

  const saveForm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Form saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Error saving form");
    }
    setLoading(false);
  };

  const uploadUrls = async () => {
    const urls = urlsInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u);
    if (!urls.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      if (!res.ok) throw new Error("Failed to upload");
      setUrlsInput("");
      fetchItems();
      setMessage(`${urls.length} items uploaded successfully!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Error uploading items");
    }
    setLoading(false);
  };

  const exportData = async (onlySelected = false) => {
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error("Failed to fetch items");
      let dataToExport = await res.json();

      if (onlySelected) {
        dataToExport = dataToExport.filter((item: any) => selectedItems.includes(item.id));
      }

      if (!dataToExport.length) return alert("No data to export");

      // Helper to flatten fields for headers
      const getFlattenedFields = (
        formFields: FormField[],
        prefix = ""
      ): { id: string; label: string }[] => {
        let result: { id: string; label: string }[] = [];
        for (const field of formFields) {
          const currentLabel = prefix ? `${prefix} > ${field.label}` : field.label;
          if (field.type === "group") {
            result = [
              ...result,
              ...getFlattenedFields(field.fields || [], currentLabel),
            ];
          } else {
            result.push({ id: field.id, label: currentLabel });
          }
        }
        return result;
      };

      const flattenedFields = getFlattenedFields(fields);
      const headers = ["id", "url", "status", ...flattenedFields.map((f) => f.label)];

      const rows = dataToExport.map((item: any) => {
        const itemData = item.data || {};

        // Helper to extract value from nested data structure
        const getValue = (data: any, fieldId: string): string => {
          const findValue = (obj: any, targetId: string): any => {
            if (!obj || typeof obj !== 'object') return undefined;
            if (targetId in obj) return obj[targetId];
            
            for (const key in obj) {
              const val = findValue(obj[key], targetId);
              if (val !== undefined) return val;
            }
            return undefined;
          };

          const val = findValue(data, fieldId);
          if (val === undefined) return "";
          if (Array.isArray(val)) return val.join("; ");
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        };

        const fieldValues = flattenedFields.map((f) => getValue(itemData, f.id));

        return [item.id, item.url, item.status, ...fieldValues]
          .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
          .join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = onlySelected ? `export_selected_${new Date().toISOString().split('T')[0]}.csv` : `export_all_${new Date().toISOString().split('T')[0]}.csv`;
      a.download = filename;
      a.click();
    } catch (e) {
      console.error(e);
      alert("Error exporting data");
    }
  };

  const totalReset = async () => {
    setLoading(true);
    try {
      const res1 = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: [] }),
      });
      const res2 = await fetch("/api/items", { method: "DELETE" });
      if (!res1.ok || !res2.ok) throw new Error("Failed to reset");
      setFields([]);
      fetchItems();
      setSelectedItems([]);
      setMessage("Total reset completed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Error during total reset");
    }
    setLoading(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(items.map((i) => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const deleteSelectedItems = async () => {
    if (!selectedItems.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/items/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedItems }),
      });
      if (!res.ok) throw new Error("Failed to delete items");
      setSelectedItems([]);
      fetchItems();
      setMessage("Items deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Error deleting items");
    }
    setLoading(false);
  };

  const deleteSingleItem = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/items/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error("Failed to delete item");
      setSelectedItems(selectedItems.filter(i => i !== id));
      fetchItems();
      setMessage("Item deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Error deleting item");
    }
    setLoading(false);
  };

  const saveEditItem = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editUrl }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      setEditingItem(null);
      fetchItems();
      setMessage("Item updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Error updating item");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="text-orange-600" />
          Admin Dashboard
        </h1>
        {message && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-md text-sm font-medium">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Builder */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">
              Form Builder
            </h2>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                No fields added yet. Add some fields below.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    <AnimatePresence>
                      {fields.map((field) => (
                        <motion.div
                          key={field.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 1
                          }}
                        >
                          <SortableFieldEditor
                            field={field}
                            onChange={(f) => updateField(field.id, f)}
                            onDelete={() => removeField(field.id)}
                            onDuplicate={() => duplicateField(field.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => addField("text")}
                className="flex items-center gap-1 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Plus size={14} /> Text
              </button>
              <button
                onClick={() => addField("textarea")}
                className="flex items-center gap-1 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Plus size={14} /> Multiline
              </button>
              <button
                onClick={() => addField("select")}
                className="flex items-center gap-1 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Plus size={14} /> Dropdown
              </button>
              <button
                onClick={() => addField("date")}
                className="flex items-center gap-1 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Plus size={14} /> Date
              </button>
              <button
                onClick={() => addField("group")}
                className="flex items-center gap-1 text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-orange-300 hover:text-orange-600 transition-colors"
              >
                <Plus size={14} /> Group
              </button>
            </div>
            
            <button
              onClick={saveForm}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-3 rounded-xl text-base font-bold hover:bg-orange-700 transition-all disabled:opacity-50 shadow-md shadow-orange-100"
            >
              <Save size={20} />
              Save Form Configuration
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                Bulk Import
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-2 py-1 rounded">
                  {urlsInput.split('\n').filter(u => u.trim()).length} Items Detected
                </span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="relative group">
                <div className="absolute top-3 left-3 text-slate-300 group-focus-within:text-orange-400 transition-colors">
                  <LinkIcon size={18} />
                </div>
                <textarea
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  className="w-full h-64 pl-10 pr-4 py-3 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 font-mono text-xs leading-relaxed bg-slate-50/30 transition-all resize-none"
                  placeholder="Paste your URLs here...&#10;https://example.com/page-1&#10;https://example.com/page-2"
                />
                {urlsInput && (
                  <button
                    onClick={() => setUrlsInput("")}
                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Clear all"
                  >
                    <Eraser size={16} />
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={uploadUrls}
                  disabled={loading || !urlsInput.trim()}
                  className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-xl text-base font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200 active:scale-[0.98]"
                >
                  <Upload size={20} />
                  Import URLs
                </button>
                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Paste one URL per line. Duplicates will be ignored automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  Manage Items ({items.length})
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-200/50 rounded-md p-0.5 h-8">
                    <button
                      onClick={() => exportData(false)}
                      className="flex items-center gap-1 text-slate-600 hover:text-orange-600 px-2 h-7 rounded text-xs font-medium transition-colors"
                      title="Export All"
                    >
                      <Download size={16} /> All
                    </button>
                    <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                    <button
                      onClick={() => exportData(true)}
                      disabled={selectedItems.length === 0}
                      className="flex items-center gap-1 text-slate-600 hover:text-orange-600 px-2 h-7 rounded text-xs font-medium transition-colors disabled:opacity-30 disabled:hover:text-slate-600"
                      title="Export Selected"
                    >
                      <Download size={16} /> Selected ({selectedItems.length})
                    </button>
                  </div>
                  
                  {selectedItems.length > 0 && (
                    <button
                      onClick={deleteSelectedItems}
                      disabled={loading}
                      className="flex items-center gap-1 bg-red-100 text-red-700 px-2.5 h-8 rounded-md text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} /> Delete Selected ({selectedItems.length})
                    </button>
                  )}
                  <button
                    onClick={totalReset}
                    disabled={loading}
                    className="flex items-center gap-1 bg-red-600 text-white px-2.5 h-8 rounded-md text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} /> Total Reset
                  </button>
                </div>
              </div>

              {/* Progress Tracking */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600">Labeling Progress</span>
                  <span className="text-orange-600">{completedCount} / {items.length} ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-orange-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="p-0 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No items uploaded yet.
                </div>
              ) : (
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === items.length && items.length > 0}
                          onChange={handleSelectAll}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">URL</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          #{item.id}
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate">
                          {editingItem === item.id ? (
                            <input
                              type="text"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="w-full border-slate-300 rounded-md text-sm px-2 py-1"
                            />
                          ) : (
                            <span title={item.url}>{item.url}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.data && Object.keys(item.data).length > 0 && (
                              <button
                                onClick={() => setViewingData(item)}
                                className="text-slate-500 hover:text-orange-600 p-1"
                                title="View Data"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {editingItem === item.id ? (
                              <>
                                <button
                                  onClick={() => saveEditItem(item.id)}
                                  className="text-emerald-600 hover:text-emerald-800 p-1"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingItem(item.id);
                                    setEditUrl(item.url);
                                  }}
                                  className="text-orange-600 hover:text-orange-800 p-1"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => deleteSingleItem(item.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Data Modal */}
      {viewingData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Submitted Data</h3>
                <p className="text-xs text-slate-500 font-mono">Item #{viewingData.id} - {viewingData.url}</p>
              </div>
              <button 
                onClick={() => setViewingData(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="space-y-6">
                {fields.map(field => {
                  const value = viewingData.data?.[field.id];
                  return (
                    <div key={field.id} className="border-b border-slate-50 pb-4 last:border-0">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        {field.label}
                      </label>
                      <div className="text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[40px]">
                        {value === undefined || value === "" ? (
                          <span className="text-slate-400 italic text-sm">No data</span>
                        ) : Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-2">
                            {value.map((v, i) => (
                              <span key={i} className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-sm border border-orange-100">
                                {String(v)}
                              </span>
                            ))}
                          </div>
                        ) : typeof value === 'object' ? (
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-sm">{String(value)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setViewingData(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
