'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'utilityai_cookie_consent'

type ConsentPreferences = {
    necessary: boolean
    analytics: boolean
    consentedAt: string
}

function getStoredConsent(): ConsentPreferences | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
        if (!raw) return null
        return JSON.parse(raw) as ConsentPreferences
    } catch {
        return null
    }
}

function storeConsent(preferences: ConsentPreferences) {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences))
}

export function CookieConsentBanner() {
    const [visible, setVisible] = useState(false)
    const [showPreferences, setShowPreferences] = useState(false)
    const [analytics, setAnalytics] = useState(false)

    useEffect(() => {
        const stored = getStoredConsent()
        if (!stored) {
            setVisible(true)
        }
    }, [])

    const handleAcceptAll = () => {
        storeConsent({
            necessary: true,
            analytics: true,
            consentedAt: new Date().toISOString(),
        })
        setVisible(false)
    }

    const handleAcceptNecessary = () => {
        storeConsent({
            necessary: true,
            analytics: false,
            consentedAt: new Date().toISOString(),
        })
        setVisible(false)
    }

    const handleSavePreferences = () => {
        storeConsent({
            necessary: true,
            analytics,
            consentedAt: new Date().toISOString(),
        })
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div
            id="cookie-consent-banner"
            role="dialog"
            aria-label="Cookie consent"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                background: 'var(--cookie-bg, hsl(224 71% 4%))',
                borderTop: '1px solid hsl(215 20% 25%)',
                padding: '16px 24px',
                color: 'hsl(210 20% 90%)',
                fontSize: '14px',
                lineHeight: '1.5',
            }}
        >
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <p style={{ margin: '0 0 12px 0' }}>
                    We use cookies to ensure the proper functioning of our service.
                    Strictly necessary cookies (authentication, session management) are
                    required and cannot be disabled. You may optionally allow analytics
                    cookies to help us improve the platform.{' '}
                    <Link
                        href="/privacy"
                        style={{ color: 'hsl(217 91% 60%)', textDecoration: 'underline' }}
                    >
                        Read our Privacy Policy
                    </Link>
                    .
                </p>

                {showPreferences && (
                    <div style={{ marginBottom: '12px' }}>
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '6px',
                                cursor: 'not-allowed',
                                opacity: 0.6,
                            }}
                        >
                            <input type="checkbox" checked disabled />
                            <span>
                                <strong>Strictly Necessary</strong> — Authentication &amp;
                                session cookies (always active)
                            </span>
                        </label>
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={analytics}
                                onChange={(e) => setAnalytics(e.target.checked)}
                            />
                            <span>
                                <strong>Analytics</strong> — Help us understand usage patterns
                            </span>
                        </label>
                    </div>
                )}

                <div
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                >
                    <button
                        id="cookie-accept-all"
                        onClick={handleAcceptAll}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'hsl(217 91% 60%)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        Accept All
                    </button>
                    <button
                        id="cookie-accept-necessary"
                        onClick={handleAcceptNecessary}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid hsl(215 20% 35%)',
                            background: 'transparent',
                            color: 'hsl(210 20% 90%)',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        Necessary Only
                    </button>
                    {!showPreferences ? (
                        <button
                            id="cookie-manage-preferences"
                            onClick={() => setShowPreferences(true)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1px solid hsl(215 20% 35%)',
                                background: 'transparent',
                                color: 'hsl(210 20% 90%)',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                            }}
                        >
                            Manage Preferences
                        </button>
                    ) : (
                        <button
                            id="cookie-save-preferences"
                            onClick={handleSavePreferences}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1px solid hsl(215 20% 35%)',
                                background: 'transparent',
                                color: 'hsl(210 20% 90%)',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                            }}
                        >
                            Save Preferences
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
