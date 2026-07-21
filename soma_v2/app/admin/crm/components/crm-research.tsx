"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Globe, Loader2, Mail, MapPin, Navigation, Phone, Search, Sparkles, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { type CRMContact, type CRMResearchRecord, EmptyState, ScoreBadge } from "./crm-shared"
import type L_Type from "leaflet"

interface ResearchProps {
  research: CRMResearchRecord[]
  contacts: CRMContact[]
  lastResults: any[]
  isResearching: boolean
  onRunResearch: () => void
  onOpenContactIntelligence: (lead: { contactId?: string | null; companyName: string; domain: string }) => void
  onKeepLead: (lead: DiscoveryLead) => void
  onRejectLead: (lead: DiscoveryLead) => void
}

interface DiscoveryLead {
  id: string
  contactId?: string | null
  companyName: string
  domain: string
  location: string
  locationAddress?: string | null
  latitude?: number | null
  longitude?: number | null
  fitScore: number
  description: string
  phone?: string | null
  email?: string | null
  businessType?: string | null
  socialLinks?: Record<string, string | null> | null
  keyContacts: Array<{ name: string; title: string; email?: string; linkedin?: string }>
  sourcesUsed: string[]
  isFresh: boolean
  isContact: boolean
}

const DEFAULT_CENTER: [number, number] = [39.5, -98.35]
const DEFAULT_ZOOM = 4

function createCircleIcon(L: typeof L_Type, color: string, size: number, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.2)">${label}</div>`,
  })
}

export type { DiscoveryLead }

