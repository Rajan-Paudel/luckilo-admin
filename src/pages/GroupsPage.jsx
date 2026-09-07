import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchGroups } from "../redux/slice/dataSlice";
import useApiCall from "../hooks/useApiCall";
import { serverBaseURL } from "../utils/siteconfig";
import Cropper from "react-easy-crop";
import {
  MessageCircle, Loader2, Plus, X, AlertTriangle, Trash2, Save, Check
} from "lucide-react";

const GENDER_OPTIONS = ["Any", "Male", "Female"];

const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        resolve(blob);
      }, "image/jpeg", 0.9);
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
};

const GroupsPage = () => {
  const dispatch = useDispatch();
  const apiCall = useApiCall();
  const { groups, groupsFetched, loading } = useSelector((state) => state.data);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [cropperImage, setCropperImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    avatarUrl: "",
    genderRestriction: "Any",
    minAge: "",
    maxAge: "",
    requiresActiveMilestone: false,
    isActive: true,
    sortOrder: 10,
  });

  useEffect(() => {
    if (!groupsFetched) dispatch(fetchGroups());
  }, [dispatch, groupsFetched]);

  const refreshGroups = () => dispatch(fetchGroups());

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperImage(reader.result);
      setShowCropper(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCropAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropperImage || !cropAreaPixels) return;
    try {
      const blob = await getCroppedImg(cropperImage, cropAreaPixels);
      const previewUrl = URL.createObjectURL(blob);
      setCroppedBlob(blob);
      setImagePreview(previewUrl);
      setForm((prev) => ({ ...prev, avatarUrl: "" }));
      setShowCropper(false);
      setCropperImage(null);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperImage(null);
  };

  const removeImage = () => {
    setImagePreview(null);
    setCroppedBlob(null);
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      avatarUrl: "",
      genderRestriction: "Any",
      minAge: "",
      maxAge: "",
      requiresActiveMilestone: false,
      isActive: true,
      sortOrder: 10,
    });
    setImagePreview(null);
    setCroppedBlob(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const openEdit = (g) => {
    setForm({
      name: g.name,
      description: g.description || "",
      avatarUrl: g.avatarUrl || "",
      genderRestriction: g.genderRestriction,
      minAge: g.minAge?.toString() || "",
      maxAge: g.maxAge?.toString() || "",
      requiresActiveMilestone: g.requiresActiveMilestone,
      isActive: g.isActive,
      sortOrder: g.sortOrder,
    });
    setImagePreview(g.avatarUrl || null);
    setCroppedBlob(null);
    setEditingId(g.id);
    setShowCreate(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      let avatarUrl = form.avatarUrl.trim() || null;

      if (croppedBlob) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", croppedBlob, "avatar.jpg");

        const token = localStorage.getItem("auth");
        const response = await fetch(`${serverBaseURL}/api/upload/group-avatar`, {
          method: "POST",
          headers: {
            "ngrok-skip-browser-warning": "true",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: uploadFormData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || `Image upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        avatarUrl = data.url;
      }

      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        avatarUrl,
        genderRestriction: form.genderRestriction,
        minAge: form.minAge ? parseInt(form.minAge) : null,
        maxAge: form.maxAge ? parseInt(form.maxAge) : null,
        requiresActiveMilestone: form.requiresActiveMilestone,
        isActive: editingId ? form.isActive : true,
        sortOrder: editingId ? parseInt(form.sortOrder) : 10,
      };

      if (editingId) {
        await apiCall(`admin/groups/${editingId}`, "PUT", body, true);
      } else {
        await apiCall("admin/groups", "POST", body, true);
      }

      setShowCreate(false);
      resetForm();
      refreshGroups();
    } catch (err) {
      console.error("Failed to save group:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiCall(`admin/groups/${confirmDelete}`, "DELETE", null, true);
      setConfirmDelete(null);
      refreshGroups();
    } catch (err) {
      console.error("Failed to delete group:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <main className="py-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MessageCircle size={20} className="text-gold" />
                <h1 className="text-xl text-white font-medium">Chat Groups</h1>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-gold text-obsidian-950 px-4 py-2 text-sm font-medium hover:bg-gold-hover transition-colors"
              >
                <Plus size={16} />
                Create Group
              </button>
            </div>

            <div className="bg-obsidian-900 border border-white/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4 w-12">Avatar</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Name</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Gender</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Age Range</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Active Milestone</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Status</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Order</th>
                      <th className="text-right text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          {g.avatarUrl ? (
                            <img
                              src={g.avatarUrl}
                              alt=""
                              className="w-8 h-8 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-obsidian-800 flex items-center justify-center">
                              <span className="text-xs text-white/30 font-medium">{g.name?.charAt(0)?.toUpperCase() || "?"}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{g.name}</div>
                          {g.description && (
                            <div className="text-xs text-white/30 mt-0.5 max-w-[200px] truncate">{g.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-white/60">{g.genderRestriction === "Any" ? "-" : g.genderRestriction}</td>
                        <td className="px-6 py-4 text-white/60">
                          {g.minAge || g.maxAge
                            ? `${g.minAge ?? 0} - ${g.maxAge ?? 150}`
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {g.requiresActiveMilestone ? (
                            <span className="text-xs px-2 py-0.5 bg-gold/10 text-gold/80">Required</span>
                          ) : (
                            <span className="text-xs text-white/30">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-0.5 ${g.isActive ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                            {g.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60">{g.sortOrder}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(g)}
                              className="text-xs px-3 py-1.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(g.id)}
                              className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {groups.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-white/30">
                          No groups found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="bg-obsidian-900 border border-white/8 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-white font-medium">
                {editingId ? "Edit Group" : "Create Group"}
              </h2>
              <button
                onClick={() => { setShowCreate(false); resetForm(); }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                  placeholder="Group name"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50 resize-none"
                  placeholder="Brief description of the group"
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Group Avatar (Optional)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="groupAvatarInput"
                  />
                  <label
                    htmlFor="groupAvatarInput"
                    className="cursor-pointer bg-obsidian-950 border border-white/10 text-white/60 px-4 py-3 text-xs hover:border-white/30 transition-colors"
                  >
                    Choose Image
                  </label>
                  {(imagePreview || form.avatarUrl) && (
                    <div className="relative">
                      <img
                        src={imagePreview || form.avatarUrl}
                        alt="Preview"
                        className="w-10 h-10 object-cover border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Gender Restriction</label>
                  <select
                    value={form.genderRestriction}
                    onChange={(e) => setForm({ ...form, genderRestriction: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o} value={o} className="bg-obsidian-900">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Min Age</label>
                  <input
                    type="number"
                    value={form.minAge}
                    onChange={(e) => setForm({ ...form, minAge: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                    placeholder="None"
                    min={1}
                    max={150}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Max Age</label>
                  <input
                    type="number"
                    value={form.maxAge}
                    onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
                    className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                    placeholder="None"
                    min={1}
                    max={150}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.requiresActiveMilestone}
                    onChange={(e) => setForm({ ...form, requiresActiveMilestone: e.target.checked })}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="text-sm text-white/60 group-hover:text-white transition-colors">Requires active milestone</span>
                </label>

                {editingId && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-sm text-white/60 group-hover:text-white transition-colors">Active</span>
                  </label>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  className="flex-1 bg-white/5 text-white/60 py-3 text-sm hover:bg-white/10 transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-gold text-obsidian-950 py-3 text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={16} /> {editingId ? "Update" : "Create"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCropper && (
        <div className="fixed inset-0 z-[60] bg-obsidian-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="bg-obsidian-900 border border-white/8 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-white font-medium">Crop Image</h2>
              <button
                onClick={handleCropCancel}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative w-full aspect-square bg-obsidian-950 overflow-hidden">
              <Cropper
                image={cropperImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={false}
                style={{
                  containerStyle: { borderRadius: "0" },
                  cropAreaStyle: { border: "2px solid rgba(212, 175, 55, 0.6)" },
                }}
              />
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-white/40 shrink-0">Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-gold"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="flex-1 bg-white/5 text-white/60 py-3 text-sm hover:bg-white/10 transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="flex-1 bg-gold text-obsidian-950 py-3 text-sm font-medium hover:bg-gold-hover transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="bg-obsidian-900 border border-white/8 p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-400/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Delete Group</h3>
                <p className="text-sm text-white/40">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-6">
              Are you sure you want to delete this group? All messages in this group will remain in the database but the group will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/5 text-white/60 py-3 text-sm hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-3 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupsPage;
