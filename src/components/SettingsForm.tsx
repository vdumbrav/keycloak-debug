import { useState, useEffect } from 'react'
import type { OidcSettings } from '../types'
import { DEFAULT_SETTINGS } from '../constants'
import { getSavedSettings, saveSettings, clearSettings } from '../helpers'

interface SettingsFormProps {
  settings: OidcSettings
  onSave: (settings: OidcSettings) => void
  onClose: () => void
}

export function SettingsForm({ settings, onSave, onClose }: SettingsFormProps) {
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setForm(getSavedSettings())
  }, [])

  useEffect(() => {
    const savedSettings = getSavedSettings()
    const changed = JSON.stringify(form) !== JSON.stringify(savedSettings)
    setHasChanges(changed)
    setSaved(false)
  }, [form])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveSettings(form)
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => onSave(form), 500)
  }

  const handleSaveOnly = () => {
    saveSettings(form)
    setSaved(true)
    setHasChanges(false)
  }

  const handleReset = () => {
    clearSettings()
    setForm(DEFAULT_SETTINGS)
    setSaved(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[1000] p-0 md:p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-card rounded-t-2xl md:rounded-2xl p-5 md:p-6 w-full md:w-[90%] md:max-w-[550px] shadow-lg border border-card-border max-h-[90vh] overflow-y-auto animate-slide-in-bottom md:animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 gap-3">
          <h2 className="m-0 text-lg text-foreground font-semibold">OIDC Settings</h2>
          <div className="flex-1 flex justify-center">
            {saved && <span className="bg-success text-white px-3 py-1 rounded-full text-xs font-medium">Saved!</span>}
            {hasChanges && <span className="bg-warning text-foreground px-3 py-1 rounded-full text-xs font-medium">Unsaved changes</span>}
          </div>
          <button className="bg-transparent border-none text-muted-foreground text-2xl cursor-pointer hover:text-foreground" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <FormField
            label="Authority"
            value={form.authority}
            onChange={(value) => setForm({ ...form, authority: value })}
            placeholder="https://auth.example.com/realms/myrealm"
          />
          <FormField
            label="Client ID"
            value={form.clientId}
            onChange={(value) => setForm({ ...form, clientId: value })}
          />
          <FormField
            label="Scope"
            value={form.scope}
            onChange={(value) => setForm({ ...form, scope: value })}
          />
          <FormField
            label="Redirect URI"
            value={form.redirectUri}
            onChange={(value) => setForm({ ...form, redirectUri: value })}
          />

          <div className="flex flex-col md:flex-row gap-3 md:justify-end mt-6">
            <button
              type="button"
              className="h-11 px-5 py-3 rounded-full text-label-lg bg-surface-container text-foreground hover:bg-surface-container/80 transition-all border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring order-3 md:order-1"
              onClick={handleReset}
            >
              Reset to Default
            </button>
            <button
              type="button"
              className="h-11 px-5 py-3 rounded-full text-label-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring order-2"
              onClick={handleSaveOnly}
              disabled={!hasChanges}
            >
              Save
            </button>
            <button
              type="submit"
              className="h-11 px-5 py-3 rounded-full text-label-lg bg-success text-white hover:bg-success/90 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring order-1 md:order-3"
            >
              Save & Reconnect
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-foreground text-label-lg">{label}</label>
      <input
        className="w-full px-4 py-3 bg-surface-container border border-input-border rounded-xl text-body-lg text-foreground placeholder:text-[var(--placeholder)] transition-all duration-200 ease-out focus:outline-2 focus:outline-primary focus:outline-offset-0 focus:border-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
