import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { getMyRestaurant } from '../../api/users'
import { getDishes, addDish, updateDish, deleteDish } from '../../api/dishes'
import Spinner from '../../components/Spinner'
import { formatPrice } from '../../utils/format'
import { getErrorMessage } from '../../utils/errors'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Uncategorized' },
  { value: 'starter', label: 'Starter' },
  { value: 'main', label: 'Main' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Drink' }
]

const MAX_TAGS = 10

const emptyForm = () => ({
  name: '',
  description: '',
  price: '',
  category: '',
  available: true,
  tags: []
})

const addTagsFromInput = (input, currentTags) => {
  const trimmed = String(input).trim().replace(/,+$/, '')
  if (!trimmed) return { tags: currentTags, cleared: '' }
  const parts = trimmed.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  const merged = [...currentTags]
  parts.forEach((part) => {
    if (merged.length >= MAX_TAGS) return
    if (!merged.some((t) => t.toLowerCase() === part)) {
      merged.push(part)
    }
  })
  return { tags: merged.slice(0, MAX_TAGS), cleared: '' }
}

const groupByCategory = (dishes) => {
  const groups = {}
  dishes.forEach((dish) => {
    const key = dish.category?.trim() || 'Uncategorized'
    if (!groups[key]) groups[key] = []
    groups[key].push(dish)
  })
  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({ label, items: groups[label] }))
}

