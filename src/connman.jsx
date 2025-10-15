import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { MapPin, Edit, Trash2, Plus } from "lucide-react";
import "./connman.css";
import Sidebar from "./Sidebar";

const toast = ({ title, description }) => {
  alert(`${title}\n${description}`);
};

const ContentManager = () => {
  const [treasures, setTreasures] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [activeView, setActiveView] = useState("treasures");
  const [deleteModal, setDeleteModal] = useState({ visible: false, item: null, input: "" });
  const [imageInput, setImageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    shortDesc: "",
    description: "",
    images: [],
    type: "",
    category: "",
    coordinates: { lat: "", lng: "" },
    mapLink: "",
    details: {
      hours: "",
      fee: "",
      founded: "",
      significance: "",
      architecture: "",
      historicalNote: "",
      transportation: "",
    },
  });

  const categories = ["treasures", "landmarks"];
  const treasureTypes = ["Church", "Religious Icon"];
  const landmarkTypes = ["War Memorial", "Museum", "Historical Site", "Battle Site"];

  const formRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const treasuresSnapshot = await getDocs(collection(db, "treasures"));
      const landmarksSnapshot = await getDocs(collection(db, "landmarks"));
      setTreasures(treasuresSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLandmarks(landmarksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to fetch data" });
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      shortDesc: "",
      description: "",
      images: [],
      type: "",
      category: "",
      coordinates: { lat: "", lng: "" },
      mapLink: "",
      details: {
        hours: "",
        fee: "",
        founded: "",
        significance: "",
        architecture: "",
        historicalNote: "",
        transportation: "",
      },
    });
    setImageInput("");
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Name and Category are required.",
      });
      return;
    }

    try {
      const collectionName = formData.category;
      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), formData);
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        await addDoc(collection(db, collectionName), formData);
        toast({ title: "Success", description: "Item created successfully" });
      }
      fetchData();
      resetForm();
      setFormVisible(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: "Failed to save item" });
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      images: item.images || (item.image ? [item.image] : []),
      mapLink: item.mapLink || "",
      details: {
        ...item.details,
        transportation: item.details?.transportation || "",
      },
    });
    setEditingItem(item);
    setFormVisible(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDelete = (item) => {
    setDeleteModal({ visible: true, item, input: "" });
  };

  const confirmDelete = async () => {
    const { item, input } = deleteModal;
    
    if (input.trim() !== item.name.trim()) {
      toast({
        title: "Error",
        description: "Name does not match. Deletion cancelled.",
      });
      return;
    }

    try {
      await deleteDoc(doc(db, item.category, item.id));
      toast({
        title: "Deleted",
        description: `Item "${item.name}" deleted successfully.`,
      });
      fetchData();
      setDeleteModal({ visible: false, item: null, input: "" });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete item.",
      });
    }
  };

  const filteredItems = () => {
    const items = activeView === "treasures" ? treasures : landmarks;
    if (!searchQuery.trim()) return items;
    
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderItem = (item) => (
    <div key={item.id} className="connman-item-card">
      <div className="connman-item-header">
        <div>
          <h3 className="connman-item-title">{item.name}</h3>
          <div className="connman-item-location">
            <MapPin className="connman-location-icon" />
            {item.location}
          </div>
          <div className="connman-item-tags">
            <span className="tag tag-category">{item.category}</span>
            <span className="tag tag-type">{item.type}</span>
          </div>
        </div>
        <div className="connman-item-actions">
          <button onClick={() => handleEdit(item)} title="Edit" className="action-button edit-button">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(item)} title="Delete" className="action-button delete-button">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="connman-item-desc">{item.shortDesc}</p>
      {item.mapLink && (
        <iframe
          src={item.mapLink}
          width="100%"
          height="150"
          style={{ border: 0, marginTop: '10px', borderRadius: '8px' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`map-${item.id}`}
        />
      )}
      {item.details?.transportation && (
        <ul className="connman-item-transport">
          {item.details.transportation
            .split(/\r?\n|-/)
            .map((line, idx) => {
              const trimmed = line.trim();
              return trimmed ? <li key={idx}>{trimmed}</li> : null;
            })}
        </ul>
      )}
      {item.images && item.images.length > 0 && (
        <div className="image-gallery">
          {item.images.map((img, idx) => (
            <img key={idx} src={img} alt={`${item.name}-${idx}`} className="item-image" />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="conman-page">
      <Sidebar />
      <div className="conman-content">
        <div className="content-manager">
          <div className="header">
            <h1>Content Manager</h1>
            <button className="add-button" onClick={() => { resetForm(); setFormVisible(true); }}>
              <Plus className="inline w-4 h-4 mr-1" />
              Add New Item
            </button>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteModal.visible && (
            <div className="connman-delete-modal-overlay">
              <div className="connman-delete-modal-box">
                <h3 className="connman-delete-modal-title">Confirm Deletion</h3>
                <p className="connman-delete-modal-text">
                  To delete <strong>{deleteModal.item?.name}</strong>, please type the name exactly:
                </p>
                <input
                  type="text"
                  className="connman-delete-modal-input"
                  placeholder="Type the place name here"
                  value={deleteModal.input}
                  onChange={(e) => setDeleteModal({ ...deleteModal, input: e.target.value })}
                  autoFocus
                />
                <div className="connman-delete-modal-actions">
                  <button
                    className="connman-delete-modal-btn-cancel"
                    onClick={() => setDeleteModal({ visible: false, item: null, input: "" })}
                  >
                    Cancel
                  </button>
                  <button
                    className="connman-delete-modal-btn-delete"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {formVisible && (
            <form ref={formRef} onSubmit={handleSubmit} className="form-container">
              <div className="form-grid">
                <input
                  placeholder="Name"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <select
                  required
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <select
                required
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="">Select Type</option>
                  {(formData.category === "treasures" ? treasureTypes : landmarkTypes).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                required
                  placeholder="Location"
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <textarea
              required
                placeholder="Short Description"
                rows={2}
                className="form-textarea"
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
              />

              <textarea
              required
                placeholder="Full Description"
                rows={3}
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              {/* Multiple Images Input */}
              <div className="form-multiple-images">
                <label>Image URLs (Press Enter to add)</label>
                <input
                  type="text"
                  placeholder="Paste image URL and press Enter"
                  value={imageInput}
                  required
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (imageInput.trim() !== "") {
                        setFormData({
                          ...formData,
                          images: [...formData.images, imageInput.trim()],
                        });
                        setImageInput("");
                      }
                    }
                  }}
                />
                <div className="image-preview-container">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="image-preview-item">
                      <input
                        type="text"
                        className="preview-image-input"
                        value={img}
                        onChange={(e) => {
                          const updatedImages = [...formData.images];
                          updatedImages[idx] = e.target.value;
                          setFormData({ ...formData, images: updatedImages });
                        }}
                      />
                      <img src={img} alt={`preview-${idx}`} className="preview-image" />
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => {
                          const updatedImages = [...formData.images];
                          updatedImages.splice(idx, 1);
                          setFormData({ ...formData, images: updatedImages });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>


              {/* Map Embed Link Field */}
              <input
                placeholder="Google Map Embed Link"
                className="google-form"
                value={formData.mapLink}
                required
                onChange={(e) =>
                  setFormData({ ...formData, mapLink: e.target.value })
                }
              />

              {formData.mapLink && (
                <iframe
                  src={formData.mapLink}
                  width="100%"
                  height="200"
                  style={{ border: 0, marginTop: "10px", borderRadius: "8px" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="map-preview"
                />
              )}


              <div className="form-grid">
                <input
                required
                  placeholder="Operating Hours"
                  className="form-input"
                  value={formData.details.hours}
                  onChange={(e) => setFormData({ ...formData, details: { ...formData.details, hours: e.target.value } })}
                />
                <input
                required
                  placeholder="Entrance Fee"
                  className="form-input"
                  value={formData.details.fee}
                  onChange={(e) => setFormData({ ...formData, details: { ...formData.details, fee: e.target.value } })}
                />
              </div>

              <div className="form-grid">
                <input
                required
                  placeholder="Founded"
                  className="form-input"
                  value={formData.details.founded}
                  onChange={(e) => setFormData({ ...formData, details: { ...formData.details, founded: e.target.value } })}
                />
                <input
                required
                  placeholder="Architecture"
                  className="form-input"
                  value={formData.details.architecture}
                  onChange={(e) => setFormData({ ...formData, details: { ...formData.details, architecture: e.target.value } })}
                />
              </div>

              <textarea
              required
                placeholder="Historical Significance"
                className="form-textarea"
                value={formData.details.significance}
                onChange={(e) => setFormData({ ...formData, details: { ...formData.details, significance: e.target.value } })}
              />

              <textarea
              required
                placeholder="Historical Note"
                className="form-textarea"
                value={formData.details.historicalNote}
                onChange={(e) => setFormData({ ...formData, details: { ...formData.details, historicalNote: e.target.value } })}
              />

              <textarea
              required
                placeholder="Transportation / How to get there"
                className="form-textarea"
                value={formData.details.transportation}
                onChange={(e) => setFormData({ ...formData, details: { ...formData.details, transportation: e.target.value } })}
              />

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setFormVisible(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          )}

          <div className="view-toggle">
            <label htmlFor="viewSelector">Select View: </label>
            <select
              id="viewSelector"
              className="form-select"
              value={activeView}
              onChange={(e) => setActiveView(e.target.value)}
            >
              <option value="treasures">Treasures of Faith</option>
              <option value="landmarks">Landmarks of Revolution</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="connman-search-container">
            <input
              type="text"
              className="connman-search-input"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="connman-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <h2 className="section-header">
            {activeView === "treasures" ? "Treasures" : "Landmarks"} (
            {filteredItems().length})
          </h2>

          {loading ? (
            <p className="loading">Loading...</p>
          ) : filteredItems().length === 0 ? (
            <p className="no-results">No items found matching "{searchQuery}"</p>
          ) : (
            filteredItems().map(renderItem)
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentManager;