import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: {
        message: string
        code?: string
        details?: unknown
    }
    meta?: {
        page?: number
        limit?: number
        total?: number
    }
}

export function successResponse<T>(data: T, status = 200): NextResponse {
    return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(
    message: string,
    status = 400,
    details?: unknown
): NextResponse {
    return NextResponse.json(
        { success: false, error: { message, details } },
        { status }
    )
}

export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): NextResponse {
    return NextResponse.json({
        success: true,
        data,
        meta: { page, limit, total }
    })
}