export default function MenuManager() {
  const [restaurant, setRestaurant] = useState(null)
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm())
  const [tagInput, setTagInput] = useState('')
  const [editTagInput, setEditTagInput] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const restaurantId = restaurant?.id || restaurant?._id

  const loadDishes = (rid) => {
    return getDishes(rid)
      .then((res) => setDishes(res.data.dishes || []))
      .catch((err) => {
        setDishes([])
        setError(getErrorMessage(err, 'Failed to load menu items.'))
      })
  }

  const loadRestaurant = () => {
    setLoading(true)
    setError('')
    getMyRestaurant()
      .then((res) => {
        setRestaurant(res.data)
        const rid = res.data.id || res.data._id
        return loadDishes(rid)
      })
      .catch((err) => {
        setRestaurant(null)
        setDishes([])
        if (err.response?.status === 404) {
          setError('')
        } else {
          setError(getErrorMessage(err, 'Failed to load your restaurant.'))
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRestaurant()
  }, [])

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!restaurantId) return
    if (!form.name.trim()) return setFormError('Name is required.')
    if (!form.price || Number(form.price) <= 0) return setFormError('Enter a valid price.')

    setSubmitting(true)
    setFormError('')
    setFormSuccess('')
    try {
      await addDish({
        restaurant_id: restaurantId,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        available: form.available,
        tags: form.tags
      })
      setForm(emptyForm())
      setTagInput('')
      setFormSuccess('Menu item added.')
      await loadDishes(restaurantId)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not add menu item.'))
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (dish) => {
    const id = dish.id || dish._id
    setEditingId(id)
    setEditForm({
      name: dish.name || '',
      description: dish.description || '',
      price: String(dish.price ?? ''),
      category: dish.category || '',
      available: dish.available !== false,
      tags: Array.isArray(dish.tags) ? dish.tags.map((t) => String(t).toLowerCase()) : []
    })
    setEditTagInput('')
    setFormError('')
    setFormSuccess('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(emptyForm())
    setEditTagInput('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!restaurantId || !editingId) return
    if (!editForm.name.trim()) return setFormError('Name is required.')
    if (!editForm.price || Number(editForm.price) <= 0) return setFormError('Enter a valid price.')

    setSavingEdit(true)
    setFormError('')
    try {
      await updateDish(restaurantId, editingId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price),
        category: editForm.category,
        available: editForm.available,
        tags: editForm.tags
      })
      setEditingId(null)
      setEditTagInput('')
      setFormSuccess('Menu item updated.')
      await loadDishes(restaurantId)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not update menu item.'))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleToggleAvailable = async (dish) => {
    if (!restaurantId) return
    const id = dish.id || dish._id
    const next = !(dish.available !== false)
    try {
      await updateDish(restaurantId, id, { available: next })
      await loadDishes(restaurantId)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not update availability.'))
    }
  }

  const commitFormTags = () => {
    if (form.tags.length >= MAX_TAGS) return
    const trimmed = tagInput.trim().replace(/,+$/, '')
    if (!trimmed) return
    const { tags: next } = addTagsFromInput(tagInput, form.tags)
    setForm((f) => ({ ...f, tags: next }))
    setTagInput('')
  }

  const commitEditTags = () => {
    if (editForm.tags.length >= MAX_TAGS) return
    const trimmed = editTagInput.trim().replace(/,+$/, '')
    if (!trimmed) return
    const { tags: next } = addTagsFromInput(editTagInput, editForm.tags)
    setEditForm((f) => ({ ...f, tags: next }))
    setEditTagInput('')
  }

  const handleDelete = async (dish) => {
    if (!restaurantId) return
    const id = dish.id || dish._id
    if (!window.confirm(`Delete "${dish.name}" from the menu?`)) return
    try {
      await deleteDish(restaurantId, id)
      if (editingId === id) cancelEdit()
      setFormSuccess('Menu item deleted.')
      await loadDishes(restaurantId)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not delete menu item.'))
    }
  }

  if (loading) return <div className="page-center"><Spinner /></div>

  if (!restaurant) {
    return (
      <div className="container page-layout">
        <div className="page-top">
          <h1 className="page-title">Menu Manager</h1>
        </div>
        <div className="card create-restaurant-form-card">
          {error && <div className="alert alert-error">{error}</div>}
          <p className="empty-state-sm">
            You need to create a restaurant before adding menu items.
          </p>
          <Link to="/restaurants/new" className="btn btn-primary btn-sm">
            Create your restaurant
          </Link>
        </div>
      </div>
    )
  }

  const grouped = groupByCategory(dishes)

  return (
    <div className="container page-layout">
      <div className="page-top">
        <div>
          <h1 className="page-title">Menu Manager</h1>
          <p className="page-subtitle">{restaurant.name} — add and edit menu items</p>
        </div>
        <Link to="/dashboard/reviewer" className="btn btn-outline btn-sm">
          ← Back to dashboard
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

      <div className="card create-restaurant-form-card">
        <h2 className="form-section-title">Add menu item</h2>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleAddSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label className="label" htmlFor="dish-name">Name *</label>
              <input
                id="dish-name"
                type="text"
                className="form-control"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="dish-price">Price *</label>
              <input
                id="dish-price"
                type="number"
                min="0.01"
                step="0.01"
                className="form-control"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="dish-description">Description</label>
            <textarea
              id="dish-description"
              className="form-control"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="label" htmlFor="dish-category">Category</label>
              <select
                id="dish-category"
                className="form-control"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                />
                Available on menu
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="dish-tags-add">Tags</label>
            <input
              id="dish-tags-add"
              type="text"
              className="form-control"
              placeholder="Type a tag and press Enter or comma"
              value={tagInput}
              disabled={form.tags.length >= MAX_TAGS}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  commitFormTags()
                }
              }}
              onBlur={commitFormTags}
            />
            {form.tags.length >= MAX_TAGS && (
              <p className="empty-state-sm">Maximum 10 tags reached</p>
            )}
            {form.tags.length > 0 && (
              <div className="tag-list">
                {form.tags.map((tag) => (
                  <span key={tag} className="tag-pill sm">
                    {String(tag).toLowerCase()}
                    <button
                      type="button"
                      className="btn-text danger"
                      onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add item'}
          </button>
        </form>
      </div>

      <section className="detail-section">
        <h2 className="section-title">Current menu ({dishes.length})</h2>
        {dishes.length === 0 ? (
          <p className="empty-state-sm">No menu items yet. Add your first dish above.</p>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label} className="detail-section">
              <h3 className="form-section-title">{label}</h3>
              <div className="bookmarks-list">
                {items.map((dish) => {
                  const dishId = dish.id || dish._id
                  const isEditing = editingId === dishId

                  if (isEditing) {
                    return (
                      <div key={dishId} className="card create-restaurant-form-card">
                        <form onSubmit={handleEditSubmit}>
                          <div className="form-row-2">
                            <div className="form-group">
                              <label className="label">Name *</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label className="label">Price *</label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="form-control"
                                value={editForm.price}
                                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                                required
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="label">Description</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={editForm.description}
                              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                            />
                          </div>
                          <div className="form-row-2">
                            <div className="form-group">
                              <label className="label">Category</label>
                              <select
                                className="form-control"
                                value={editForm.category}
                                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                              >
                                {CATEGORY_OPTIONS.map((opt) => (
                                  <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="toggle-label">
                                <input
                                  type="checkbox"
                                  checked={editForm.available}
                                  onChange={(e) => setEditForm((f) => ({ ...f, available: e.target.checked }))}
                                />
                                Available on menu
                              </label>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="label" htmlFor={`dish-tags-edit-${dishId}`}>Tags</label>
                            <input
                              id={`dish-tags-edit-${dishId}`}
                              type="text"
                              className="form-control"
                              placeholder="Type a tag and press Enter or comma"
                              value={editTagInput}
                              disabled={editForm.tags.length >= MAX_TAGS}
                              onChange={(e) => setEditTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault()
                                  commitEditTags()
                                }
                              }}
                              onBlur={commitEditTags}
                            />
                            {editForm.tags.length >= MAX_TAGS && (
                              <p className="empty-state-sm">Maximum 10 tags reached</p>
                            )}
                            {editForm.tags.length > 0 && (
                              <div className="tag-list">
                                {editForm.tags.map((tag) => (
                                  <span key={tag} className="tag-pill sm">
                                    {String(tag).toLowerCase()}
                                    <button
                                      type="button"
                                      className="btn-text danger"
                                      onClick={() => setEditForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                                      aria-label={`Remove ${tag}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="btn-row">
                            <button type="submit" className="btn btn-primary btn-sm" disabled={savingEdit}>
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" className="btn btn-outline btn-sm" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )
                  }

                  return (
                    <div key={dishId} className="bookmark-item">
                      <div className="bookmark-info">
                        <h4>{dish.name}</h4>
                        <span className="dish-price">{formatPrice(dish.price)}</span>
                        {dish.category && <span className="cuisine-badge">{dish.category}</span>}
                        {dish.tags?.length > 0 && (
                          <div className="tag-list">
                            {dish.tags.map((tag) => (
                              <span key={tag} className="tag-pill sm">{String(tag).toLowerCase()}</span>
                            ))}
                          </div>
                        )}
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={dish.available !== false}
                            onChange={() => handleToggleAvailable(dish)}
                          />
                          {dish.available !== false ? 'Available' : 'Unavailable'}
                        </label>
                      </div>
                      <div className="btn-row">
                        <button type="button" className="btn-text" onClick={() => startEdit(dish)}>
                          Edit
                        </button>
                        <button type="button" className="btn-text danger" onClick={() => handleDelete(dish)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