export function CRMResearch({ research, contacts, lastResults, isResearching, onRunResearch, onOpenContactIntelligence, onKeepLead, onRejectLead }: ResearchProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L_Type.Map | null>(null)
  const markersRef = useRef<L_Type.Marker[]>([])
  const prevLeadCountRef = useRef(0)
  const [mapReady, setMapReady] = useState(false)
  const [keptLeadIds, setKeptLeadIds] = useState<Set<string>>(new Set())
  const [locationQuery, setLocationQuery] = useState("")
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

  const parseCoord = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
    return null
  }

  const leads = useMemo<DiscoveryLead[]>(() => {
    const freshLeads = lastResults.map((prospect, index) => ({
      id: `fresh-${prospect.domain || prospect.company_name || index}`,
      contactId: prospect.contact_id || prospect.contactId || prospect.contact?.id || null,
      companyName: prospect.company_name || "Unknown business",
      domain: prospect.domain || "No domain",
      location: prospect.location || "Unknown location",
      locationAddress: prospect.location_address || prospect.company_address || prospect.formatted_address || null,
      latitude: parseCoord(prospect.latitude ?? prospect.company_latitude ?? prospect.raw_data?.latitude ?? prospect.search_data?.latitude),
      longitude: parseCoord(prospect.longitude ?? prospect.company_longitude ?? prospect.raw_data?.longitude ?? prospect.search_data?.longitude),
      description: prospect.description || prospect.recommended_approach || "No profile summary available yet.",
      phone: prospect.phone || null,
      email: prospect.email || null,
      businessType: prospect.business_type || null,
      socialLinks: prospect.social_links || null,
      fitScore: prospect.fit_score || 0,
      keyContacts: prospect.key_contacts || [],
      sourcesUsed: prospect.sources_used || [],
      isFresh: true,
      isContact: false,
    }))

    const historyLeads = research.map((item) => ({
      id: item.id,
      contactId: item.contact?.id || null,
      companyName: item.company_name || item.contact?.company_name || "Unknown business",
      domain: item.domain || "No domain",
      location: item.location || "Unknown location",
      locationAddress: item.location_address || item.raw_data?.location_address || null,
      latitude: parseCoord(item.latitude ?? item.raw_data?.latitude),
      longitude: parseCoord(item.longitude ?? item.raw_data?.longitude),
      description: item.description || item.recommended_approach || "No profile summary available yet.",
      phone: item.contact?.phone || item.raw_data?.phone || null,
      email: item.contact?.email || item.raw_data?.email || null,
      businessType: item.raw_data?.business_type || null,
      socialLinks: item.raw_data?.social_links || null,
      fitScore: item.fit_score || 0,
      keyContacts: item.raw_data?.key_contacts || [],
      sourcesUsed: item.sources_used || [],
      isFresh: false,
      isContact: false,
    }))

    // Build leads from saved contacts that have geo data
    const contactLeads = contacts
      .filter((c) => c.company_latitude != null && c.company_longitude != null)
      .map((c) => ({
        id: `contact-${c.id}`,
        contactId: c.id,
        companyName: c.company_name || c.full_name || "Unknown business",
        domain: c.company_domain || "No domain",
        location: [c.company_city, c.company_country].filter(Boolean).join(", ") || "Unknown location",
        locationAddress: c.company_address || null,
        latitude: c.company_latitude,
        longitude: c.company_longitude,
        description: c.company_description || c.notes || "No profile summary available yet.",
        phone: c.phone || null,
        email: c.email || null,
        businessType: (c.research_data as any)?.business_type || null,
        socialLinks: (c.research_data as any)?.social_links || null,
        fitScore: c.lead_score || 0,
        keyContacts: (c.research_data as any)?.key_contacts || [],
        sourcesUsed: [] as string[],
        isFresh: false,
        isContact: true,
      }))

    const deduped = new Map<string, DiscoveryLead>()

    for (const lead of [...freshLeads, ...historyLeads, ...contactLeads]) {
      const key = lead.domain !== "No domain" ? lead.domain : `${lead.companyName}-${lead.location}`
      if (!deduped.has(key)) deduped.set(key, lead)
    }

    return Array.from(deduped.values()).sort((left, right) => right.fitScore - left.fitScore)
  }, [lastResults, research, contacts])

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  useEffect(() => {
    if (!leads.length) {
      setSelectedLeadId(null)
      return
    }

    setSelectedLeadId((current) => {
      if (current && leads.some((lead) => lead.id === current)) return current
      return leads[0]?.id || null
    })
  }, [leads])

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) || null
  const mappableLeads = useMemo(() => leads.filter((lead) => lead.latitude != null && lead.longitude != null), [leads])

  const leafletRef = useRef<typeof L_Type | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    let cancelled = false

    import("leaflet").then((leafletModule) => {
      if (cancelled || !mapContainerRef.current) return
      const L = leafletModule.default
      leafletRef.current = L

      // Import CSS
      import("leaflet/dist/leaflet.css")

      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map).addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')

      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      cancelled = true
      if (mapRef.current) mapRef.current.remove()
      mapRef.current = null
      markersRef.current = []
      leafletRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !mapReady || !leafletRef.current) return
    const L = leafletRef.current

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds = L.latLngBounds([])

    for (const lead of mappableLeads) {
      const isSelected = selectedLead?.id === lead.id
      const label = lead.isContact ? "C" : String(Math.max(1, Math.round(lead.fitScore / 5)))
      const color = isSelected ? "#18181b" : lead.isContact ? "#16a34a" : "#0284c7"
      const marker = L.marker(
        [lead.latitude as number, lead.longitude as number],
        { icon: createCircleIcon(L, color, isSelected ? 24 : 20, label) }
      )
        .addTo(mapRef.current!)
        .on("click", () => setSelectedLeadId(lead.id))

      markersRef.current.push(marker as unknown as L.CircleMarker)
      bounds.extend([lead.latitude as number, lead.longitude as number])
    }

    const shouldFitBounds = mappableLeads.length !== prevLeadCountRef.current
    prevLeadCountRef.current = mappableLeads.length

    if (shouldFitBounds) {
      if (mappableLeads.length === 0) {
        mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
      } else {
        mapRef.current.fitBounds(bounds, { padding: [64, 64] })
      }
    }

    if (selectedLead?.latitude != null && selectedLead?.longitude != null) {
      mapRef.current.panTo([selectedLead.latitude, selectedLead.longitude])
      if ((mapRef.current.getZoom() || 0) < 8) mapRef.current.setZoom(8)
    }
  }, [mappableLeads, selectedLead, mapReady])

  const searchLocation = async () => {
    if (!locationQuery.trim() || !mapRef.current) return
    setIsSearchingLocation(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery.trim())}&format=json&limit=1`, {
        headers: { "Accept": "application/json" },
      })
      const results = await res.json()
      if (results.length > 0) {
        const { lat, lon, boundingbox } = results[0]
        if (boundingbox && leafletRef.current) {
          const L = leafletRef.current
          mapRef.current.fitBounds(
            L.latLngBounds(
              [parseFloat(boundingbox[0]), parseFloat(boundingbox[2])],
              [parseFloat(boundingbox[1]), parseFloat(boundingbox[3])]
            ),
            { padding: [32, 32] }
          )
        } else {
          mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 12)
        }
      }
    } catch { /* silently fail */ }
    setIsSearchingLocation(false)
  }

  return (
    <div className="h-[calc(100vh-9.5rem)] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 relative">
      {/* Map container — always rendered behind all overlays */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Top bar */}
      {(leads.length > 0 || isResearching) && (
        <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/95 px-3 py-2 text-xs text-zinc-600 shadow-sm backdrop-blur">
            <Globe className="h-3.5 w-3.5" />
            {mappableLeads.length} on map
            {leads.filter((l) => l.isContact).length > 0 && (
              <Badge variant="outline" className="ml-1 bg-emerald-50 text-emerald-700 border-emerald-200">{leads.filter((l) => l.isContact).length} contacts</Badge>
            )}
            {leads.filter((l) => l.isFresh).length > 0 && (
              <Badge variant="outline" className="ml-1">{leads.filter((l) => l.isFresh).length} new</Badge>
            )}
          </div>
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]" onClick={onRunResearch} disabled={isResearching}>
            <Sparkles className={`mr-2 h-4 w-4 ${isResearching ? "animate-spin" : ""}`} />
            {isResearching ? "Scraping..." : "Run scrape"}
          </Button>
        </div>
      )}

      {/* Location search bar */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 w-full max-w-sm">
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
          <Navigation className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-1" />
          <Input
            className="h-8 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 px-1"
            placeholder="Go to a city, state, or country..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") searchLocation() }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs shrink-0"
            onClick={searchLocation}
            disabled={isSearchingLocation || !locationQuery.trim()}
          >
            {isSearchingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Go"}
          </Button>
        </div>
      </div>

      {/* Selected lead detail card — compact */}
      {selectedLead && (
        <div className="absolute left-6 top-20 z-20 w-full max-w-[300px] rounded-xl border border-zinc-200 bg-white/95 shadow-sm backdrop-blur flex flex-col">
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-950">{selectedLead.companyName}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{selectedLead.location}</span>
                </div>
              </div>
              <ScoreBadge score={selectedLead.fitScore} />
            </div>

            <p className="mt-2 text-xs text-zinc-600 leading-relaxed line-clamp-3">{selectedLead.description}</p>

            {/* Quick contact links */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {selectedLead.domain !== "No domain" && (
                <a href={`https://${selectedLead.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline truncate">
                  <Globe className="h-3 w-3" /> {selectedLead.domain}
                </a>
              )}
              {selectedLead.phone && (
                <a href={`tel:${selectedLead.phone}`} className="inline-flex items-center gap-1 text-zinc-600 hover:underline">
                  <Phone className="h-3 w-3 text-zinc-400" /> {selectedLead.phone}
                </a>
              )}
              {selectedLead.email && (
                <a href={`mailto:${selectedLead.email}`} className="inline-flex items-center gap-1 text-zinc-600 hover:underline truncate">
                  <Mail className="h-3 w-3 text-zinc-400" /> {selectedLead.email}
                </a>
              )}
            </div>

            {/* At-a-glance badges */}
            {(selectedLead.businessType || (selectedLead.socialLinks && Object.values(selectedLead.socialLinks).some(Boolean)) || selectedLead.keyContacts.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedLead.businessType && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{selectedLead.businessType}</Badge>
                )}
                {selectedLead.socialLinks && Object.values(selectedLead.socialLinks).some(Boolean) && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{Object.values(selectedLead.socialLinks).filter(Boolean).length} social</Badge>
                )}
                {selectedLead.keyContacts.length > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    <Users className="h-2.5 w-2.5 mr-0.5" />{selectedLead.keyContacts.length}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions — only for search results, not saved contacts */}
          {selectedLead.isContact ? (
            <div className="border-t border-zinc-100 px-3 py-2">
              <Button
                size="sm"
                className="w-full h-7 text-xs bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                onClick={() => onOpenContactIntelligence(selectedLead)}
              >
                View in Contacts
              </Button>
            </div>
          ) : (
            <div className="border-t border-zinc-100 px-3 py-2 flex gap-2">
              {keptLeadIds.has(selectedLead.id) ? (
                <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Added to contacts
                </div>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                    onClick={() => { setKeptLeadIds((prev) => new Set(prev).add(selectedLead.id)); onKeepLead(selectedLead) }}
                  >
                    <Check className="mr-1 h-3 w-3" /> Keep
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 active:scale-[0.98]"
                    onClick={() => onRejectLead(selectedLead)}
                  >
                    <X className="mr-1 h-3 w-3" /> Reject
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right sidebar — only for search results (non-contact leads) */}
      {leads.filter((l) => !l.isContact).length > 0 && (
        <div className="absolute right-4 top-20 bottom-4 z-20 w-72 overflow-y-auto rounded-2xl border border-zinc-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="sticky top-0 border-b border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="text-sm font-semibold text-zinc-900">{leads.filter((l) => !l.isContact).length} results</div>
          </div>
          <div className="divide-y divide-zinc-100">
            {leads.filter((l) => !l.isContact).map((lead) => (
              <div
                key={lead.id}
                className={`px-4 py-2.5 transition-colors ${
                  selectedLeadId === lead.id ? "bg-zinc-100" : "hover:bg-zinc-50"
                }`}
              >
                <button
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium text-zinc-900">{lead.companyName}</div>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      lead.fitScore >= 70 ? "bg-emerald-50 text-emerald-700" : lead.fitScore >= 40 ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"
                    }`}>{lead.fitScore}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{lead.location}</span>
                  </div>
                </button>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {lead.isFresh && <Badge variant="outline" className="text-[10px] px-1.5 py-0">new</Badge>}
                  {keptLeadIds.has(lead.id) ? (
                    <span className="ml-auto text-[10px] font-medium text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" />Kept</span>
                  ) : (
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setKeptLeadIds((prev) => new Set(prev).add(lead.id)); onKeepLead(lead) }}
                        className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Keep this lead"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRejectLead(lead) }}
                        className="rounded-full p-1 text-red-500 hover:bg-red-50 transition-colors"
                        title="Reject and remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay — semi-transparent over the map */}
      {isResearching && leads.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-700" />
            </div>
            <div className="text-base font-semibold text-zinc-900">Searching and qualifying businesses</div>
            <div className="mt-2 text-sm text-zinc-500">The scraper is running across search, maps, and AI signals. Results will appear on the map automatically.</div>
          </div>
        </div>
      )}

      {/* Empty state overlay — only when truly nothing exists */}
      {!isResearching && leads.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
              <Search className="h-6 w-6 text-zinc-600" />
            </div>
            <div className="text-lg font-semibold text-zinc-900">Start your first discovery search</div>
            <p className="mt-2 text-sm text-zinc-500">
              Define what you want to find, then run the scraper to generate qualified businesses and contacts.
            </p>
            <div className="mt-5">
              <Button size="sm" onClick={onRunResearch}><Sparkles className="mr-2 h-4 w-4" />Open discovery setup</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
