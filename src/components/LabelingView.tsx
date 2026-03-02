import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Save, ExternalLink, Plus, Trash2, Circle } from "lucide-react";

interface SingleFieldRendererProps {
  field: any;
  value: any;
  onChange: (val: any) => void;
}

interface FormFieldRendererProps {
  field: any;
  value: any;
  onChange: (val: any) => void;
}

const SingleFieldRenderer: React.FC<SingleFieldRendererProps> = ({ field, value, onChange }) => {
  if (field.type === "group") {
    const obj = value || {};
    return (
      <div className="space-y-4 pl-4 border-l-2 border-orange-200 py-2">
        {(field.fields || []).map((subField: any) => (
          <FormFieldRenderer
            key={subField.id}
            field={subField}
            value={obj[subField.id]}
            onChange={(val) => onChange({ ...obj, [subField.id]: val })}
          />
        ))}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        rows={3}
        className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 sm:text-sm"
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 sm:text-sm"
      >
        <option value="">Select an option...</option>
        {field.options?.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type === "date" ? "date" : "text"}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
      className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 sm:text-sm"
    />
  );
};

const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({ field, value, onChange }) => {
  if (field.multiple) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3 border border-slate-200 p-4 rounded-lg bg-slate-50/50">
        <label className="block text-sm font-medium text-slate-700">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {arr.map((itemVal: any, idx: number) => (
          <div key={idx} className="relative border border-slate-200 bg-white p-3 rounded-md">
            <button 
              onClick={() => {
                const newArr = [...arr];
                newArr.splice(idx, 1);
                onChange(newArr);
              }} 
              className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
            >
              <Trash2 size={16}/>
            </button>
            <div className="pr-6">
              <SingleFieldRenderer 
                field={field} 
                value={itemVal} 
                onChange={(newVal) => {
                  const newArr = [...arr];
                  newArr[idx] = newVal;
                  onChange(newArr);
                }} 
              />
            </div>
          </div>
        ))}
        <button 
          onClick={() => onChange([...arr, field.type === 'group' ? {} : ''])} 
          className="text-orange-600 text-sm flex items-center gap-1 font-medium hover:text-orange-800"
        >
          <Plus size={16}/> Add {field.label}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      <SingleFieldRenderer field={field} value={value} onChange={onChange} />
    </div>
  );
};

export default function LabelingView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/items/${id}`).then((res) => res.json()),
      fetch("/api/config").then((res) => res.json()),
    ])
      .then(([itemData, configData]) => {
        setItem(itemData);
        setFields(configData.fields || []);
        setFormData(itemData.data || {});
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [id]);

  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((newFormData: any) => {
    setFormData(newFormData);
    
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => {
      saveData(item?.status || "incomplete", newFormData);
    }, 1000));
  }, [item, saveTimeout]);

  const saveData = async (status: string, data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, data }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setItem((prev: any) => ({ ...prev, status, data }));
    } catch (e) {
      console.error("Error saving data", e);
    }
    setSaving(false);
  };

  const toggleStatus = () => {
    const newStatus = item.status === "complete" ? "incomplete" : "complete";
    saveData(newStatus, formData);
  };

  if (loading)
    return (
      <div className="flex justify-center py-12 text-slate-500">
        Loading task...
      </div>
    );
  if (!item)
    return (
      <div className="flex justify-center py-12 text-red-500">
        Task not found
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/labeler")}
                className="text-slate-500 hover:text-slate-900 transition-colors p-1 hover:bg-slate-200 rounded-full"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="font-bold text-slate-900 text-lg leading-tight">Task #{item.id}</h2>
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${item.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                  {item.status === 'complete' ? 'Complete' : 'Incomplete'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pl-12">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Source URL</span>
              <span className="text-[9px] font-mono text-slate-400 break-all leading-relaxed">
                {item.url}
              </span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-100 transition-colors border border-orange-100 whitespace-nowrap shrink-0"
            >
              Open URL <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Labeling Form</h3>
          </div>
          
          <div className="space-y-6">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No fields defined. Admin needs to set up the form.
              </div>
            ) : (
              fields.map((field) => (
                <FormFieldRenderer
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  onChange={(val) => handleChange({ ...formData, [field.id]: val })}
                />
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={toggleStatus}
            disabled={saving}
            className={`w-full flex justify-center items-center gap-2 px-6 py-3 rounded-xl text-base font-bold shadow-sm transition-all disabled:opacity-50 ${
              item.status === "complete" 
                ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50" 
                : "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-200 hover:shadow-lg"
            }`}
          >
            {item.status === "complete" ? (
              <>
                <Circle size={20} />
                Mark as Incomplete
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                Mark as Complete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
